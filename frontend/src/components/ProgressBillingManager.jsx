import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ProgressBillingManager() {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    recordDate: new Date().toISOString().split('T')[0], siteId: '', description: '', unit: '',
    materialQuantity: 0, materialUnitPrice: 0, laborQuantity: 0, laborUnitPrice: 0
  });

  const [exportData, setExportData] = useState({
    allDates: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], siteId: 'all'
  });

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const [recRes, sitesRes] = await Promise.all([
        axios.get('http://localhost:8080/api/operation/hakedis', { headers: { Authorization: `Bearer ${token}`, 'X-User-Role': 'ADMIN' } }),
        axios.get('http://localhost:8080/api/operation/sites', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRecords(recRes.data);
      setSites(sitesRes.data);
    } catch (err) { } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const getSiteName = (id) => {
    const site = sites.find(s => String(s.id) === String(id));
    return site ? site.name : `ID: ${id}`;
  };

  const calculateTotals = (data) => {
    const matTotal = (parseFloat(data.materialQuantity) || 0) * (parseFloat(data.materialUnitPrice) || 0);
    const labTotal = (parseFloat(data.laborQuantity) || 0) * (parseFloat(data.laborUnitPrice) || 0);
    return { matTotal, labTotal, grandTotal: matTotal + labTotal };
  };

  const totals = calculateTotals(formData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const headers = { Authorization: `Bearer ${token}`, 'X-User-Role': 'ADMIN' };
      if (editId) await axios.put(`http://localhost:8080/api/operation/hakedis/${editId}`, formData, { headers });
      else await axios.post('http://localhost:8080/api/operation/hakedis', formData, { headers });
      setIsModalOpen(false); loadData();
    } catch (err) { alert("Hata oluştu."); }
  };

  const handleExportSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      let queryParams = [];
      if (!exportData.allDates) { queryParams.push(`startDate=${exportData.startDate}`); queryParams.push(`endDate=${exportData.endDate}`); }
      if (exportData.siteId !== 'all') queryParams.push(`siteId=${exportData.siteId}`);
      
      const response = await axios.get(`http://localhost:8080/api/operation/hakedis/export?${queryParams.join('&')}`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `hakedis_raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      setIsExportModalOpen(false);
    } catch (err) { alert("İndirme hatası."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Emin misiniz?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/operation/hakedis/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'X-User-Role': 'ADMIN' } });
      loadData();
    } catch (err) {}
  };

  const openEditModal = (rec) => {
    setEditId(rec.id);
    setFormData({
      recordDate: rec.recordDate, siteId: rec.siteId, description: rec.description, unit: rec.unit,
      materialQuantity: rec.materialQuantity, materialUnitPrice: rec.materialUnitPrice,
      laborQuantity: rec.laborQuantity, laborUnitPrice: rec.laborUnitPrice
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditId(null);
    setFormData({ recordDate: new Date().toISOString().split('T')[0], siteId: '', description: '', unit: '', materialQuantity: 0, materialUnitPrice: 0, laborQuantity: 0, laborUnitPrice: 0 });
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">{t('loading')}</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">{t('hakedis_records') || '📑 Hakediş'}</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsExportModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">{t('export_excel')}</button>
          <button onClick={openNewModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">+ {t('create')}</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[11px] whitespace-nowrap">
          <thead className="bg-slate-800 text-slate-100 font-bold uppercase">
            <tr>
              <th className="px-4 py-3">{t('date')}</th>
              <th className="px-4 py-3">{t('site')}</th>
              <th className="px-4 py-3">{t('job_description')}</th>
              <th className="px-4 py-3">{t('unit')}</th>
              <th className="px-4 py-3 text-orange-300 border-l border-slate-700">{t('material_qty')}</th>
              <th className="px-4 py-3 text-orange-300">{t('material_price')}</th>
              <th className="px-4 py-3 text-orange-400 font-black">{t('total_material')}</th>
              <th className="px-4 py-3 text-cyan-300 border-l border-slate-700">{t('labor_qty')}</th>
              <th className="px-4 py-3 text-cyan-300">{t('labor_price')}</th>
              <th className="px-4 py-3 text-cyan-400 font-black">{t('total_labor')}</th>
              <th className="px-4 py-3 text-emerald-400 font-black border-l border-slate-700">{t('grand_total')}</th>
              <th className="px-4 py-3 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-600">{new Date(r.recordDate).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-3 font-bold text-amber-700">{getSiteName(r.siteId)}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{r.description}</td>
                <td className="px-4 py-3 text-slate-500">{r.unit}</td>
                <td className="px-4 py-3 text-orange-600 border-l border-slate-100">{r.materialQuantity}</td>
                <td className="px-4 py-3 text-orange-600">{r.materialUnitPrice} ₸</td>
                <td className="px-4 py-3 text-orange-700 font-black bg-orange-50/50">{r.totalMaterialPrice} ₸</td>
                <td className="px-4 py-3 text-cyan-600 border-l border-slate-100">{r.laborQuantity}</td>
                <td className="px-4 py-3 text-cyan-600">{r.laborUnitPrice} ₸</td>
                <td className="px-4 py-3 text-cyan-700 font-black bg-cyan-50/50">{r.totalLaborPrice} ₸</td>
                <td className="px-4 py-3 text-emerald-600 font-black bg-emerald-50/50 border-l border-slate-100">{r.grandTotal} ₸</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEditModal(r)} className="text-blue-600 font-bold mr-2">{t('edit')}</button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-600 font-bold">{t('delete')}</button>
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan="12" className="p-8 text-center text-slate-400">{t('no_records')}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Excel Modalı */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h3 className="font-black text-xl mb-6">{t('export_options')}</h3>
            <form onSubmit={handleExportSubmit} className="space-y-4">
               {/* Standart Excel Form Mantığı */}
               <div className="bg-slate-50 p-4 rounded-xl border">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-emerald-600 mb-3">
                  <input type="checkbox" checked={exportData.allDates} onChange={(e) => setExportData({...exportData, allDates: e.target.checked})} /> {t('all_dates')}
                </label>
                {!exportData.allDates && (
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" required className="w-full px-3 py-2 border rounded-lg text-sm" value={exportData.startDate} onChange={(e) => setExportData({...exportData, startDate: e.target.value})} />
                    <input type="date" required className="w-full px-3 py-2 border rounded-lg text-sm" value={exportData.endDate} onChange={(e) => setExportData({...exportData, endDate: e.target.value})} />
                  </div>
                )}
              </div>
              <select required className="w-full px-4 py-3 border rounded-xl font-bold" value={exportData.siteId} onChange={(e) => setExportData({...exportData, siteId: e.target.value})}>
                <option value="all">{t('all_sites')}</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsExportModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold">{t('cancel')}</button><button type="submit" className="px-8 py-2 bg-emerald-600 text-white font-black rounded-xl">{t('download_excel')}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Kayıt Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-xl mb-6">{editId ? t('edit') : t('create')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-black uppercase text-slate-500 mb-1">{t('date')}</label><input type="date" required className="w-full px-3 py-2 border rounded-xl" value={formData.recordDate} onChange={(e) => setFormData({...formData, recordDate: e.target.value})} /></div>
                <div><label className="block text-xs font-black uppercase text-slate-500 mb-1">{t('site')}</label><select required className="w-full px-3 py-2 border rounded-xl" value={formData.siteId} onChange={(e) => setFormData({...formData, siteId: e.target.value})}><option value="">{t('select_site')}</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-black uppercase text-slate-500 mb-1">{t('job_description')}</label><input type="text" required className="w-full px-3 py-2 border rounded-xl" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
                <div><label className="block text-xs font-black uppercase text-slate-500 mb-1">{t('unit')}</label><input type="text" required className="w-full px-3 py-2 border rounded-xl" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} /></div>
              </div>

              {/* OTOMATİK HESAPLANAN MALZEME BÖLÜMÜ */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <h4 className="text-orange-800 font-black mb-3">📦 Malzeme Verileri</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-[10px] font-black uppercase text-orange-600 mb-1">{t('material_qty')}</label><input type="number" step="0.01" min="0" required className="w-full px-3 py-2 border rounded-lg font-bold" value={formData.materialQuantity} onChange={(e) => setFormData({...formData, materialQuantity: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black uppercase text-orange-600 mb-1">{t('material_price')}</label><input type="number" step="0.01" min="0" required className="w-full px-3 py-2 border rounded-lg font-bold" value={formData.materialUnitPrice} onChange={(e) => setFormData({...formData, materialUnitPrice: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black uppercase text-orange-800 mb-1">{t('total_material')}</label><input type="text" readOnly disabled className="w-full px-3 py-2 border rounded-lg bg-orange-100 font-black text-orange-800 cursor-not-allowed" value={`${totals.matTotal.toFixed(2)} ₸`} /></div>
                </div>
              </div>

              {/* OTOMATİK HESAPLANAN İŞÇİLİK BÖLÜMÜ */}
              <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                <h4 className="text-cyan-800 font-black mb-3">👷‍♂️ İşçilik Verileri</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-[10px] font-black uppercase text-cyan-600 mb-1">{t('labor_qty')}</label><input type="number" step="0.01" min="0" required className="w-full px-3 py-2 border rounded-lg font-bold" value={formData.laborQuantity} onChange={(e) => setFormData({...formData, laborQuantity: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black uppercase text-cyan-600 mb-1">{t('labor_price')}</label><input type="number" step="0.01" min="0" required className="w-full px-3 py-2 border rounded-lg font-bold" value={formData.laborUnitPrice} onChange={(e) => setFormData({...formData, laborUnitPrice: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black uppercase text-cyan-800 mb-1">{t('total_labor')}</label><input type="text" readOnly disabled className="w-full px-3 py-2 border rounded-lg bg-cyan-100 font-black text-cyan-800 cursor-not-allowed" value={`${totals.labTotal.toFixed(2)} ₸`} /></div>
                </div>
              </div>

              {/* GENEL TOPLAM */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex justify-between items-center">
                <span className="font-black text-emerald-800 uppercase tracking-widest">{t('grand_total')}</span>
                <span className="text-2xl font-black text-emerald-600">{totals.grandTotal.toFixed(2)} ₸</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold">{t('cancel')}</button><button type="submit" className="px-8 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg">{t('save')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}