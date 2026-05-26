import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SiteManager() {
  const { t } = useTranslation();
  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '', startDate: new Date().toISOString().split('T')[0], plannedEndDate: new Date().toISOString().split('T')[0], workerIds: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [sitesRes, usersRes] = await Promise.all([
        axios.get('http://localhost:8080/api/operation/sites', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8080/api/personnel/users/admin/all', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSites(sitesRes.data);
      setUsers(usersRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const getUserName = (id) => {
    const user = users.find(u => String(u.id) === String(id));
    return user ? user.username : `ID: ${id}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editId) await axios.put(`http://localhost:8080/api/operation/sites/${editId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      else await axios.post('http://localhost:8080/api/operation/sites', formData, { headers: { Authorization: `Bearer ${token}` } });
      setIsModalOpen(false);
      setSearchTerm(''); 
      loadData();
    } catch (err) { alert("Hata oluştu."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu şantiyeyi silmek istediğinize emin misiniz?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/operation/sites/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch (err) { alert("Silinemedi."); }
  };

  const openNewModal = () => {
    setEditId(null); setSearchTerm('');
    setFormData({ name: '', startDate: new Date().toISOString().split('T')[0], plannedEndDate: new Date().toISOString().split('T')[0], workerIds: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (site) => {
    setEditId(site.id); setSearchTerm('');
    setFormData({ name: site.name, startDate: site.startDate ? new Date(site.startDate).toISOString().split('T')[0] : '', plannedEndDate: site.plannedEndDate ? new Date(site.plannedEndDate).toISOString().split('T')[0] : '', workerIds: site.workerIds || [] });
    setIsModalOpen(true);
  };

  const handleCheckboxChange = (userId) => {
    setFormData(prev => {
      const isSelected = prev.workerIds.includes(userId);
      if (isSelected) return { ...prev, workerIds: prev.workerIds.filter(id => id !== userId) };
      else return { ...prev, workerIds: [...prev.workerIds, userId] };
    });
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.role.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">{t('site_management')}</h2>
        <button onClick={openNewModal} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition shadow-sm">
          {t('new_site')}
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center text-slate-500 py-8 font-bold animate-pulse">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">{t('site_name')}</th>
                  <th className="px-4 py-3 text-left">{t('start_date')}</th>
                  <th className="px-4 py-3 text-left">{t('end_date')}</th>
                  <th className="px-4 py-3 text-left">{t('working_personnel')}</th>
                  <th className="px-4 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sites.map(site => (
                  <tr key={site.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-400">#{site.id}</td>
                    <td className="px-4 py-3 font-black text-amber-700">{site.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{site.startDate ? new Date(site.startDate).toLocaleDateString('tr-TR') : '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{site.plannedEndDate ? new Date(site.plannedEndDate).toLocaleDateString('tr-TR') : '-'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">
                      {site.workerIds && site.workerIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {site.workerIds.map(wId => (
                            <span key={wId} title={`ID: ${wId}`} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs border border-emerald-100">{getUserName(wId)}</span>
                          ))}
                        </div>
                      ) : <span className="text-slate-400 font-normal">{t('none')}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEditModal(site)} className="text-blue-600 hover:text-blue-800 font-bold mr-3">{t('edit')}</button>
                      <button onClick={() => handleDelete(site.id)} className="text-red-600 hover:text-red-800 font-bold">{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="font-black text-2xl text-slate-800">{editId ? t('edit') : t('new_site')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl font-bold transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
                <div className="md:col-span-1">
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('site_name')}</label>
                  <input type="text" required className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('start_date')}</label>
                  <input type="date" required className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('end_date')}</label>
                  <input type="date" required className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={formData.plannedEndDate} onChange={e => setFormData({...formData, plannedEndDate: e.target.value})} />
                </div>
              </div>
              <div className="flex flex-col flex-1 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">{t('working_personnel')} <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">{formData.workerIds.length}</span></h4>
                  <div className="relative w-64">
                    <input type="text" placeholder={t('search_personnel')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none" />
                  </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1 max-h-[400px]">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-bold">{t('none')}</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredUsers.map(u => (
                        <label key={u.id} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.workerIds.includes(u.id) ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-transparent bg-white hover:border-slate-300 shadow-sm'}`}>
                          <input type="checkbox" className="w-5 h-5 text-amber-600 rounded border-slate-300 mr-3" checked={formData.workerIds.includes(u.id)} onChange={() => handleCheckboxChange(u.id)} />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{u.username}</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded w-max mt-1 ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'FOREMAN' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 shrink-0 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">{t('cancel')}</button>
                <button type="submit" className="px-8 py-3 bg-amber-600 text-white font-black rounded-xl hover:bg-amber-700 shadow-lg">{editId ? t('update') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}