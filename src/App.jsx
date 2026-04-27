import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, PlusCircle, List, AlertTriangle, CheckCircle, Clock, 
  MapPin, User, MessageSquare, ShieldAlert, Trash2, Zap, 
  Camera, Image as ImageIcon, Bell, Wallet, LogOut, ArrowRight,
  Info, FileText, Activity, Users, PieChart, CalendarDays, Star,
  Sparkles, Loader2, Gift, Lightbulb, TrendingUp, ChevronRight, 
  RefreshCw, Moon, Sun, ShieldCheck, Mail
} from 'lucide-react';

// --- KONFIGURASI DATABASE & API ---
const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/y13eb6zpj32ow';
const GEMINI_API_KEY = 'AIzaSyBB47BOftmEANAy3lPtUYK3t2G1Wthp5B8'; 
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMq7pf58pWFqm3uB4suBkjm-Z6o0TH-kIsU4FG19Y3Fjn5Ukd-mJL1OSqpM7znsdVb1w/exec'; // Wajib diisi dengan URL Deploy Google Script Anda

const callGeminiAPI = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`HTTP error!`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) {
    console.error("Gemini API failed", error);
    return null;
  }
};

const App = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState('login'); 
  const [activeTab, setActiveTab] = useState('beranda');
  const [toastMessage, setToastMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingDB, setIsLoadingDB] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Auth & Registration States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regData, setRegData] = useState({ nama: '', email: '', nik: '', umur: '', sebutan: 'Bapak', password: '' });
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');

  // Database States
  const [wargaList, setWargaList] = useState([]);
  const [infos, setInfos] = useState([]);
  const [jadwals, setJadwals] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [finances, setFinances] = useState([]);
  const [ratings, setRatings] = useState([]);

  // --- FUNGSI HELPER ---
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };
  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  const isPenerimaBantuan = (namaWarga) => infos.some(info => info.type === 'Bantuan Sosial' && info.target === namaWarga);
  const totalKas = finances.reduce((acc, curr) => curr.type === 'Pemasukan' ? acc + parseInt(curr.amount || 0) : acc - parseInt(curr.amount || 0), 0);

  // --- FUNGSI DATABASE ---
  const fetchDataFromDB = async () => {
    setIsLoadingDB(true);
    try {
      const sheets = ['warga', 'info', 'jadwal', 'keluhan', 'kas', 'penilaian'];
      const results = await Promise.all(sheets.map(s => fetch(`${SHEETDB_API_URL}?sheet=${s}`).then(r => r.json())));
      
      if(Array.isArray(results[0])) setWargaList(results[0].reverse());
      if(Array.isArray(results[1])) setInfos(results[1].reverse());
      if(Array.isArray(results[2])) setJadwals(results[2].reverse());
      if(Array.isArray(results[3])) setComplaints(results[3].reverse());
      if(Array.isArray(results[4])) setFinances(results[4].reverse());
      if(Array.isArray(results[5])) setRatings(results[5].reverse());
    } catch (error) {
      showToast("⚠️ Gagal sinkronisasi data dari server.");
    } finally {
      setIsLoadingDB(false);
    }
  };

  const postToDB = async (sheetName, dataObj) => {
    try {
      await fetch(`${SHEETDB_API_URL}?sheet=${sheetName}`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataObj })
      });
    } catch (e) { showToast('⚠️ Gagal menyimpan ke server.'); }
  };

  const updateInDB = async (sheetName, id, dataObj) => {
    try {
      await fetch(`${SHEETDB_API_URL}/id/${id}?sheet=${sheetName}`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataObj })
      });
    } catch (e) { showToast('⚠️ Gagal mengupdate server.'); }
  };

  useEffect(() => { fetchDataFromDB(); }, []);

  // --- AUTH & OTP HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginEmail) return showToast('Masukkan email Anda!');

    // LOGIN RT (Wajib Password Khusus)
    if (loginEmail.toLowerCase() === 'rt@cintalembur.com') {
      if (loginPassword === 'rt_rahasia_2026') {
        setCurrentUser({ role: 'rt', name: 'Bapak RT', email: loginEmail });
        setView('rt-dashboard');
        setActiveTab('keluhan');
        showToast('Selamat bertugas, Bapak RT!');
      } else {
        showToast('❌ Password khusus RT salah!');
      }
      return;
    }

    // LOGIN WARGA
    if (!loginPassword) return showToast('Masukkan password Anda!');
    const userMatch = wargaList.find(w => w.email === loginEmail && w.password === loginPassword);
    
    if (userMatch) {
      let kateg = parseInt(userMatch.umur) >= 27 ? 'Orang Tua' : (parseInt(userMatch.umur) >= 14 ? 'Remaja' : 'Anak-anak');
      setCurrentUser({ ...userMatch, role: 'warga', profile: `${userMatch.sebutan}, ${kateg}` });
      setView('warga-dashboard');
      setActiveTab('beranda');
      showToast(`Halo, ${userMatch.nama}!`);
    } else {
      showToast('❌ Email atau Password salah!');
    }
  };

  const startRegistration = async (e) => { 
    e.preventDefault();
    if (!regData.nama || !regData.email || !regData.password || !regData.nik || !regData.umur) return showToast('Lengkapi semua data pendaftaran!');
    if (wargaList.some(w => w.email === regData.email)) return showToast('Email sudah terdaftar!');
    
    setIsLoadingDB(true); 
    showToast('Sedang memproses pengiriman OTP...');

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ email: regData.email })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setGeneratedOtp(data.otp); 
        setOtpSent(true);          
        showToast(`Silakan cek email: ${regData.email}`);
      } else {
        showToast('❌ Gagal: ' + data.message);
      }
    } catch (error) {
      showToast('❌ Gagal terhubung ke server email.');
      console.error(error);
    } finally {
      setIsLoadingDB(false); 
    }
  };

  const verifyOtpAndRegister = async () => {
    if (inputOtp !== generatedOtp) return showToast('❌ Kode OTP salah!');
    
    setIsLoadingDB(true);
    const newWarga = { 
      id: Date.now().toString(), 
      nama: regData.nama, 
      email: regData.email,
      nik: regData.nik,
      umur: regData.umur, 
      sebutan: regData.sebutan, 
      password: regData.password 
    };
    await postToDB('warga', newWarga);
    
    setWargaList(prev => [newWarga, ...prev]);
    let kateg = parseInt(newWarga.umur) >= 27 ? 'Orang Tua' : (parseInt(newWarga.umur) >= 14 ? 'Remaja' : 'Anak-anak');
    setCurrentUser({ ...newWarga, role: 'warga', profile: `${newWarga.sebutan}, ${kateg}` });
    
    setIsLoadingDB(false);
    setView('warga-dashboard');
    setActiveTab('beranda');
    showToast('🎉 Berhasil Verifikasi & Daftar!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setOtpSent(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const handlePanicButton = async () => {
    showToast('🚨 Mengirim sinyal darurat ke RT...');
    const newKeluhan = {
      id: Date.now().toString(),
      sender: `${currentUser.name} (${currentUser.profile})`,
      description: '🚨 LAPORAN DARURAT: Warga ini menekan tombol panik dan membutuhkan bantuan segera di lokasi!',
      photo: '',
      status: 'Menunggu',
      date: new Date().toLocaleDateString('id-ID'),
      rtReply: ''
    };
    await postToDB('keluhan', newKeluhan);
    setComplaints(prev => [newKeluhan, ...prev]);
    showToast('🚨 Laporan darurat tersimpan!');
  };

  // --- UI COMPONENTS ---
  const HeaderDashboard = () => (
    <div className={`backdrop-blur-xl sticky top-0 z-30 px-5 py-4 border-b flex justify-between items-center mb-6 md:rounded-b-3xl md:mx-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800 shadow-none' : 'bg-white/70 border-slate-100/50 shadow-[0_2px_10px_rgb(0,0,0,0.02)]'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-white bg-gradient-to-br ${darkMode ? 'from-teal-600 to-emerald-800' : 'from-teal-400 to-emerald-600'}`}>
          <Home className="w-5 h-5" />
        </div>
        <div className="hidden sm:block">
          <h1 className={`font-extrabold text-lg tracking-tight leading-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Cintalembur</h1>
          <p className="text-[10px] font-medium text-slate-500">Lingkungan Pintar</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-all ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button onClick={fetchDataFromDB} disabled={isLoadingDB} className={`p-2 rounded-full transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
          <RefreshCw className={`w-5 h-5 ${isLoadingDB ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={() => setActiveTab('profil')} className={`flex items-center gap-2 p-1.5 rounded-full pr-3 transition-all ${darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white"><User className="w-4 h-4" /></div>
          <span className="text-xs font-bold hidden xs:block">{currentUser?.name?.split(' ')[0]}</span>
        </button>
      </div>
    </div>
  );

  const ProfilView = () => (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
      <div className={`p-8 rounded-[2.5rem] border text-center transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-xl'}`}>
        <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg transform -rotate-3">
          <User className="w-12 h-12 text-white" />
        </div>
        <h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{currentUser?.nama || currentUser?.name}</h2>
        <p className="text-emerald-500 font-bold mb-8 uppercase tracking-widest text-xs mt-1">{currentUser?.role === 'rt' ? 'Pengurus Lingkungan' : 'Warga Cintalembur'}</p>
        
        <div className="space-y-3 text-left">
          <div className={`p-4 rounded-2xl flex items-center gap-4 transition-colors ${darkMode ? 'bg-slate-900/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-100'}`}>
             <Mail className="w-5 h-5 text-slate-400" />
             <div><p className="text-[10px] font-bold text-slate-400 uppercase">Email</p><p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{currentUser?.email || loginEmail}</p></div>
          </div>
          {currentUser?.role === 'warga' && (
            <div className={`p-4 rounded-2xl flex items-center gap-4 transition-colors ${darkMode ? 'bg-slate-900/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-100'}`}>
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">NIK / KK</p><p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{currentUser?.nik}</p></div>
            </div>
          )}
        </div>

        <button onClick={handleLogout} className="w-full mt-10 bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-rose-500/30">
          <LogOut className="w-5 h-5" /> Keluar dari Aplikasi
        </button>
      </div>
    </div>
  );

  const WargaBeranda = () => {
    const myInfos = infos.filter(info => !info.target || info.target === currentUser.name);
    const privateInfos = myInfos.filter(info => info.target);
    const publicInfos = myInfos.filter(info => !info.target);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto space-y-8">
        
        {/* WIDGET GREETING */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-200/20 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold mb-1">Halo, {currentUser?.name?.split(' ')[0]}! 👋</h2>
            <p className="text-emerald-50 text-sm font-medium max-w-sm">Selamat datang di Cintalembur. Mari bersama ciptakan lingkungan yang rukun, aman, dan nyaman.</p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-10 w-24 h-24 bg-teal-300/20 rounded-full blur-xl"></div>
        </div>

        {/* QUICK ACCESS MENU */}
        <div className="grid grid-cols-4 gap-3 md:gap-5">
          <button onClick={() => setActiveTab('lapor')} className={`flex flex-col items-center justify-center p-4 md:p-5 rounded-3xl border hover:shadow-md transition-all active:scale-95 group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'}`}>
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors"><MessageSquare className="w-6 h-6" /></div>
            <span className={`text-[10px] md:text-xs font-bold text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Lapor RT</span>
          </button>
          <button onClick={() => setActiveTab('kas')} className={`flex flex-col items-center justify-center p-4 md:p-5 rounded-3xl border hover:shadow-md transition-all active:scale-95 group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'}`}>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Wallet className="w-6 h-6" /></div>
            <span className={`text-[10px] md:text-xs font-bold text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Cek Kas</span>
          </button>
          <button onClick={() => setActiveTab('penilaian')} className={`flex flex-col items-center justify-center p-4 md:p-5 rounded-3xl border hover:shadow-md transition-all active:scale-95 group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'}`}>
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-yellow-400 group-hover:text-white transition-colors"><Star className="w-6 h-6" /></div>
            <span className={`text-[10px] md:text-xs font-bold text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nilai RT</span>
          </button>
          <button onClick={handlePanicButton} className={`flex flex-col items-center justify-center p-4 md:p-5 rounded-3xl border hover:shadow-md transition-all active:scale-95 group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'}`}>
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-rose-500 group-hover:text-white transition-colors"><ShieldAlert className="w-6 h-6" /></div>
            <span className={`text-[10px] md:text-xs font-bold text-center ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>Darurat!</span>
          </button>
        </div>

        {privateInfos.length > 0 && (
          <div className="animate-in slide-in-from-left-4">
            <div className="mb-4 flex items-center">
              <Gift className="w-6 h-6 mr-2 text-rose-500 animate-bounce" />
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pesan Khusus Anda</h2>
            </div>
            <div className="space-y-4">
              {privateInfos.map(info => (
                <div key={info.id} className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 p-6 rounded-3xl border border-rose-500/20 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl">RAHASIA</div>
                  <h3 className={`font-bold text-lg mt-2 ${darkMode ? 'text-rose-400' : 'text-rose-800'}`}>{info.title}</h3>
                  <p className={`text-sm mt-2 leading-relaxed font-medium ${darkMode ? 'text-rose-200' : 'text-rose-700/80'}`}>{info.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-4 flex justify-between items-end">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pengumuman RT</h2>
          </div>
          <div className="grid gap-4">
            {publicInfos.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">Belum ada pengumuman.</p> : publicInfos.map(info => (
              <div key={info.id} className={`p-6 rounded-3xl border transition-all group ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)]'}`}>
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${info.type === 'Posyandu' ? (darkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-700') : (darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700')}`}>{info.type}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>{info.date}</span>
                </div>
                <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>{info.title}</h3>
                <p className={`text-sm mt-2 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{info.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2 text-indigo-500"/>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Jadwal Warga</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {jadwals.length === 0 ? <p className="text-slate-400 text-sm text-center py-4 col-span-2">Belum ada jadwal aktif.</p> : jadwals.map(jadwal => (
              <div key={jadwal.id} className={`p-5 rounded-3xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'}`}>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>{jadwal.type}</span>
                <h3 className={`font-bold text-lg mt-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{jadwal.hari}</h3>
                <div className={`mt-3 p-3 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{jadwal.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const WargaLapor = () => {
    const [desc, setDesc] = useState('');
    const [photo, setPhoto] = useState('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const fileInputRef = useRef(null);

    const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) { 
        if(file.size > 2000000) return showToast('Peringatan: Ukuran foto maksimal 2MB!');
        const reader = new FileReader(); 
        reader.onloadend = () => setPhoto(reader.result); 
        reader.readAsDataURL(file); 
      }
    };

    const handleEnhanceText = async () => {
      if (!desc.trim()) return showToast('Tuliskan keluhan singkat terlebih dahulu!');
      setIsEnhancing(true);
      try {
        const result = await callGeminiAPI(`Perbaiki teks ini agar formal dan sopan tanpa menambah salam berlebihan: "${desc}"`);
        if (result) { setDesc(result.trim()); showToast('✨ Keluhan berhasil disempurnakan!'); }
      } catch (error) { showToast('Gagal menyempurnakan teks.'); } finally { setIsEnhancing(false); }
    };

    const submitKeluhan = async (e) => {
      e.preventDefault();
      if (!desc) return showToast('Deskripsi tidak boleh kosong!');
      
      const newKeluhan = { 
        id: Date.now().toString(), 
        sender: `${currentUser.name} (${currentUser.profile})`, 
        description: desc, photo, status: 'Menunggu', date: new Date().toLocaleDateString('id-ID'), rtReply: '' 
      };
      
      setIsLoadingDB(true);
      await postToDB('keluhan', newKeluhan);
      setComplaints(prev => [newKeluhan, ...prev]);
      setDesc(''); setPhoto(''); setIsLoadingDB(false);
      showToast('Laporan berhasil tersimpan di Database!'); setActiveTab('beranda');
    };

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><MessageSquare className="w-8 h-8" /></div>
          <h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Lapor ke RT</h2>
          <p className="text-sm text-slate-500 mt-2">Sampaikan masukan atau masalah di lingkungan dengan mudah dan cepat.</p>
        </div>
        
        <form onSubmit={submitKeluhan} className={`p-8 rounded-[2rem] border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-3">
                <label className={`block text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Detail Laporan</label>
                <button type="button" onClick={handleEnhanceText} disabled={isEnhancing} className={`text-xs font-bold px-4 py-2 rounded-full flex items-center transition-all active:scale-95 ${darkMode ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                  {isEnhancing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />} Rapikan Bahasa (AI)
                </button>
              </div>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows="5" placeholder="Contoh: Lampu jalan di Blok A mati sejak kemarin..." className={`w-full p-5 rounded-2xl outline-none text-sm resize-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${darkMode ? 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-200 focus:bg-white'}`} />
            </div>
            
            <div>
              <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Lampirkan Bukti Foto (Maks 2MB)</label>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
              {!photo ? (
                <div onClick={() => fileInputRef.current.click()} className={`w-full border-2 border-dashed rounded-3xl p-10 flex flex-col items-center cursor-pointer transition-all group ${darkMode ? 'border-slate-600 bg-slate-900/50 hover:bg-slate-900' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}><Camera className="w-6 h-6 text-slate-400" /></div>
                  <span className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Klik untuk Unggah Foto</span>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-slate-600 group">
                  <img src={photo} alt="Preview" className="w-full h-64 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => setPhoto('')} className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 shadow-xl transform hover:scale-110 transition-all"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
            </div>
            <button type="submit" disabled={isLoadingDB} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center">
              {isLoadingDB ? <Loader2 className="w-6 h-6 animate-spin"/> : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const UangKasView = () => {
    const [kasData, setKasData] = useState({ nama: currentUser?.name || '', hari: '', jumlah: '' });
    const [kasSummary, setKasSummary] = useState('');
    const [isAnalyzingKas, setIsAnalyzingKas] = useState(false);

    const handleAnalyzeKas = async () => {
      setIsAnalyzingKas(true);
      try {
        const financeData = finances.map(f => `${f.type}: Rp${f.amount}`).join(', ');
        const result = await callGeminiAPI(`Berikan 2 kalimat ringkasan tentang kesehatan kas. Total Saldo: Rp${totalKas}. Transaksi: ${financeData}`);
        if (result) setKasSummary(result.trim());
      } catch (error) { showToast('Gagal menganalisis kas.'); } finally { setIsAnalyzingKas(false); }
    };

    const submitSetorKas = async (e) => {
      e.preventDefault();
      if (!kasData.nama || !kasData.hari || !kasData.jumlah) return showToast('Lengkapi data!');
      const newKas = { id: Date.now().toString(), desc: `Iuran Kas Warga`, amount: parseInt(kasData.jumlah), type: 'Pemasukan', date: kasData.hari, sender: kasData.nama };
      setIsLoadingDB(true);
      await postToDB('kas', newKas);
      setFinances(prev => [newKas, ...prev]);
      setKasData({ nama: currentUser?.name || '', hari: '', jumlah: '' }); 
      setIsLoadingDB(false); showToast('Setoran berhasil tersimpan!');
    };

    return (
      <div className="animate-in fade-in max-w-3xl mx-auto space-y-8">
        <div><h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Uang Kas Lingkungan</h2><p className="text-sm text-slate-500 mt-1">Transparansi dan pencatatan kas RT.</p></div>
        
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl mix-blend-screen"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
              <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-2 flex items-center"><Wallet className="w-4 h-4 mr-2"/> Total Saldo Kas</p>
              <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-400">{formatRupiah(totalKas)}</h3>
            </div>
            <button onClick={handleAnalyzeKas} disabled={isAnalyzingKas} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-3 px-5 rounded-2xl flex items-center justify-center transition-all backdrop-blur-md border border-white/10">
              {isAnalyzingKas ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />} Analisis Kas Pintar
            </button>
          </div>
          {kasSummary && (
            <div className="relative z-10 mt-6 bg-black/20 p-5 rounded-2xl border border-white/10 text-sm leading-relaxed backdrop-blur-xl">
              <p className="font-bold text-yellow-400 mb-1 flex items-center"><Sparkles className="w-4 h-4 mr-2"/> Insight AI:</p>
              <p className="text-slate-300 font-medium">{kasSummary}</p>
            </div>
          )}
        </div>

        {currentUser?.role === 'warga' && (
          <form onSubmit={submitSetorKas} className={`p-8 rounded-[2rem] border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
            <h3 className={`font-bold text-lg mb-6 flex items-center ${darkMode ? 'text-white' : 'text-slate-800'}`}><div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center mr-3"><PlusCircle className="w-4 h-4 text-emerald-500"/></div> Lapor Setor Kas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div><label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Nama Penyetor</label><input type="text" value={kasData.nama} onChange={(e)=>setKasData({...kasData, nama: e.target.value})} className={`w-full p-4 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-emerald-500/50 ${darkMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} /></div>
              <div><label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Hari / Tanggal</label><input type="text" value={kasData.hari} onChange={(e)=>setKasData({...kasData, hari: e.target.value})} className={`w-full p-4 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-emerald-500/50 ${darkMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} /></div>
            </div>
            <div className="mb-6"><label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Jumlah Uang (Rp)</label><input type="number" value={kasData.jumlah} onChange={(e)=>setKasData({...kasData, jumlah: e.target.value})} className={`w-full p-4 rounded-2xl outline-none text-sm font-semibold text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`} /></div>
            <button type="submit" disabled={isLoadingDB} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95">{isLoadingDB ? 'Menyimpan...' : 'Input Setoran'}</button>
          </form>
        )}

        <div>
          <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Riwayat Kas Terbaru</h3>
          <div className="space-y-4">
            {finances.length === 0 ? <p className="text-slate-400 text-sm">Belum ada data kas.</p> : finances.map((item) => (
              <div key={item.id} className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${item.type === 'Pemasukan' ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white' : 'bg-gradient-to-br from-rose-400 to-red-500 text-white'}`}><Wallet className="w-5 h-5" /></div>
                  <div><p className={`font-bold text-sm md:text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.desc}</p><p className={`text-[11px] md:text-xs mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.date} • <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{item.sender}</span></p></div>
                </div>
                <div className={`font-extrabold text-sm md:text-lg ${item.type === 'Pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>{item.type === 'Pemasukan' ? '+' : '-'}{formatRupiah(item.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const WargaPenilaian = () => {
    const [star, setStar] = useState(0);
    const [comment, setComment] = useState('');

    const submitRating = async (e) => {
      e.preventDefault();
      if (star === 0) return showToast('Pilih bintang!');
      const newRating = { id: Date.now().toString(), sender: currentUser.name, stars: star, comment: comment || 'Tidak ada ulasan.', date: new Date().toLocaleDateString('id-ID') };
      setIsLoadingDB(true);
      await postToDB('penilaian', newRating);
      setRatings(prev => [newRating, ...prev]);
      setStar(0); setComment(''); setIsLoadingDB(false);
      showToast('Penilaian tersimpan di Database!'); setActiveTab('beranda');
    };

    return (
      <div className="animate-in fade-in max-w-xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4"><Star className="w-8 h-8 fill-yellow-500" /></div>
          <h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Penilaian Kinerja RT</h2>
          <p className="text-sm text-slate-500 mt-2">Bantu kami menjadi lebih baik dengan ulasan Anda.</p>
        </div>

        <form onSubmit={submitRating} className={`p-8 rounded-[2rem] border text-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-xl'}`}>
          <h3 className={`font-bold mb-6 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Berapa bintang untuk pengurus RT saat ini?</h3>
          <div className="flex justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5].map((num) => (
              <button key={num} type="button" onClick={() => setStar(num)} className="focus:outline-none hover:scale-110 transition-transform">
                <Star className={`w-12 h-12 transition-all duration-300 ${num <= star ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' : 'text-slate-200/20'}`} />
              </button>
            ))}
          </div>
          <div className="text-left">
            <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tulis Ulasan (Opsional)</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Saran atau kritik..." rows="4" className={`w-full p-5 rounded-2xl outline-none text-sm resize-none mb-6 focus:ring-2 focus:ring-yellow-400/50 transition-all ${darkMode ? 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-200 focus:bg-white'}`} />
          </div>
          <button type="submit" disabled={isLoadingDB} className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
            {isLoadingDB ? 'Menyimpan...' : 'Kirim Penilaian'}
          </button>
        </form>
      </div>
    );
  };

  const RtKeluhanView = () => {
    const [replyingTo, setReplyingTo] = useState(null);
    const [aiReplyText, setAiReplyText] = useState('');
    const [isGeneratingReply, setIsGeneratingReply] = useState(false);

    const handleGenerateReply = async (desc) => {
      setIsGeneratingReply(true);
      try {
        const result = await callGeminiAPI(`Buatkan balasan penyelesaian singkat, ramah, dan solutif untuk keluhan warga ini: "${desc}"`);
        if (result) setAiReplyText(result.trim());
      } catch (error) { showToast('Gagal memuat balasan AI.'); } finally { setIsGeneratingReply(false); }
    };

    const handleSelesai = async (id) => {
      setIsLoadingDB(true);
      await updateInDB('keluhan', id, { status: 'Selesai', rtReply: aiReplyText });
      setComplaints(complaints.map(c => c.id === id ? { ...c, status: 'Selesai', rtReply: aiReplyText } : c));
      setReplyingTo(null); setAiReplyText(''); setIsLoadingDB(false); showToast('Laporan diupdate!');
    };

    return (
      <div className="animate-in fade-in max-w-3xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div><h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Laporan Warga</h2><p className="text-sm text-slate-500 mt-1">Pantau dan tindak lanjuti masalah lingkungan.</p></div>
          <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-2xl text-xs font-bold flex items-center border border-red-500/20"><AlertTriangle className="w-4 h-4 mr-2"/> {complaints.filter(c => c.status !== 'Selesai').length} Perlu Tindakan</div>
        </div>

        <div className="space-y-6">
          {complaints.length === 0 ? <p className="text-center text-slate-400 py-10">Belum ada laporan dari warga.</p> : complaints.map(comp => (
            <div key={comp.id} className={`rounded-[2rem] p-6 sm:p-8 border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md'}`}>
              <div className={`flex justify-between items-start mb-5 border-b pb-5 ${darkMode ? 'border-slate-700' : 'border-slate-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${darkMode ? 'bg-slate-900 text-slate-500' : 'bg-slate-100 text-slate-400'}`}><User className="w-6 h-6" /></div>
                  <div><h4 className={`font-bold text-sm md:text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>{comp.sender}</h4><p className="text-xs text-slate-500 font-medium mt-0.5">{comp.date}</p></div>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${comp.status === 'Selesai' ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')}`}>{comp.status}</span>
              </div>
              
              <div className={`p-5 rounded-2xl border mb-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100/50 text-slate-700'}`}><p className="text-sm md:text-base leading-relaxed">{comp.description}</p></div>

              {comp.photo && <div className="mb-5 rounded-2xl overflow-hidden border border-slate-600 shadow-sm"><img src={comp.photo} alt="Bukti" className="w-full max-h-72 object-cover" /></div>}
              
              {comp.status === 'Selesai' && comp.rtReply && (
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-emerald-900/30 border-emerald-800' : 'bg-emerald-50/50 border-emerald-100'}`}><p className={`text-xs font-bold mb-2 flex items-center ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}><CheckCircle className="w-4 h-4 mr-1.5" /> Ditutup dengan Balasan:</p><p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>{comp.rtReply}</p></div>
              )}

              {comp.status !== 'Selesai' && (
                <div className={`mt-5 pt-5 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  {replyingTo === comp.id ? (
                    <div className="animate-in slide-in-from-top-2 space-y-4">
                      <textarea value={aiReplyText} onChange={(e) => setAiReplyText(e.target.value)} placeholder="Tuliskan tindak lanjut..." rows="3" className={`w-full p-4 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none shadow-sm ${darkMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-white border border-slate-200'}`} />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => handleGenerateReply(comp.description)} disabled={isGeneratingReply} className={`flex-1 text-sm font-bold py-3.5 rounded-xl flex items-center justify-center transition-all ${darkMode ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}>
                          {isGeneratingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Susun Balasan AI
                        </button>
                        <button onClick={() => handleSelesai(comp.id)} disabled={isLoadingDB} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3.5 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all">{isLoadingDB ? 'Menyimpan...' : 'Kirim & Tutup Laporan'}</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setReplyingTo(comp.id)} className={`w-full text-sm font-bold py-3.5 rounded-2xl flex items-center justify-center transition-all ${darkMode ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}><ChevronRight className="w-5 h-5 mr-1"/> Tanggapi Laporan Ini</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RtDataWargaView = () => {
    const totalWarga = wargaList.length || 1; 
    const anakCount = wargaList.filter(w => w.kategori === 'Anak-anak').length;
    const remajaCount = wargaList.filter(w => w.kategori === 'Remaja').length;
    const orangTuaCount = wargaList.filter(w => w.kategori === 'Orang Tua').length;
    
    const pctAnak = Math.round((anakCount / totalWarga) * 100);
    const pctRemaja = Math.round((remajaCount / totalWarga) * 100);
    const pctOrangTua = Math.round((orangTuaCount / totalWarga) * 100);

    const [demoAnalysis, setDemoAnalysis] = useState('');
    const [isAnalyzingDemo, setIsAnalyzingDemo] = useState(false);

    const handleAnalyzeDemographics = async () => {
      setIsAnalyzingDemo(true);
      try {
        const result = await callGeminiAPI(`Lingkungan RT terdiri dari: ${pctAnak}% Anak-anak, ${pctRemaja}% Remaja, dan ${pctOrangTua}% Orang Tua dari total ${totalWarga} warga. Berikan ringkasan profil warga dan sarankan 2 ide program kegiatan RT yang paling cocok.`);
        if (result) setDemoAnalysis(result.trim());
      } catch (e) { showToast('Gagal menganalisis demografi.'); } finally { setIsAnalyzingDemo(false); }
    };

    const keluargaGroup = wargaList.reduce((acc, warga) => {
      const key = warga.nik || 'Tanpa NIK';
      if (!acc[key]) acc[key] = []; acc[key].push(warga); return acc;
    }, {});

    return (
      <div className="animate-in fade-in max-w-3xl mx-auto">
        <h2 className={`text-2xl font-extrabold mb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Demografi Warga</h2>
        
        <div className={`p-8 rounded-[2rem] border mb-8 relative overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700 shadow-none' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
          <div className={`flex flex-col md:flex-row md:justify-between md:items-center border-b pb-5 mb-6 gap-4 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <div><h3 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>Statistik Usia</h3><p className="text-xs text-slate-500 font-medium mt-1">Berdasarkan {wargaList.length} warga terdaftar</p></div>
            <button onClick={handleAnalyzeDemographics} disabled={isAnalyzingDemo} className={`text-xs font-bold px-5 py-2.5 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
              {isAnalyzingDemo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />} Konsultasi Program (AI)
            </button>
          </div>

          {demoAnalysis && (
            <div className={`p-5 rounded-2xl mb-8 text-sm whitespace-pre-wrap leading-relaxed border ${darkMode ? 'bg-indigo-900/30 border-indigo-800 text-indigo-200' : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'}`}>
              <p className={`font-bold mb-3 flex items-center ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}><Sparkles className="w-5 h-5 mr-2"/> Analisis AI & Rekomendasi:</p>
              {demoAnalysis}
            </div>
          )}
          
          <div className="space-y-5">
             <div><div className={`flex justify-between mb-2 text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><span>Orang Tua (&gt;26 Thn)</span><span className="text-emerald-500">{pctOrangTua}%</span></div><div className={`w-full rounded-full h-3 overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}><div className="bg-emerald-400 h-3 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${pctOrangTua}%` }}></div></div></div>
             <div><div className={`flex justify-between mb-2 text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><span>Remaja (14-26 Thn)</span><span className="text-blue-500">{pctRemaja}%</span></div><div className={`w-full rounded-full h-3 overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}><div className="bg-blue-400 h-3 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ width: `${pctRemaja}%` }}></div></div></div>
             <div><div className={`flex justify-between mb-2 text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><span>Anak-anak (8-13 Thn)</span><span className="text-orange-400">{pctAnak}%</span></div><div className={`w-full rounded-full h-3 overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}><div className="bg-orange-400 h-3 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]" style={{ width: `${pctAnak}%` }}></div></div></div>
          </div>
        </div>
        
        <h3 className={`font-extrabold text-xl mb-5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Kartu Keluarga</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.keys(keluargaGroup).map((nik, i) => (
            <div key={i} className={`p-6 rounded-3xl border transition-shadow ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md'}`}>
              <div className={`flex items-center mb-5 pb-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-50'}`}>
                <div className={`p-3 rounded-2xl mr-4 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}><Users className="w-6 h-6" /></div>
                <div><h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>Keluarga</h4><p className="text-xs text-slate-400 font-mono mt-0.5">KK: {nik}</p></div>
              </div>
              <div className="space-y-3">
                {keluargaGroup[nik].map(warga => (
                  <div key={warga.id} className="flex items-center justify-between group">
                    <div>
                      <p className={`font-bold text-sm flex items-center ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {warga.nama} {isPenerimaBantuan(warga.nama) && <span className="bg-rose-500/20 text-rose-500 text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-2 border border-rose-500/30">Bantuan</span>}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{warga.sebutan} • {warga.umur} Tahun</p>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${darkMode ? 'bg-slate-700 text-slate-400 group-hover:bg-slate-600' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>{warga.kategori}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RtBuatJadwalDanInfo = () => {
    const [mode, setMode] = useState('info');
    const [title, setTitle] = useState(''); const [content, setContent] = useState('');
    const [type, setType] = useState('Kegiatan'); const [targetWarga, setTargetWarga] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [jType, setJType] = useState('Ronda Malam'); const [jCustomType, setJCustomType] = useState('');
    const [jHari, setJHari] = useState(''); const [jDetails, setJDetails] = useState('');
    const [isIdeating, setIsIdeating] = useState(false);

    const generateIdeKegiatan = async () => {
      setIsIdeating(true);
      try {
        const result = await callGeminiAPI(`Berikan 3 ide kegiatan warga tingkat RT yang kreatif, seru, dan hemat biaya. Tulis poin-poinnya saja.`);
        if (result) { setJType('Custom'); setJCustomType('Kegiatan (Ide AI)'); setJDetails(result.trim()); showToast('✨ Ide dibuat!'); setMode('jadwal'); }
      } catch (e) { showToast('Gagal.'); } finally { setIsIdeating(false); }
    };
    const generateAnnouncement = async () => {
      if (!title) return showToast('Isi Judul dulu!');
      setIsGenerating(true);
      try {
        const result = await callGeminiAPI(`Buatkan draf pengumuman RT resmi. Topik: ${title}. Catatan: ${content}`);
        if (result) { setContent(result.trim()); showToast('✨ Draf dibuat!'); }
      } catch (e) { showToast('Gagal.'); } finally { setIsGenerating(false); }
    };

    const submitInfo = async (e) => {
      e.preventDefault();
      if (!title || !content) return showToast('Lengkapi info!');
      const newInfo = { id: Date.now().toString(), title, content, type, date: new Date().toLocaleDateString('id-ID'), target: type === 'Bantuan Sosial' ? targetWarga : '' };
      setIsLoadingDB(true);
      await postToDB('info', newInfo);
      setInfos(prev => [newInfo, ...prev]);
      setTitle(''); setContent(''); setTargetWarga(''); setIsLoadingDB(false); showToast('Berhasil Disebarkan ke Database!');
    };

    const submitJadwal = async (e) => {
      e.preventDefault();
      if (!jHari || !jDetails) return showToast('Lengkapi Jadwal!');
      const newJadwal = { id: Date.now().toString(), type: jType === 'Custom' ? jCustomType : jType, hari: jHari, details: jDetails, date: new Date().toLocaleDateString('id-ID') };
      setIsLoadingDB(true);
      await postToDB('jadwal', newJadwal);
      setJadwals(prev => [newJadwal, ...prev]);
      setJHari(''); setJDetails(''); setJCustomType(''); setIsLoadingDB(false); showToast('Jadwal Tersimpan di Database!');
    };

    return (
      <div className="animate-in fade-in max-w-2xl mx-auto space-y-6">
        <div className="mb-6 text-center"><h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Manajemen Info & Jadwal</h2><p className="text-sm text-slate-500 mt-2">Publikasi pengumuman, bantuan, atau atur jadwal warga.</p></div>

        <div className={`flex p-1.5 rounded-full w-full max-w-sm mx-auto backdrop-blur-md ${darkMode ? 'bg-slate-800' : 'bg-slate-200/70'}`}>
          <button onClick={()=>setMode('info')} className={`flex-1 py-3 text-xs font-bold rounded-full transition-all ${mode==='info' ? (darkMode ? 'bg-slate-600 text-white shadow-md' : 'bg-white text-slate-800 shadow-md') : 'text-slate-500 hover:text-slate-400'}`}>Pengumuman</button>
          <button onClick={()=>setMode('jadwal')} className={`flex-1 py-3 text-xs font-bold rounded-full transition-all ${mode==='jadwal' ? (darkMode ? 'bg-slate-600 text-white shadow-md' : 'bg-white text-slate-800 shadow-md') : 'text-slate-500 hover:text-slate-400'}`}>Jadwal Warga</button>
        </div>

        {mode === 'info' ? (
          <form onSubmit={submitInfo} className={`p-8 rounded-[2rem] border space-y-6 animate-in slide-in-from-bottom-4 duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
            <select value={type} onChange={(e) => setType(e.target.value)} className={`w-full p-4 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/50 transition-all ${darkMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`}>
              <option value="Kegiatan">Kegiatan Warga (Publik)</option><option value="Posyandu">Posyandu (Publik)</option><option value="Bantuan Sosial">Bantuan Sosial (Kirim Pribadi)</option>
            </select>
            {type === 'Bantuan Sosial' && (
               <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-rose-900/20 border-rose-800/50' : 'bg-rose-50 border-rose-200'}`}>
                  <label className={`block text-sm font-bold mb-2 flex items-center ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}><Gift className="w-4 h-4 mr-2" /> Pilih Warga Penerima</label>
                  <select value={targetWarga} onChange={(e) => setTargetWarga(e.target.value)} className={`w-full p-4 rounded-xl outline-none text-sm font-medium ${darkMode ? 'bg-slate-800 border border-slate-600 text-white' : 'bg-white border border-rose-200'}`}><option value="">-- Pilih Warga (Wajib) --</option>{wargaList.map(w => <option key={w.id} value={w.nama}>{w.nama} (Usia {w.umur})</option>)}</select>
               </div>
            )}
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul Pengumuman" className={`w-full p-4 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-blue-500/50 transition-all ${darkMode ? 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-200'}`} />
            <div>
               <div className="flex justify-between items-center mb-3">
                 <label className={`block text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Isi Pengumuman</label>
                 <button type="button" onClick={generateAnnouncement} disabled={isGenerating} className={`text-xs font-bold px-4 py-2 rounded-full flex items-center transition-all active:scale-95 ${darkMode ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                   {isGenerating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />} Tulis dengan AI
                 </button>
               </div>
               <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Isi pengumuman..." rows="6" className={`w-full p-4 rounded-2xl outline-none text-sm resize-none focus:ring-2 focus:ring-blue-500/50 transition-all ${darkMode ? 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-200'}`} />
            </div>
            <button type="submit" disabled={isLoadingDB} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 ${type === 'Bantuan Sosial' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{isLoadingDB ? 'Menyimpan...' : 'Terbitkan ke Database'}</button>
          </form>
        ) : (
          <form onSubmit={submitJadwal} className={`p-8 rounded-[2rem] border space-y-6 animate-in slide-in-from-bottom-4 duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
            <select value={jType} onChange={(e) => setJType(e.target.value)} className={`w-full p-4 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 transition-all ${darkMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`}>
              <option value="Ronda Malam">Ronda Malam</option><option value="Kerja Bakti">Kerja Bakti</option><option value="Custom">Jadwal Kustom</option>
            </select>
            {jType === 'Custom' && <input type="text" value={jCustomType} onChange={(e) => setJCustomType(e.target.value)} placeholder="Jenis Custom (Contoh: Senam Sehat)" className={`w-full p-4 rounded-2xl outline-none text-sm ${darkMode ? 'bg-indigo-900/30 border border-indigo-800 text-white' : 'bg-indigo-50 border border-indigo-200'}`} />}
            <input type="text" value={jHari} onChange={(e) => setJHari(e.target.value)} placeholder="Hari & Waktu" className={`w-full p-4 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-indigo-500/50 transition-all ${darkMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} />
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className={`block text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Detail / Petugas</label>
                <button type="button" onClick={generateIdeKegiatan} disabled={isIdeating} className={`text-xs font-bold px-4 py-2 rounded-full flex items-center transition-all active:scale-95 ${darkMode ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                  {isIdeating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-1.5" />} Ide Kegiatan AI
                </button>
              </div>
              <textarea value={jDetails} onChange={(e) => setJDetails(e.target.value)} placeholder="Sebutkan nama petugas atau deskripsi..." rows="5" className={`w-full p-4 rounded-2xl outline-none text-sm resize-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${darkMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} />
            </div>
            <button type="submit" disabled={isLoadingDB} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">{isLoadingDB ? 'Menyimpan...' : 'Simpan Jadwal ke Database'}</button>
          </form>
        )}
      </div>
    );
  };

  const RtPenilaianView = () => {
    const avgRating = ratings.length > 0 ? (ratings.reduce((acc, curr) => acc + parseInt(curr.stars||0), 0) / ratings.length).toFixed(1) : 0;
    const [aiSummary, setAiSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleSummarize = async () => {
      if (ratings.length === 0) return showToast('Belum ada ulasan warga.');
      setIsSummarizing(true);
      try {
        const reviews = ratings.map(r => `Bintang ${r.stars}: ${r.comment}`).join('\n');
        const result = await callGeminiAPI(`Analisis ulasan warga terhadap kinerja RT ini. Berikan 1 paragraf kelebihan dan 1 paragraf saran perbaikan. Ulasan:\n${reviews}`);
        if (result) setAiSummary(result.trim());
      } catch (e) { showToast('Gagal membuat ringkasan.'); } finally { setIsSummarizing(false); }
    };

    return (
      <div className="animate-in fade-in max-w-3xl mx-auto space-y-6">
        <h2 className={`text-2xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Evaluasi Kinerja</h2>
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl mix-blend-screen"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div><p className="text-yellow-400/80 text-sm font-bold tracking-widest uppercase mb-3">Rata-rata Rating</p><div className="flex items-end gap-3"><h3 className="text-5xl font-extrabold text-white">{avgRating}</h3><span className="text-xl font-bold text-slate-500 mb-1.5">/ 5.0</span></div></div>
            <button onClick={handleSummarize} disabled={isSummarizing} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-3 px-5 rounded-2xl flex items-center justify-center transition-all backdrop-blur-md border border-white/10">
              {isSummarizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />} Rangkum Ulasan (AI)
            </button>
          </div>
          <Star className="absolute -bottom-6 -right-6 w-32 h-32 text-yellow-300 fill-yellow-300 opacity-30 pointer-events-none" />
          
          {aiSummary && (
            <div className="relative z-10 mt-6 bg-white/5 p-5 rounded-2xl border border-white/10 text-sm leading-relaxed backdrop-blur-xl">
              <p className="font-bold text-yellow-400 mb-2 flex items-center"><Sparkles className="w-4 h-4 mr-2"/> Kesimpulan Evaluasi AI:</p>
              <div className="whitespace-pre-wrap text-slate-200 font-medium">{aiSummary}</div>
            </div>
          )}
        </div>

        <div className="grid gap-4 mt-8">
          {ratings.length === 0 ? <p className="text-center text-slate-400 py-10">Belum ada penilaian dari warga.</p> : ratings.map(rating => (
            <div key={rating.id} className={`p-6 rounded-3xl border flex flex-col sm:flex-row gap-4 sm:items-center transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'}`}>
              <div className="flex-1"><h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{rating.sender}</h4><p className="text-sm text-slate-500 font-medium leading-relaxed italic">"{rating.comment}"</p></div>
              <div className={`flex items-center px-3 py-2 rounded-xl self-start sm:self-auto border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-2" /><span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{rating.stars}.0</span></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- LOGIC VIEW ROUTER ---
  const renderContent = () => {
    if (activeTab === 'profil') return <ProfilView />;
    if (currentUser?.role === 'warga') {
      switch(activeTab) {
        case 'beranda': return <WargaBeranda />;
        case 'lapor': return <WargaLapor />;
        case 'kas': return <UangKasView />;
        case 'penilaian': return <WargaPenilaian />;
        default: return <WargaBeranda />;
      }
    } else {
      switch(activeTab) {
        case 'keluhan': return <RtKeluhanView />;
        case 'warga': return <RtDataWargaView />;
        case 'jadwal': return <RtBuatJadwalDanInfo />;
        case 'kas': return <UangKasView />;
        case 'penilaian': return <RtPenilaianView />;
        default: return <RtKeluhanView />;
      }
    }
  };

  // --- MAIN RENDER (WRAPPER) ---
  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-[#F8FAFC] text-slate-800'} ${currentUser ? 'pb-24 md:pb-0 md:pl-72' : ''}`}>
      
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center animate-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 mr-3 text-emerald-400" />
          <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {isLoadingDB && (view === 'login' || view === 'register') && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
            <p className="font-bold text-white">Menghubungkan ke Server...</p>
         </div>
      )}

      {/* --- AUTH SCREENS (DENGAN ANIMASI GESER) --- */}
      {(!currentUser) && (
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-5 bg-inherit overflow-hidden">
          
          <div className={`w-full max-w-[400px] h-[90vh] max-h-[720px] flex flex-col rounded-[2.5rem] shadow-2xl relative border transition-colors duration-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="overflow-x-hidden overflow-y-auto w-full relative z-10 flex-1 rounded-[2.5rem]">
               <div 
                 className="flex transition-transform duration-500 ease-in-out w-[200%] items-start min-h-full"
                 style={{ transform: view === 'login' ? 'translateX(0)' : 'translateX(-50%)' }}
               >
                 {/* LOGIN PANE */}
                 <div className="w-1/2 p-6 sm:p-8 flex flex-col justify-center min-h-full pt-12">
                   <div className="text-center mb-8 mt-2">
                     <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-200/50"><Home className="w-10 h-10" /></div>
                     <h1 className={`text-3xl font-extrabold mb-1 tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Cintalembur</h1>
                     <p className="text-sm text-slate-500 font-medium">Selamat Datang Kembali.</p>
                   </div>
                   
                   <form onSubmit={handleLogin} className="space-y-5">
                     <input type="text" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} placeholder="Email / rt@cintalembur.com" className={`w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all ${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                     <input type="password" value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} placeholder="Password Akun / Password RT" className={`w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all ${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                     <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all mt-2">Masuk ke Aplikasi</button>
                   </form>
                   
                   <div className="text-center mt-8 pb-4">
                     <p className="text-sm text-slate-500">Warga baru? <button type="button" onClick={() => { setView('register'); setOtpSent(false); }} className="text-emerald-600 font-extrabold hover:underline">Daftar Akun</button></p>
                   </div>
                 </div>

                 {/* REGISTER PANE */}
                 <div className="w-1/2 p-6 sm:p-8 flex flex-col justify-start min-h-full pt-8">
                   <h2 className={`text-2xl font-extrabold mb-2 mt-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{otpSent ? 'Verifikasi OTP' : 'Daftar Warga Baru'}</h2>
                   <p className="text-sm text-slate-500 mb-6">{otpSent ? `Kode 6 digit telah dikirim ke email Anda.` : 'Lengkapi data resmi untuk bergabung.'}</p>
                   
                   {!otpSent ? (
                     <form onSubmit={startRegistration} className="space-y-4">
                       <input type="text" value={regData.nama} onChange={(e)=>setRegData({...regData, nama: e.target.value})} placeholder="Nama Lengkap Sesuai KTP" className={`w-full p-4 rounded-2xl outline-none text-sm transition-all ${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                       <input type="number" value={regData.nik} onChange={(e)=>setRegData({...regData, nik: e.target.value})} placeholder="Nomor Induk Kependudukan (NIK)" className={`w-full p-4 rounded-2xl outline-none text-sm transition-all ${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                       <div className="grid grid-cols-2 gap-4">
                         <input type="number" value={regData.umur} onChange={(e)=>setRegData({...regData, umur: e.target.value})} placeholder="Umur" className={`w-full p-4 rounded-2xl outline-none text-sm transition-all ${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                         <select value={regData.sebutan} onChange={(e)=>setRegData({...regData, sebutan: e.target.value})} className={`w-full p-4 rounded-2xl outline-none text-sm transition-all ${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                           <option value="Bapak">Bapak</option><option value="Ibu">Ibu</option><option value="Saudara">Sdr/Sdri</option>
                         </select>
                       </div>
                       <input type="email" value={regData.email} onChange={(e)=>setRegData({...regData, email: e.target.value})} placeholder="Alamat Email Aktif" className={`w-full p-4 rounded-2xl outline-none text-sm transition-all ${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                       <input type="password" value={regData.password} onChange={(e)=>setRegData({...regData, password: e.target.value})} placeholder="Buat Password" className={`w-full p-4 rounded-2xl outline-none text-sm transition-all ${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                       
                       <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg mt-2 active:scale-95 transition-all">Minta Kode OTP</button>
                     </form>
                   ) : (
                     <div className="space-y-6">
                       <input type="number" value={inputOtp} onChange={(e)=>setInputOtp(e.target.value)} placeholder="000000" className={`w-full p-5 text-center text-3xl font-extrabold tracking-[0.5em] rounded-2xl outline-none border-2 focus:border-emerald-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                       <button onClick={verifyOtpAndRegister} disabled={isLoadingDB} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex justify-center">
                         {isLoadingDB ? <Loader2 className="w-6 h-6 animate-spin"/> : 'Verifikasi OTP & Daftar'}
                       </button>
                       <button type="button" onClick={()=>setOtpSent(false)} className="w-full text-sm text-slate-500 font-bold hover:underline">Ubah Data Pendaftaran</button>
                     </div>
                   )}
                   
                   <div className="mt-8 pb-4">
                     <button type="button" onClick={() => setView('login')} className="text-sm text-slate-500 font-bold w-full text-center hover:text-slate-800 transition-colors">
                       ← Kembali ke Halaman Login
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DASHBOARD SCREENS --- */}
      {currentUser && (
        <>
          <nav className={`fixed bottom-0 md:left-0 w-full md:w-72 border-t md:border-t-0 md:border-r flex justify-around md:justify-start p-3 md:p-6 z-50 md:h-screen md:flex-col shadow-2xl transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/60'}`}>
            <div className={`hidden md:flex flex-col items-center mb-10 px-2 py-8 text-center rounded-3xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-600 text-white rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200/50"><Home className="w-10 h-10" /></div>
              <h1 className={`font-extrabold text-xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Cintalembur</h1>
            </div>

            {currentUser.role === 'warga' && (
              <div className="flex md:flex-col w-full justify-around md:justify-start gap-1 md:gap-3">
                <button onClick={() => setActiveTab('beranda')} className={`flex flex-col md:flex-row items-center md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'beranda' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 border' : 'text-slate-500 hover:bg-slate-500/5'}`}><Home className="w-6 h-6 md:w-5 md:h-5 md:mr-4" /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Beranda</span></button>
                <button onClick={() => setActiveTab('profil')} className={`flex flex-col md:flex-row items-center md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'profil' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 border' : 'text-slate-500 hover:bg-slate-500/5'}`}><User className="w-6 h-6 md:w-5 md:h-5 md:mr-4" /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Profil</span></button>
                <button onClick={handleLogout} className="flex flex-col md:flex-row items-center md:px-5 py-2.5 md:py-4 rounded-2xl text-rose-500 hover:bg-rose-500/5 transition-all"><LogOut className="w-6 h-6 md:w-5 md:h-5 md:mr-4" /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Keluar</span></button>
              </div>
            )}

            {currentUser.role === 'rt' && (
              <div className="flex md:flex-col w-full justify-around md:justify-start gap-1 md:gap-3">
                <button onClick={() => setActiveTab('keluhan')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'keluhan' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 border' : 'text-slate-500 hover:bg-slate-500/5'}`}><AlertTriangle className="w-6 h-6 md:w-5 md:h-5 md:mr-4" /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Laporan</span></button>
                <button onClick={() => setActiveTab('jadwal')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'jadwal' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 border' : 'text-slate-500 hover:bg-slate-500/5'}`}><CalendarDays className="w-6 h-6 md:w-5 md:h-5 md:mr-4" /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Jadwal</span></button>
                <button onClick={() => setActiveTab('kas')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'kas' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 border' : 'text-slate-500 hover:bg-slate-500/5'}`}><Wallet className="w-6 h-6 md:w-5 md:h-5 md:mr-4" /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Keuangan</span></button>
                <button onClick={() => setActiveTab('warga')} className={`hidden md:flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'warga' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 border' : 'text-slate-500 hover:bg-slate-500/5'}`}><Users className="w-6 h-6 md:w-5 md:h-5 md:mr-4" /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Data Warga</span></button>
                <button onClick={() => setActiveTab('warga')} className={`md:hidden flex flex-col items-center justify-center flex-1 py-2.5 transition-all ${activeTab === 'warga' ? 'text-indigo-500' : 'text-slate-400'}`}><Users className="w-6 h-6" /><span className="text-[10px] font-bold mt-1.5">Warga</span></button>
                <button onClick={() => setActiveTab('penilaian')} className={`hidden md:flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'penilaian' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 border' : 'text-slate-500 hover:bg-slate-500/5'}`}><Star className="w-6 h-6 md:w-5 md:h-5 md:mr-4" /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Evaluasi</span></button>
              </div>
            )}

            <div className="hidden md:flex md:mt-auto md:flex-col w-full gap-3 pt-6 border-t border-slate-100">
              <button onClick={handleLogout} className="flex items-center px-5 py-4 rounded-2xl transition-all text-red-500 hover:bg-red-50 w-full group">
                <LogOut className="w-5 h-5 mr-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold">Keluar Akun</span>
              </button>
            </div>
          </nav>

          <div className="flex flex-col min-h-screen relative w-full">
            <button onClick={fetchDataFromDB} disabled={isLoadingDB} className="md:hidden fixed bottom-24 right-5 bg-emerald-600 p-3 rounded-full shadow-lg text-white z-40"><RefreshCw className={`w-6 h-6 ${isLoadingDB ? 'animate-spin' : ''}`} /></button>
            <HeaderDashboard />
            
            <main className="flex-1 w-full max-w-5xl mx-auto px-5 pb-8 pt-4 md:px-8 flex flex-col">
              {renderContent()}

              {/* TANDA AIR (WATERMARK) DI SETIAP MENU APLIKASI */}
              <div className="mt-auto pt-16 pb-4 text-center">
                <p className={`text-[11px] font-extrabold tracking-[0.25em] uppercase ${darkMode ? 'text-slate-700' : 'text-slate-400'}`}>
                  Appby_Amarmuhammad
                </p>
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
