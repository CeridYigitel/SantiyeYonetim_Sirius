import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PersonnelManager() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ username: '', password: '', role: 'WORKER', supervisorIds: [], hasPurchasingAuthority: false });

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [usersRes, sitesRes] = await Promise.all([
        axios.get('http://localhost:8080/api/personnel/users/admin/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8080/api/operation/sites', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data); setSites(sitesRes.data);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      if (decoded.role === 'ADMIN') { setIsAdmin(true); loadData(); } else { setLoading(false); }
    } else { setLoading(false); }
  }, []);

  const foremenList = users.filter(u => u.role === 'FOREMAN');

  const getSupervisorNames = (supervisorIds) => {
    if (!supervisorIds || supervisorIds.length === 0) return "-";
    return supervisorIds.map(id => {
      const foreman = users.find(u => String(u.id) === String(id));
      return foreman ? foreman.username : `ID: ${id}`;
    }).join(', ');
  };

  const getUserSites = (userId) => {
    if (sites.length === 0) return "-";
    const userSites = sites.filter(site => site.workerIds && site.workerIds.includes(userId));
    if (userSites.length === 0) return t('none');
    return userSites.map(site => site.name).join(', ');
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditMode(true); setCurrentEditingId(user.id);
      setFormData({ username: user.username, password: '', role: user.role, supervisorIds: user.supervisorIds || [], hasPurchasingAuthority: user.hasPurchasingAuthority || false });
    } else {
      setEditMode(false); setCurrentEditingId(null);
      setFormData({ username: '', password: '', role: 'WORKER', supervisorIds: [], hasPurchasingAuthority: false });
    }
    setIsModalOpen(true);
  };

  const handleForemanCheckboxChange = (foremanId) => {
    setFormData(prev => {
      const isAlreadySelected = prev.supervisorIds.includes(foremanId);
      if (isAlreadySelected) return { ...prev, supervisorIds: prev.supervisorIds.filter(id => id !== foremanId) };
      else return { ...prev, supervisorIds: [...prev.supervisorIds, foremanId] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const payload = { username: formData.username, role: formData.role, supervisorIds: formData.role === 'WORKER' ? formData.supervisorIds.map(id => parseInt(id)) : [], hasPurchasingAuthority: formData.role === 'ADMIN' ? true : formData.hasPurchasingAuthority };
      if (!editMode || (editMode && formData.password)) payload.password = formData.password;
      if (editMode) await axios.put(`http://localhost:8080/api/personnel/users/admin/${currentEditingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      else await axios.post('http://localhost:8080/api/personnel/users/admin/create', payload, { headers: { Authorization: `Bearer ${token}` } });
      setIsModalOpen(false); loadData();
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Emin misiniz?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/personnel/users/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch (err) {}
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">{t('loading')}</div>;
  if (!isAdmin) return <div className="p-12 text-center text-red-600 font-black">{t('unauthorized')}</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
        <h2 className="text-xl font-black text-slate-800">{t('personnel_management')}</h2>
        <button onClick={() => handleOpenModal()} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-emerald-700 transition shadow-lg transform active:scale-95">{t('new_personnel')}</button>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="min-w-full text-left text-sm bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <thead className="bg-slate-800 text-slate-100 text-xs font-bold uppercase tracking-widest">
            <tr>
              <th className="px-4 py-4">ID</th>
              <th className="px-4 py-4">{t('username')}</th>
              <th className="px-4 py-4">{t('role')}</th>
              <th className="px-4 py-4">{t('auth')}</th>
              <th className="px-4 py-4">{t('supervisors')}</th>
              <th className="px-4 py-4">{t('assigned_sites')}</th>
              <th className="px-4 py-4 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 font-black text-slate-400">#{u.id}</td>
                <td className="px-4 py-4 font-bold text-slate-800">{u.username}</td>
                <td className="px-4 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black border ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'FOREMAN' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{t(u.role.toLowerCase())}</span></td>
                <td className="px-4 py-4">
                  {u.hasPurchasingAuthority ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-max shadow-sm"><span className="text-xs tracking-wider">{t('active')}</span></div>
                  ) : <div className="flex items-center gap-1.5 text-red-500 font-bold bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 w-max opacity-80"><span className="text-xs tracking-wider">{t('none')}</span></div>}
                </td>
                <td className="px-4 py-4 font-medium text-slate-600 max-w-[150px] truncate" title={getSupervisorNames(u.supervisorIds)}>{u.role === 'WORKER' ? getSupervisorNames(u.supervisorIds) : '-'}</td>
                <td className="px-4 py-4 font-bold text-amber-600 max-w-[150px] truncate" title={getUserSites(u.id)}>{getUserSites(u.id)}</td>
                <td className="px-4 py-4 text-right space-x-3">
                  <button onClick={() => handleOpenModal(u)} className="text-blue-600 font-bold">{t('edit')}</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 font-bold">{t('delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-black text-xl mb-6">{editMode ? t('edit') : t('new_personnel')}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('username')}</label>
                <input type="text" required className="w-full px-4 py-3 border rounded-xl" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('password')} {editMode && <span className="text-slate-400 normal-case font-medium">{t('password_hint')}</span>}</label>
                <input type={editMode ? "password" : "text"} required={!editMode} className="w-full px-4 py-3 border rounded-xl" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('role')}</label>
                <select required className="w-full px-4 py-3 border rounded-xl bg-white" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value, supervisorIds: [], hasPurchasingAuthority: e.target.value === 'ADMIN' ? true : formData.hasPurchasingAuthority})}>
                  <option value="WORKER">{t('worker')}</option>
                  <option value="FOREMAN">{t('foreman')}</option>
                  <option value="ADMIN">{t('admin')}</option>
                </select>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
                <input type="checkbox" id="authCheck" className="w-5 h-5 text-indigo-600 rounded border-indigo-300" checked={formData.role === 'ADMIN' ? true : formData.hasPurchasingAuthority} disabled={formData.role === 'ADMIN'} onChange={(e) => setFormData({...formData, hasPurchasingAuthority: e.target.checked})} />
                <div>
                  <label htmlFor="authCheck" className="text-sm font-black text-indigo-900 cursor-pointer block leading-tight">{t('auth')}</label>
                  <span className="text-[10px] font-bold text-indigo-600">{t('finance_auth_desc')}</span>
                </div>
              </div>
              {formData.role === 'WORKER' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-xs font-black uppercase text-slate-500 mb-3 tracking-wider">{t('supervisors')}</label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {foremenList.map(f => (
                      <label key={f.id} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" className="w-4 h-4 text-emerald-600 border-slate-300 rounded" checked={formData.supervisorIds.includes(f.id)} onChange={() => handleForemanCheckboxChange(f.id)} />
                        <span className="text-sm font-bold text-slate-700">{f.username}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
                <span className="text-blue-500 font-black">ℹ️</span>
                <p className="text-xs font-medium text-blue-800 leading-tight">{t('security_warning')}</p>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold">{t('cancel')}</button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg">{editMode ? t('update') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}