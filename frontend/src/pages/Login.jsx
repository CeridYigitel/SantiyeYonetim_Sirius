import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// LOGO IMPORTU (Yolunu projedeki yerine göre düzelt)
import logo from '../assets/sirius-logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Zaten giriş yapmışsa direkt dashboard'a at
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard'); // Rota düzeltildi
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8080/api/personnel/auth/login', {
        username: username,
        password: password
      });

      // 1. ESKİ ÇALIŞAN MANTIK: Backend'den gelen token'ı direkt al
      const token = response.data; 
      localStorage.setItem('token', token);
      
      // (Opsiyonel) Token'ı çözüp işlem yapmak istersen diye eski mantıktaki gibi decode'u da ekledik
      // const decoded = jwtDecode(token);

      // 2. ROTA DÜZELTİLDİ: Boşluğa değil, direkt Dashboard'a fırlat
      navigate('/dashboard'); 
    } catch (err) {
      // 3. ESKİ ÇALIŞAN HATA YAKALAMA MANTIĞI: Backend'in attığı JSON mesajını yakala
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        // Eğer backend'e hiç ulaşılamıyorsa dil dosyasındaki standart hatayı bas
        setError(t('login_error')); 
      }
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center relative overflow-hidden">
      
      {/* ARKA PLAN FİLİGRAN LOGO */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.05] flex items-center justify-center p-10"
        style={{
          backgroundImage: `url(${logo})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '80%',
        }}
      />

      {/* SAĞ ÜST DİL SEÇİCİ */}
      <div className="absolute top-6 right-6 z-20">
        <select 
          className="bg-white border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 focus:outline-none focus:border-[#ada499] focus:ring-4 focus:ring-[#ada499]/20 transition-all shadow-sm cursor-pointer"
          value={i18n.language}
          onChange={changeLanguage}
        >
          <option value="tr">🇹🇷 Türkçe</option>
          <option value="en">🇬🇧 English</option>
          <option value="kz">🇰🇿 Қазақша</option>
          <option value="ru">🇷🇺 Русский</option>
        </select>
      </div>

      {/* GİRİŞ KARTI */}
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border-t-8 border-[#ada499] transform transition-all">
        
        {/* LOGO VE BAŞLIK */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Sirius Stroy" className="h-24 w-auto object-contain mb-4 select-none drop-shadow-sm" />
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">SIRIUS STROY</h2>
          <p className="text-sm font-bold text-[#ada499] uppercase tracking-widest mt-1">{t('system_login')}</p>
        </div>

        {/* HATA MESAJI */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold rounded-r-xl animate-fadeIn">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('username')}</label>
            <input 
              type="text" 
              required 
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ada499] focus:ring-4 focus:ring-[#ada499]/20 transition-all font-bold text-slate-800"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">{t('password')}</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ada499] focus:ring-4 focus:ring-[#ada499]/20 transition-all font-bold text-slate-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-2 bg-slate-800 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-[#ada499] focus:ring-4 focus:ring-[#ada499]/50 transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? t('logging_in') : t('login_button')}
          </button>
        </form>

        {/* ALT BİLGİ */}
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} SIRIUS STROY. Tüm hakları saklıdır.
          </p>
        </div>

      </div>
    </div>
  );
}