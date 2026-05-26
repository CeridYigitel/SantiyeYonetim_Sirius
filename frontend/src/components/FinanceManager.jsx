import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FinanceManager() {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ transactionDate: new Date().toISOString().split('T')[0], userId: '', description: '', siteId: '', income: 0, expense: 0 });
  const [exportData, setExportData] = useState({ allDates: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], siteId: 'all' });

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [financeRes, sitesRes, usersRes] = await Promise.all([
        axios.get('http://localhost:8080/api/operation/finance', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8080/api/operation/sites', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8080/api/personnel/users/admin/all', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRecords(financeRes.data); setSites(sitesRes.data); setUsers(usersRes.data);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token); setUserRole(decoded.role);
      if (decoded.role === 'ADMIN') setIsAdmin(true);
      loadData();
    }
  }, []);

  const getSiteName = (id) => { const site = sites.find(s => String(s.id) === String(id)); return site ? site.name : `ID: ${id}`; };
  const getUserName = (id) => { const user = users.find(u => String(u.id) === String(id)); return user ? user.username : `ID: ${id}`; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:8080/api/operation/finance', { ...formData, userId: parseInt(formData.userId), siteId: parseInt(formData.siteId), income: parseFloat(formData.income), expense: parseFloat(formData.expense) }, { headers: { Authorization: `Bearer ${token}`, 'X-User-Role': userRole } });
      setIsModalOpen(false);
      setFormData({ transactionDate: new Date().toISOString().split('T')[0], userId: '', description: '', siteId: '', income: 0, expense: 0 });
      loadData();
    } catch (err) {}
  };

  const handleExportSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      let queryParams = [];
      if (!exportData.allDates) { queryParams.push(`startDate=${exportData.startDate}`); queryParams.push(`endDate=${exportData.endDate}`); }
      if (exportData.siteId !== 'all') queryParams.push(`siteId=${exportData.siteId}`);
      const url = `http://localhost:8080/api/operation/finance/export?${queryParams.join('&')}`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = downloadUrl; link.setAttribute('download', `finans_raporu_${new Date().toISOString().split('T')[0]}.xlsx`); document.body.appendChild(link); link.click(); link.remove();
      setIsExportModalOpen(false);
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Emin misiniz?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/operation/finance/${id}`, { headers: { Authorization: `Bearer ${token}`, 'X-User-Role': userRole } });
      loadData();
    } catch (err) {}
  };

  const totalIncome = records.reduce((acc, curr) => acc + (curr.income || 0), 0);
  const totalExpense = records.reduce((acc, curr) => acc + (curr.expense || 0), 0);
  const netBalance = totalIncome - totalExpense;

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">{t('loading')}</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
        <h2 className="text-xl font-black text-slate-800">{t('finance_records')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsExportModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-emerald-700 transition shadow-lg flex items-center gap-2">{t('export_excel')}</button>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-700 transition shadow-lg">{t('new_transaction')}</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-100">
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('total_income')}</p>
          <p className="text-xl font-black text-emerald-600">{totalIncome.toLocaleString()} ₸</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('total_expense')}</p>
          <p className="text-xl font-black text-red-600">{totalExpense.toLocaleString()} ₸</p>
        </div>
        <div className={`bg-white p-4 rounded-xl border shadow-sm ${netBalance >= 0 ? 'border-blue-100' : 'border-orange-100'}`}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('net_balance')}</p>
          <p className={`text-xl font-black ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{netBalance.toLocaleString()} ₸</p>
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="min-w-full text-left text-sm bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <thead className="bg-slate-800 text-slate-100 text-xs font-bold uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">{t('date')}</th>
              <th className="px-4 py-3">{t('transaction_by')}</th>
              <th className="px-4 py-3">{t('site')}</th>
              <th className="px-4 py-3">{t('description')}</th>
              <th className="px-4 py-3 text-emerald-400">{t('income')}</th>
              <th className="px-4 py-3 text-red-400">{t('expense')}</th>
              {isAdmin && <th className="px-4 py-3 text-right">{t('actions')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-600">{new Date(record.transactionDate).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{getUserName(record.userId)}</td>
                <td className="px-4 py-3 font-bold text-amber-700">{getSiteName(record.siteId)}</td>
                <td className="px-4 py-3 text-slate-600">{record.description}</td>
                <td className="px-4 py-3 font-black text-emerald-600">{record.income > 0 ? `+${record.income}` : '-'}</td>
                <td className="px-4 py-3 font-black text-red-600">{record.expense > 0 ? `-${record.expense}` : '-'}</td>
                {isAdmin && <td className="px-4 py-3 text-right"><button onClick={() => handleDelete(record.id)} className="text-red-500 font-bold">{t('delete')}</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-xl mb-6">{t('export_options')}</h3>
            <form onSubmit={handleExportSubmit} className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-slate-500">{t('date_range')}</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-emerald-600">
                    <input type="checkbox" className="rounded border-slate-300 text-emerald-600 w-4 h-4" checked={exportData.allDates} onChange={(e) => setExportData({...exportData, allDates: e.target.checked})} />
                    {t('all_dates')}
                  </label>
                </div>
                {!exportData.allDates && (
                  <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t('start')}</label><input type="date" required className="w-full px-3 py-2 border rounded-lg text-sm" value={exportData.startDate} onChange={(e) => setExportData({...exportData, startDate: e.target.value})} /></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t('end')}</label><input type="date" required className="w-full px-3 py-2 border rounded-lg text-sm" value={exportData.endDate} onChange={(e) => setExportData({...exportData, endDate: e.target.value})} /></div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('filter_site')}</label>
                <select required className="w-full px-4 py-3 border rounded-xl bg-white font-bold text-slate-700" value={exportData.siteId} onChange={(e) => setExportData({...exportData, siteId: e.target.value})}>
                  <option value="all">{t('all_sites')}</option>
                  {sites.map(s => <option key={s.id} value={s.id}>🏢 {s.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsExportModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold">{t('cancel')}</button>
                <button type="submit" className="px-8 py-2 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700">{t('download_excel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="font-black text-xl mb-6">{t('new_transaction')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-black uppercase text-slate-500 mb-1">{t('date')}</label><input type="date" required className="w-full px-4 py-2 border rounded-xl" value={formData.transactionDate} onChange={(e) => setFormData({...formData, transactionDate: e.target.value})} /></div>
                <div><label className="block text-xs font-black uppercase text-slate-500 mb-1">{t('transaction_by')}</label><select required className="w-full px-4 py-2 border rounded-xl bg-white" value={formData.userId} onChange={(e) => setFormData({...formData, userId: e.target.value})}><option value="">{t('select')}</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-black uppercase text-slate-500 mb-1">{t('site')}</label><select required className="w-full px-4 py-2 border rounded-xl bg-white" value={formData.siteId} onChange={(e) => setFormData({...formData, siteId: e.target.value})}><option value="">{t('select')}</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="block text-xs font-black uppercase text-slate-500 mb-1">{t('description')}</label><input type="text" required className="w-full px-4 py-2 border rounded-xl" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><label className="block text-xs font-black uppercase text-emerald-600 mb-1">{t('income')}</label><input type="number" min="0" step="0.01" className="w-full px-4 py-2 border rounded-xl font-bold text-emerald-600" value={formData.income} onChange={(e) => setFormData({...formData, income: e.target.value})} /></div>
                <div><label className="block text-xs font-black uppercase text-red-600 mb-1">{t('expense')}</label><input type="number" min="0" step="0.01" className="w-full px-4 py-2 border rounded-xl font-bold text-red-600" value={formData.expense} onChange={(e) => setFormData({...formData, expense: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold">{t('cancel')}</button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-black rounded-xl">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}