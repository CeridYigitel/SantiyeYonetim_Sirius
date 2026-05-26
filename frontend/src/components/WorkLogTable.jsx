import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function WorkLogTable() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [availableWorkers, setAvailableWorkers] = useState([]); 
  const [workTypes, setWorkTypes] = useState([]); 
  const [sites, setSites] = useState([]); 

  const [formData, setFormData] = useState({
    workerId: '', siteId: '', workType: '', amount: '', hours: '', 
    workDate: new Date().toISOString().split('T')[0], notes: '' 
  });

  const [exportData, setExportData] = useState({
    allDates: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], siteId: 'all'
  });
  
  const [submitError, setSubmitError] = useState('');
  const [user, setUser] = useState({ id: '', role: '', sub: '' });

  const getWorkerName = (id) => {
    const worker = availableWorkers.find(w => String(w.id) === String(id));
    return worker ? worker.username : `ID: ${id}`;
  };

  const getSiteName = (id) => {
    const site = sites.find(s => String(s.id) === String(id));
    return site ? site.name : `ID: ${id}`;
  };

  const initComponent = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const currentUserId = decoded.sub; 
      const currentUserRole = decoded.role || '';
      
      let realUsername = `ID: ${currentUserId}`; 
      try {
        const meResponse = await axios.get(`http://localhost:8080/api/personnel/users/${currentUserId}`, { headers: { Authorization: `Bearer ${token}` }});
        realUsername = meResponse.data.username; 
      } catch (err) {}

      setUser({ id: currentUserId, role: currentUserRole, sub: realUsername });

      try {
        const [typesRes, sitesRes] = await Promise.all([
          axios.get('http://localhost:8080/api/operation/work-logs/types', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/operation/sites', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setWorkTypes(typesRes.data); 
        setSites(sitesRes.data);
      } catch (err) {}

      if (currentUserRole === 'WORKER') {
        setAvailableWorkers([{ id: currentUserId, username: realUsername }]);
      } else {
        const endpoint = currentUserRole === 'ADMIN' 
          ? 'http://localhost:8080/api/personnel/users/all-users'
          : `http://localhost:8080/api/personnel/users/my-subordinates?supervisorId=${currentUserId}`;
        try {
          const workerResponse = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
          const filteredWorkers = workerResponse.data.filter(w => String(w.id) !== String(currentUserId));
          setAvailableWorkers([{ id: currentUserId, username: realUsername }, ...filteredWorkers]);
        } catch (err) { setAvailableWorkers([]); }
      }
      await loadLogs(currentUserId, currentUserRole, token);
    } catch (err) {
      setError("Bir hata oluştu.");
    } finally { setLoading(false); }
  };

  const loadLogs = async (userId, role, token) => {
    try {
      const logResponse = await axios.get('http://localhost:8080/api/operation/work-logs', { headers: { Authorization: `Bearer ${token}`, 'X-User-Id': String(userId), 'X-User-Role': role } });
      setLogs(logResponse.data);
    } catch (err) { setError("Kayıtlar çekilemedi."); }
  };

  useEffect(() => { initComponent(); }, []);

  const handleExportSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      let queryParams = [];
      if (!exportData.allDates) {
        queryParams.push(`startDate=${exportData.startDate}`);
        queryParams.push(`endDate=${exportData.endDate}`);
      }
      if (exportData.siteId !== 'all') queryParams.push(`siteId=${exportData.siteId}`);

      const url = `http://localhost:8080/api/operation/work-logs/export?${queryParams.join('&')}`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `is_kayitlari_raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setIsExportModalOpen(false);
    } catch (err) { alert("Excel raporu indirilirken bir hata oluştu."); }
  };

  const handleEditClick = (log) => {
    setEditId(log.id);
    setFormData({
      workerId: String(log.userId), siteId: String(log.siteId), workType: log.workType, amount: log.amount, hours: log.hours,
      workDate: log.workDate ? new Date(log.workDate).toISOString().split('T')[0] : '', notes: log.notes || ''
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Bu iş kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/operation/work-logs/${id}`, { headers: { Authorization: `Bearer ${token}`, 'X-User-Id': String(user.id), 'X-User-Role': user.role } });
      loadLogs(user.id, user.role, token); 
    } catch (err) { alert("Kayıt silinirken bir hata oluştu."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        workerId: parseInt(formData.workerId), siteId: parseInt(formData.siteId), workType: formData.workType, amount: parseFloat(formData.amount),
        hours: parseFloat(formData.hours), workDate: formData.workDate, notes: formData.notes
      };
      const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': String(user.id), 'X-User-Role': user.role };

      if (editId) await axios.put(`http://localhost:8080/api/operation/work-logs/${editId}`, payload, { headers });
      else await axios.post('http://localhost:8080/api/operation/work-logs', payload, { headers });

      setIsModalOpen(false);
      loadLogs(user.id, user.role, token); 
    } catch (err) { setSubmitError('İşlem sırasında hata oluştu.'); }
  };

  const openNewRecordModal = () => {
    setEditId(null);
    setSubmitError('');
    setFormData({
      workerId: user.role === 'WORKER' ? String(user.id) : '', siteId: '', workType: workTypes.length > 0 ? workTypes[0] : '',
      amount: '', hours: '', workDate: new Date().toISOString().split('T')[0], notes: ''
    });
    setIsModalOpen(true);
  };

  const availableSitesForWorker = sites.filter(site => {
    if (!formData.workerId) return false;
    return site.workerIds && site.workerIds.includes(parseInt(formData.workerId));
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">{t('work_logs')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsExportModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5">
            {t('export_excel')}
          </button>
          {user.role !== 'WORKER' && (
            <button onClick={openNewRecordModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
              {t('new_work_log')}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse font-medium">{t('loading')}</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 m-4 rounded-xl border border-dashed border-red-200">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">{t('no_records')}</div>
        ) : (
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4">{t('site')}</th>
                <th className="px-6 py-4">{t('personnel')}</th>
                <th className="px-6 py-4">{t('hours')}</th>
                <th className="px-6 py-4">{t('work_type')}</th>
                <th className="px-6 py-4">{t('amount')}</th>
                <th className="px-6 py-4">{t('notes')}</th>
                {user.role !== 'WORKER' && <th className="px-6 py-4 text-right">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-600">{log.workDate ? new Date(log.workDate).toLocaleDateString('tr-TR') : '---'}</td>
                  <td className="px-6 py-4 font-bold text-amber-700">{getSiteName(log.siteId)}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{getWorkerName(log.userId)}</td>
                  <td className="px-6 py-4 font-black text-slate-700">{log.hours}</td>
                  <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-black border border-blue-100">{log.workType}</span></td>
                  <td className="px-6 py-4 font-black text-emerald-600 text-base">{log.amount}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={log.notes}>{log.notes || '-'}</td>
                  {user.role !== 'WORKER' && (
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEditClick(log)} className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1 rounded-md transition">{t('edit')}</button>
                      <button onClick={() => handleDeleteClick(log.id)} className="text-red-600 hover:text-red-800 font-bold bg-red-50 px-3 py-1 rounded-md transition">{t('delete')}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-slate-800">{t('export_options')}</h3>
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
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t('start')}</label>
                      <input type="date" required className="w-full px-3 py-2 border rounded-lg text-sm" value={exportData.startDate} onChange={(e) => setExportData({...exportData, startDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t('end')}</label>
                      <input type="date" required className="w-full px-3 py-2 border rounded-lg text-sm" value={exportData.endDate} onChange={(e) => setExportData({...exportData, endDate: e.target.value})} />
                    </div>
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
                <button type="submit" className="px-8 py-2 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg transform active:scale-95 transition flex items-center gap-2">
                  {t('download_excel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-slate-800">{editId ? t('edit') : t('new_work_log')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 text-2xl font-bold transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm border border-red-100 font-bold">{submitError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('date')}</label>
                  <input type="date" required className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none" value={formData.workDate} onChange={(e) => setFormData({...formData, workDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('personnel')}</label>
                  <select required disabled={user.role === 'WORKER'} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none" value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value, siteId: ''})}>
                    <option value="">{t('select')}</option>
                    {availableWorkers.map(w => <option key={w.id} value={w.id}>{w.username}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('site')}</label>
                <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none" value={formData.siteId} onChange={(e) => setFormData({...formData, siteId: e.target.value})} disabled={!formData.workerId}>
                  <option value="">{!formData.workerId ? t('select_personnel') : t('select_site')}</option>
                  {availableSitesForWorker.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('hours')}</label>
                  <input type="number" required step="0.5" min="0.5" className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold" value={formData.hours} onChange={(e) => setFormData({...formData, hours: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('work_type')}</label>
                  <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white" value={formData.workType} onChange={(e) => setFormData({...formData, workType: e.target.value})}>
                    {workTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('amount')}</label>
                  <input type="number" required step="0.1" min="0" className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-emerald-600" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('notes')}</label>
                <textarea rows="2" className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none outline-none" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold rounded-xl hover:bg-slate-50">{t('cancel')}</button>
                <button type="submit" disabled={!formData.siteId} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transform active:scale-95">
                  {editId ? t('update') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}