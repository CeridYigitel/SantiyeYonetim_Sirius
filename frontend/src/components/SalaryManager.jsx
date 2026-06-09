import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

export default function SalaryManager() {
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);

  // Filtre State'leri
  const [dateFilter, setDateFilter] = useState({ isAll: true, start: '', end: '' });
  const [siteFilter, setSiteFilter] = useState({ isAll: true, selectedId: '' });
  const [personnelFilter, setPersonnelFilter] = useState({ isAll: true, selectedId: '' });

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded.role !== 'ADMIN') {
          setLoading(false);
          return;
        }
        setIsAdmin(true);

        const [usersRes, sitesRes, logsRes] = await Promise.all([
          axios.get('http://localhost:8080/api/personnel/users/admin/all', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/operation/sites', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/operation/work-logs', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setUsers(usersRes.data);
        setSites(sitesRes.data);
        setWorkLogs(logsRes.data);
      } catch (err) {
        console.error("Maaş verileri çekilirken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSiteChange = (e) => {
    setSiteFilter({ isAll: false, selectedId: e.target.value });
    setPersonnelFilter({ isAll: true, selectedId: '' });
  };

  const handleSiteCheckboxChange = (e) => {
    const checked = e.target.checked;
    setSiteFilter({ isAll: checked, selectedId: checked ? '' : siteFilter.selectedId });
    setPersonnelFilter({ isAll: true, selectedId: '' });
  };

  const getFilteredPersonnel = () => {
    if (siteFilter.isAll || !siteFilter.selectedId) return users;
    const site = sites.find(s => String(s.id) === String(siteFilter.selectedId));
    if (!site || !site.workerIds) return [];
    return users.filter(u => site.workerIds.includes(u.id));
  };

  const handleCalculate = () => {
    const filteredLogs = workLogs.filter(log => {
      if (!dateFilter.isAll) {
        if (!dateFilter.start || !dateFilter.end) return false;
        const logDate = new Date(log.workDate);
        const startDate = new Date(dateFilter.start);
        const endDate = new Date(dateFilter.end);
        if (logDate < startDate || logDate > endDate) return false;
      }
      
      if (!siteFilter.isAll && siteFilter.selectedId) {
        if (String(log.siteId) !== String(siteFilter.selectedId)) return false;
      }

      if (!personnelFilter.isAll && personnelFilter.selectedId) {
        if (String(log.userId) !== String(personnelFilter.selectedId)) return false;
      }

      return true;
    });

    const groups = {};
    filteredLogs.forEach(log => {
      const key = `${log.userId}_${log.siteId}`;
      if (!groups[key]) {
        groups[key] = { userId: log.userId, siteId: log.siteId, totalHours: 0 };
      }
      groups[key].totalHours += parseFloat(log.hours || 0);
    });

    const result = Object.values(groups).map(g => {
      const user = users.find(u => String(u.id) === String(g.userId)) || {};
      const site = sites.find(s => String(s.id) === String(g.siteId)) || {};
      const hourlyWage = parseFloat(user.hourlyWage || 1000);
      
      const dateText = dateFilter.isAll 
        ? t('all_times') 
        : `${dateFilter.start.split('-').reverse().join('.')} - ${dateFilter.end.split('-').reverse().join('.')}`;

      return {
        dateRange: dateText,
        username: user.username || `ID: ${g.userId}`,
        siteName: site.name || `ID: ${g.siteId}`,
        totalHours: g.totalHours,
        hourlyWage: hourlyWage,
        totalWage: g.totalHours * hourlyWage
      };
    });

    setTableData(result);
  };

  const handleExportExcel = () => {
    if (tableData.length === 0) return;

    const worksheetData = tableData.map(row => ({
      [t('calculated_date_range')]: row.dateRange,
      [t('personnel_name')]: row.username,
      [t('site')]: row.siteName,
      [t('total_hours')]: row.totalHours,
      [t('hourly_wage')]: row.hourlyWage,
      [t('total_wage')]: row.totalWage
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maaş Raporu");

    const maxChars = worksheetData.reduce((acc, row) => {
      Object.keys(row).forEach((key, i) => {
        const val = row[key] ? row[key].toString() : '';
        const len = Math.max(val.length, key.length);
        acc[i] = Math.max(acc[i] || 0, len);
      });
      return acc;
    }, []);
    worksheet['!cols'] = maxChars.map(w => ({ wch: w + 3 }));

    XLSX.writeFile(workbook, `Sirius_Maas_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">{t('loading')}</div>;
  if (!isAdmin) return <div className="p-12 text-center text-red-600 font-black">{t('unauthorized')}</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
        <h2 className="text-xl font-black text-slate-800">{t('salary_calc_title')}</h2>
        {tableData.length > 0 && (
          <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm">
            {t('download_excel_xlsx')}
          </button>
        )}
      </div>

      <div className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-4 items-end">
        {/* Tarih */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-black uppercase text-slate-500">{t('date_range')}</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={dateFilter.isAll} onChange={(e) => setDateFilter({...dateFilter, isAll: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-xs font-bold text-slate-700">{t('all_dates').split(' ')[0]}</span> {/* Sadece "HEPSİ" kısmını almak için */}
            </label>
          </div>
          {!dateFilter.isAll ? (
            <div className="flex gap-2">
              <input type="date" value={dateFilter.start} onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm font-bold bg-slate-50" />
              <input type="date" value={dateFilter.end} onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm font-bold bg-slate-50" />
            </div>
          ) : (
            <div className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm font-bold bg-slate-50 text-slate-400 text-center">{t('all_times')}</div>
          )}
        </div>

        {/* Şantiye */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-black uppercase text-slate-500">{t('site')}</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={siteFilter.isAll} onChange={handleSiteCheckboxChange} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-xs font-bold text-slate-700">{t('all_dates').split(' ')[0]}</span>
            </label>
          </div>
          {!siteFilter.isAll ? (
            <select value={siteFilter.selectedId} onChange={handleSiteChange} className="w-full px-3 py-2 border rounded-lg text-sm font-bold bg-slate-50">
              <option value="" disabled>{t('select_site_placeholder')}</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          ) : (
             <div className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm font-bold bg-slate-50 text-slate-400 text-center">{t('all_sites')}</div>
          )}
        </div>

        {/* Personel */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-black uppercase text-slate-500">{t('personnel')}</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={personnelFilter.isAll} onChange={(e) => setPersonnelFilter({ isAll: e.target.checked, selectedId: e.target.checked ? '' : personnelFilter.selectedId })} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-xs font-bold text-slate-700">{t('all_dates').split(' ')[0]}</span>
            </label>
          </div>
          {!personnelFilter.isAll ? (
            <select value={personnelFilter.selectedId} onChange={(e) => setPersonnelFilter({ isAll: false, selectedId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm font-bold bg-slate-50">
              <option value="" disabled>{t('select_personnel_placeholder')}</option>
              {getFilteredPersonnel().map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          ) : (
            <div className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm font-bold bg-slate-50 text-slate-400 text-center">{t('all_personnel_selected')}</div>
          )}
        </div>

        <button onClick={handleCalculate} className="w-full md:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-black hover:bg-blue-700 transition shadow-lg transform active:scale-95 whitespace-nowrap">
          {t('calculate')}
        </button>
      </div>

      {/* Tablo */}
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <thead className="bg-slate-800 text-slate-100 text-xs font-bold uppercase tracking-widest">
            <tr>
              <th className="px-4 py-4">{t('calculated_date_range')}</th>
              <th className="px-4 py-4">{t('personnel_name')}</th>
              <th className="px-4 py-4">{t('site')}</th>
              <th className="px-4 py-4 text-center">{t('total_hours')}</th>
              <th className="px-4 py-4 text-right">{t('hourly_wage')}</th>
              <th className="px-4 py-4 text-right">{t('total_wage')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableData.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-slate-400 font-bold">{t('salary_click_calculate_hint')}</td>
              </tr>
            ) : (
              tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-medium text-slate-600">{row.dateRange}</td>
                  <td className="px-4 py-4 font-black text-slate-800">{row.username}</td>
                  <td className="px-4 py-4 font-bold text-amber-600">{row.siteName}</td>
                  <td className="px-4 py-4 font-black text-blue-600 text-center">{row.totalHours}</td>
                  <td className="px-4 py-4 font-bold text-emerald-600 text-right">{row.hourlyWage.toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US')} ₸</td>
                  <td className="px-4 py-4 font-black text-indigo-600 text-right text-lg">{row.totalWage.toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US')} ₸</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}