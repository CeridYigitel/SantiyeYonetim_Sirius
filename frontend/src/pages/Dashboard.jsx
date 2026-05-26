import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import FinanceManager from '../components/FinanceManager';
import InventoryManager from '../components/InventoryManager';
import PersonnelManager from '../components/PersonnelManager';
import ProgressBillingManager from '../components/ProgressBillingManager';
import SiteManager from '../components/SiteManager';
import WorkLogTable from '../components/WorkLogTable';

// LOGO IMPORTU
import logo from '../assets/sirius-logo.png';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // YENİ: Mobil menü state'i
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      axios.get(`http://localhost:8080/api/personnel/users/${decoded.sub}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser({ ...decoded, hasPurchasingAuthority: res.data.hasPurchasingAuthority || false });
      }).catch(err => {
        setUser(decoded); 
      });
      
    } catch (error) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
  };

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  // Mobil menüden bir sekmeye tıklanınca menüyü otomatik kapat
  const handleNavClick = (view) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  if (!user) return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-500">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 relative isolate">
      
      {/* 1. ARKA PLAN FİLİGRAN LOGO */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.10] flex items-center justify-center p-8 md:p-24"
        style={{
          backgroundImage: `url(${logo})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
        }}
      />

      {/* ÜST BAR (Navbar) */}
      <div className="max-w-[100%] mx-auto bg-[#ada499] rounded-xl shadow-sm p-4 flex justify-between items-center mb-6 md:mb-8 border-b-4 border-black relative z-50">
        
        {/* LOGO VE BAŞLIK ALANI */}
        <div className="flex items-center gap-2 md:gap-3">
          <img src={logo} alt="Sirius Stroy" className="h-8 md:h-10 w-auto object-contain select-none" />
          <h1 className="text-lg md:text-xl font-black text-slate-800 truncate max-w-[150px] md:max-w-none">
            {activeView === 'personnel' ? t('menu_personnel') : 
             activeView === 'sites' ? t('menu_sites') : 
             activeView === 'finance' ? t('menu_finance') : 
             activeView === 'hakedis' ? t('menu_hakedis') : 
             t('app_title')}
          </h1>
        </div>
        
        {/* MASAÜSTÜ MENÜ (Mobilde gizli: hidden md:flex) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex gap-2">
            <button onClick={() => handleNavClick('dashboard')} className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${activeView === 'dashboard' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{t('menu_dashboard')}</button>
            
            {user.role === 'ADMIN' && (
              <>
                <button onClick={() => handleNavClick('personnel')} className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${activeView === 'personnel' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{t('menu_personnel')}</button>
                <button onClick={() => handleNavClick('sites')} className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${activeView === 'sites' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{t('menu_sites')}</button>
                <button onClick={() => handleNavClick('hakedis')} className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${activeView === 'hakedis' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{t('menu_hakedis')}</button>
              </>
            )}

            {(user.role === 'ADMIN' || user.hasPurchasingAuthority) && (
              <button onClick={() => handleNavClick('finance')} className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${activeView === 'finance' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{t('menu_finance')}</button>
            )}
          </div>

          <div className="text-right border-l pl-4 border-black/10 flex items-center gap-4">
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500" value={i18n.language} onChange={changeLanguage}>
              <option value="tr">🇹🇷 TR</option>
              <option value="en">🇬🇧 EN</option>
              <option value="kz">🇰🇿 KZ</option>
              <option value="ru">🇷🇺 RU</option>
            </select>
            <div>
              <p className="text-sm font-black text-slate-900">{user.sub}</p>
              <p className="text-xs font-bold text-slate-800">{user.role} {user.hasPurchasingAuthority && <span className="text-slate-800 text-[10px] ml-1">{t('finance_auth')}</span>}</p>
            </div>
            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-black text-sm shadow-sm">{t('logout')}</button>
          </div>
        </div>

        {/* MOBİL HAMBURGER BUTONU (Masaüstünde gizli: md:hidden) */}
        <div className="md:hidden flex items-center gap-3">
          <select className="bg-white border-none text-slate-800 text-xs font-black rounded px-1 py-1 outline-none" value={i18n.language} onChange={changeLanguage}>
            <option value="tr">TR</option><option value="en">EN</option><option value="kz">KZ</option><option value="ru">RU</option>
          </select>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-800 focus:outline-none p-2 bg-white/20 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </div>

      {/* MOBİL AÇILIR MENÜ (Sadece butona basılınca ve mobilde görünür) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-24 left-4 right-4 bg-white rounded-xl shadow-2xl z-50 border border-slate-200 overflow-hidden flex flex-col animate-fadeIn">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <div>
              <p className="text-sm font-black text-slate-900">{user.sub}</p>
              <p className="text-xs font-bold text-blue-600">{user.role}</p>
            </div>
            <button onClick={handleLogout} className="text-xs font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">ÇIKIŞ</button>
          </div>
          <div className="flex flex-col p-2 gap-1">
            <button onClick={() => handleNavClick('dashboard')} className={`text-left px-4 py-3 rounded-lg font-bold text-sm ${activeView === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>{t('menu_dashboard')}</button>
            {user.role === 'ADMIN' && (
              <>
                <button onClick={() => handleNavClick('personnel')} className={`text-left px-4 py-3 rounded-lg font-bold text-sm ${activeView === 'personnel' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'}`}>{t('menu_personnel')}</button>
                <button onClick={() => handleNavClick('sites')} className={`text-left px-4 py-3 rounded-lg font-bold text-sm ${activeView === 'sites' ? 'bg-amber-50 text-amber-700' : 'text-slate-600'}`}>{t('menu_sites')}</button>
                <button onClick={() => handleNavClick('hakedis')} className={`text-left px-4 py-3 rounded-lg font-bold text-sm ${activeView === 'hakedis' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600'}`}>{t('menu_hakedis')}</button>
              </>
            )}
            {(user.role === 'ADMIN' || user.hasPurchasingAuthority) && (
              <button onClick={() => handleNavClick('finance')} className={`text-left px-4 py-3 rounded-lg font-bold text-sm ${activeView === 'finance' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}>{t('menu_finance')}</button>
            )}
          </div>
        </div>
      )}

      {/* İÇERİK ALANI */}
      <div className="relative z-10 max-w-[100%] mx-auto">
        {activeView === 'personnel' && <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><PersonnelManager /></div>}
        {activeView === 'sites' && <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><SiteManager /></div>}
        {activeView === 'finance' && <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><FinanceManager /></div>}
        {activeView === 'hakedis' && <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><ProgressBillingManager /></div>}

        {activeView === 'dashboard' && (
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
              <WorkLogTable />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
              <InventoryManager />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}