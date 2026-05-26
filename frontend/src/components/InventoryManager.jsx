import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function InventoryManager() {
  const { t } = useTranslation();
  const [inventories, setInventories] = useState([]);
  const [sites, setSites] = useState([]);
  const [visibleUsers, setVisibleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [userContext, setUserContext] = useState({ id: '', role: '' });

  const [formData, setFormData] = useState({ itemName: '', registrationDate: new Date().toISOString().split('T')[0], siteId: '', quantity: 1, assignedUserId: '', status: 'SAGLAM', notes: '' });

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      setUserContext({ id: decoded.sub, role: decoded.role });
      const sitesRes = await axios.get('http://localhost:8080/api/operation/sites', { headers: { Authorization: `Bearer ${token}` } });
      setSites(sitesRes.data);
      let allowedUsers = [];
      if (decoded.role === 'ADMIN') {
        const usersRes = await axios.get('http://localhost:8080/api/personnel/users/admin/all', { headers: { Authorization: `Bearer ${token}` } });
        allowedUsers = usersRes.data;
      } else if (decoded.role === 'FOREMAN') {
        const subRes = await axios.get(`http://localhost:8080/api/personnel/users/my-subordinates?supervisorId=${decoded.sub}`, { headers: { Authorization: `Bearer ${token}` } });
        const meRes = await axios.get(`http://localhost:8080/api/personnel/users/${decoded.sub}`, { headers: { Authorization: `Bearer ${token}` } });
        allowedUsers = [meRes.data, ...subRes.data];
      } else {
        const meRes = await axios.get(`http://localhost:8080/api/personnel/users/${decoded.sub}`, { headers: { Authorization: `Bearer ${token}` } });
        allowedUsers = [meRes.data];
      }
      setVisibleUsers(allowedUsers);
      const userIdsParam = allowedUsers.map(u => u.id).join(',');
      const invUrl = decoded.role === 'ADMIN' ? 'http://localhost:8080/api/operation/inventory' : `http://localhost:8080/api/operation/inventory/by-users?userIds=${userIdsParam}`;
      const invRes = await axios.get(invUrl, { headers: { Authorization: `Bearer ${token}`, 'X-User-Role': decoded.role } });
      setInventories(invRes.data);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const getSiteName = (id) => {
    const site = sites.find(s => String(s.id) === String(id));
    return site ? site.name : `ID: ${id}`;
  };

  const getUserName = (id) => {
    const user = visibleUsers.find(u => String(u.id) === String(id));
    return user ? user.username : `ID: ${id}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const payload = { ...formData, siteId: parseInt(formData.siteId), quantity: parseInt(formData.quantity), assignedUserId: parseInt(formData.assignedUserId) };
      const headers = { Authorization: `Bearer ${token}`, 'X-User-Role': userContext.role };
      if (editId) await axios.put(`http://localhost:8080/api/operation/inventory/${editId}`, payload, { headers });
      else await axios.post('http://localhost:8080/api/operation/inventory', payload, { headers });
      setIsModalOpen(false); loadData();
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Emin misiniz?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/operation/inventory/${id}`, { headers: { Authorization: `Bearer ${token}`, 'X-User-Role': userContext.role } });
      loadData();
    } catch (err) {}
  };

  const openNewModal = () => {
    setEditId(null); setFormData({ itemName: '', registrationDate: new Date().toISOString().split('T')[0], siteId: '', quantity: 1, assignedUserId: '', status: 'SAGLAM', notes: '' }); setIsModalOpen(true);
  };

  const openEditModal = (inv) => {
    setEditId(inv.id); setFormData({ itemName: inv.itemName, registrationDate: inv.registrationDate ? new Date(inv.registrationDate).toISOString().split('T')[0] : '', siteId: String(inv.siteId), quantity: inv.quantity, assignedUserId: String(inv.assignedUserId), status: inv.status, notes: inv.notes || '' }); setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">{t('loading')}</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">{t('inventory_list')}</h2>
        {userContext.role === 'ADMIN' && <button onClick={openNewModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">{t('new_inventory')}</button>}
      </div>
      <div className="overflow-x-auto">
        {inventories.length === 0 ? <div className="p-12 text-center text-slate-400 font-medium">{t('none')}</div> : (
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4">{t('item_name')}</th>
                <th className="px-6 py-4">{t('site')}</th>
                <th className="px-6 py-4">{t('quantity')}</th>
                <th className="px-6 py-4">{t('assigned_to')}</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4">{t('notes')}</th>
                {userContext.role === 'ADMIN' && <th className="px-6 py-4 text-right">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventories.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-600">{inv.registrationDate ? new Date(inv.registrationDate).toLocaleDateString('tr-TR') : '-'}</td>
                  <td className="px-6 py-4 font-black text-slate-800">{inv.itemName}</td>
                  <td className="px-6 py-4 font-bold text-amber-700">{getSiteName(inv.siteId)}</td>
                  <td className="px-6 py-4 font-black text-blue-600">{inv.quantity}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{getUserName(inv.assignedUserId)}</td>
                  <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-black border">{inv.status}</span></td>
                  <td className="px-6 py-4 text-slate-500 max-w-[150px] truncate" title={inv.notes}>{inv.notes || '-'}</td>
                  {userContext.role === 'ADMIN' && (
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openEditModal(inv)} className="text-blue-600 font-bold">{t('edit')}</button>
                      <button onClick={() => handleDelete(inv.id)} className="text-red-600 font-bold">{t('delete')}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && userContext.role === 'ADMIN' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-slate-800">{editId ? t('edit') : t('new_inventory')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 text-2xl font-bold transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('item_name')}</label>
                  <input type="text" required className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('date')}</label>
                  <input type="date" required className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={formData.registrationDate} onChange={(e) => setFormData({...formData, registrationDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('site')}</label>
                <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white" value={formData.siteId} onChange={(e) => setFormData({...formData, siteId: e.target.value})}>
                  <option value="">{t('select')}</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('assigned_to')}</label>
                <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white" value={formData.assignedUserId} onChange={(e) => setFormData({...formData, assignedUserId: e.target.value})}>
                  <option value="">{t('select')}</option>
                  {visibleUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('quantity')}</label>
                  <input type="number" required min="1" className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('status')}</label>
                  <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="SAGLAM">Sağlam</option>
                    <option value="KIRIK">Kırık</option>
                    <option value="HURDA">Hurda</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('notes')}</label>
                <textarea rows="2" className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold">{t('cancel')}</button>
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl">{editId ? t('update') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}