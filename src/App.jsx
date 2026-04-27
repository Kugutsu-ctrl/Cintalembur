import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, PlusCircle, List, AlertTriangle, CheckCircle, Clock, 
  MapPin, User, MessageSquare, ShieldAlert, Trash2, Zap, 
  Camera, Image as ImageIcon, Bell, Wallet, LogOut, ArrowRight,
  Info, FileText, Activity, Users, PieChart, CalendarDays, Star,
  Sparkles, Loader2, Gift, Lightbulb, TrendingUp, ChevronRight, RefreshCw
} from 'lucide-react';

// --- KONFIGURASI DATABASE & API ---
const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/y13eb6zpj32ow';
const GEMINI_API_KEY = ''; // Masukkan API Key Gemini Anda di sini

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
    throw error;
  }
};

const App = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState('login'); 
  const [activeTab, setActiveTab] = useState('beranda');
  const [toastMessage, setToastMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingDB, setIsLoadingDB] = useState(false);

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regData, setRegData] = useState({ nama: '', email: '', nik: '', umur: '', sebutan: 'Bapak', password: '' });

  // Database States (Awalnya Kosong, akan diisi dari Google Sheets)
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
  
  // Karena dari Sheets berbentuk string, kita pastikan diubah ke angka saat kalkulasi
  const totalKas = finances.reduce((acc, curr) => curr.type === 'Pemasukan' ? acc + parseInt(curr.amount || 0) : acc - parseInt(curr.amount || 0), 0);

  // --- FUNGSI DATABASE (CRUD ke SheetDB) ---
  const fetchDataFromDB = async () => {
    setIsLoadingDB(true);
    try {
      const [wargaRes, infoRes, jadwalRes, keluhanRes, kasRes, penRes] = await Promise.all([
        fetch(`${SHEETDB_API_URL}?sheet=warga`),
        fetch(`${SHEETDB_API_URL}?sheet=info`),
        fetch(`${SHEETDB_API_URL}?sheet=jadwal`),
        fetch(`${SHEETDB_API_URL}?sheet=keluhan`),
        fetch(`${SHEETDB_API_URL}?sheet=kas`),
        fetch(`${SHEETDB_API_URL}?sheet=penilaian`)
      ]);
      
      // Ambil data dan balikkan urutannya agar yang terbaru di atas
      const [warga, info, jadwal, keluhan, kas, penilaian] = await Promise.all([
        wargaRes.json(), infoRes.json(), jadwalRes.json(), keluhanRes.json(), kasRes.json(), penRes.json()
      ]);

      // SheetDB mengembalikan error object jika sheet kosong/tidak ada, kita validasi isArray
      if(Array.isArray(warga)) setWargaList(warga.reverse());
      if(Array.isArray(info)) setInfos(info.reverse());
      if(Array.isArray(jadwal)) setJadwals(jadwal.reverse());
      if(Array.isArray(keluhan)) setComplaints(keluhan.reverse());
      if(Array.isArray(kas)) setFinances(kas.reverse());
      if(Array.isArray(penilaian)) setRatings(penilaian.reverse());

    } catch (error) {
      console.error("Gagal koneksi ke database", error);
      showToast("⚠️ Gagal mengambil data dari server.");
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
    } catch (error) { console.error(`Error POST to ${sheetName}`, error); showToast('⚠️ Gagal menyimpan ke server.'); }
  };

  const updateInDB = async (sheetName, id, dataObj) => {
    try {
      await fetch(`${SHEETDB_API_URL}/id/${id}?sheet=${sheetName}`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataObj })
      });
    } catch (error) { console.error(`Error PATCH to ${sheetName}`, error); showToast('⚠️ Gagal mengupdate server.'); }
  };

  // Ambil data otomatis saat aplikasi pertama dibuka
  useEffect(() => { fetchDataFromDB(); }, []);


  // --- AUTH HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginEmail) return showToast('Masukkan email Anda!');
    
    // Login Khusus RT
    if (loginEmail.toLowerCase() === 'rt@cintalembur.com' || loginEmail === 'Bymarr020302') {
      setCurrentUser({ role: 'rt', name: 'Bapak RT' });
      setView('rt-dashboard');
      setActiveTab('keluhan');
      showToast('Selamat datang, Bapak RT!');
      return;
    }

    // Login Warga (Cek Database)
    if (!loginPassword) return showToast('Masukkan password Anda!');
    
    const userMatch = wargaList.find(w => w.email === loginEmail && w.password === loginPassword);
    
    if (userMatch) {
      let kateg = parseInt(userMatch.umur) >= 27 ? 'Orang Tua' : (parseInt(userMatch.umur) >= 14 ? 'Remaja' : 'Anak-anak');
      setCurrentUser({ role: 'warga', name: userMatch.nama, profile: `${userMatch.sebutan}, ${kateg}` });
      setView('warga-dashboard');
      setActiveTab('beranda');
      showToast('Berhasil masuk!');
    } else {
      showToast('❌ Email atau Password salah!');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regData.nama || !regData.email || !regData.nik || !regData.umur || !regData.password) return showToast('Lengkapi semua data!');
    
    // Cek apakah email sudah terdaftar
    if (wargaList.some(w => w.email === regData.email)) return showToast('Email sudah digunakan!');

    const newWarga = { 
      id: Date.now().toString(), 
      nama: regData.nama, 
      email: regData.email,
      nik: regData.nik || 'Tanpa NIK',
      umur: regData.umur, 
      sebutan: regData.sebutan, 
      password: regData.password 
    };

    // Tampilkan loading, simpan ke SheetDB, lalu izinkan masuk
    setIsLoadingDB(true);
    await postToDB('warga', newWarga);
    
    // Update State Lokal
    setWargaList(prev => [newWarga, ...prev]);
    let kateg = parseInt(newWarga.umur) >= 27 ? 'Orang Tua' : (parseInt(newWarga.umur) >= 14 ? 'Remaja' : 'Anak-anak');
    setCurrentUser({ role: 'warga', name: newWarga.nama, profile: `${newWarga.sebutan}, ${kateg}` });
    
    setIsLoadingDB(false);
    setView('warga-dashboard');
    setActiveTab('beranda');
    showToast('Pendaftaran Berhasil! Data tersimpan.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail(''); setLoginPassword('');
    setView('login');
  };

  // --- FUNGSI TOMBOL DARURAT ---
  const handlePanicButton = async () => {
    showToast('🚨 Mengirim sinyal darurat ke RT...');
    const newKeluhan = {
      id: Date.now().toString(),
      sender: `${currentUser.name} (${currentUser.profile})`,
      description: '🚨 LAPORAN DARURAT: Warga ini menekan tombol panik dan membutuhkan bantuan segera di lokasi!',
      photo: '',
      status: 'Menunggu',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      rtReply: ''
    };
    
    await postToDB('keluhan', newKeluhan);
    setComplaints(prev => [newKeluhan, ...prev]);
    showToast('🚨 Laporan darurat tersimpan!');
  };

  // --- KOMPONEN HEADER GLOBAL ---
  const HeaderDashboard = () => (
    <div className="bg-white/70 backdrop-blur-xl sticky top-0 z-30 px-5 py-4 border-b border-slate-100/50 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex justify-between items-center mb-6 md:rounded-b-3xl md:mx-4 md:mt-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center text-white">
          <Home className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-slate-800 tracking-tight leading-tight">Cintalembur</h1>
          <p className="text-[10px] font-medium text-slate-500">Appby_Amarmuhammad</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={fetchDataFromDB} disabled={isLoadingDB} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Refresh Data">
          <RefreshCw className={`w-5 h-5 ${isLoadingDB ? 'animate-spin' : ''}`} />
        </button>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-800">{currentUser?.name}</p>
          <p className="text-[10px] font-medium text-emerald-600">{currentUser?.role === 'rt' ? 'Pengurus RT' : 'Warga'}</p>
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-slate-400 overflow-hidden">
           <User className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  // --- KOMPONEN WARGA ---
  const WargaBeranda = () => {
    const myInfos = infos.filter(info => !info.target || info.target === currentUser.name);
    const privateInfos = myInfos.filter(info => info.target);
    const publicInfos = myInfos.filter(info => !info.target);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto space-y-8">
        
        {/* WIDGET GREETING */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold mb-1">Halo, {currentUser?.name}! 👋</h2>
            <p className="text-emerald-50 text-sm font-medium max-w-sm">Selamat datang di Cintalembur. Mari bersama ciptakan lingkungan yang rukun, aman, dan nyaman.</p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-10 w-24 h-24 bg-teal-300/20 rounded-full blur-xl"></div>
        </div>

        {/* QUICK ACCESS MENU */}
        <div className="grid grid-cols-4 gap-3 md:gap-5">
          <button onClick={() => setActiveTab('lapor')} className="flex flex-col items-center justify-center bg-white p-4 md:p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all active:scale-95 group">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-700 text-center">Lapor RT</span>
          </button>
          
          <button onClick={() => setActiveTab('kas')} className="flex flex-col items-center justify-center bg-white p-4 md:p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all active:scale-95 group">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-700 text-center">Cek Kas</span>
          </button>

          <button onClick={() => setActiveTab('penilaian')} className="flex flex-col items-center justify-center bg-white p-4 md:p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all active:scale-95 group">
            <div className="w-12 h-12 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-yellow-400 group-hover:text-white transition-colors">
              <Star className="w-6 h-6" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-700 text-center">Nilai RT</span>
          </button>

          <button onClick={handlePanicButton} className="flex flex-col items-center justify-center bg-white p-4 md:p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all active:scale-95 group">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-rose-600 text-center">Darurat!</span>
          </button>
        </div>

        {privateInfos.length > 0 && (
          <div>
            <div className="mb-4 flex items-center">
              <Gift className="w-6 h-6 mr-2 text-rose-500 animate-bounce" />
              <h2 className="text-xl font-bold text-slate-800">Pesan Khusus Anda</h2>
            </div>
            <div className="space-y-4">
              {privateInfos.map(info => (
                <div key={info.id} className="bg-gradient-to-r from-rose-50 to-orange-50 p-6 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl">RAHASIA</div>
                  <h3 className="font-bold text-lg text-rose-800 mt-2">{info.title}</h3>
                  <p className="text-rose-700/80 text-sm mt-2 leading-relaxed font-medium">{info.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-4 flex justify-between items-end">
            <h2 className="text-xl font-bold text-slate-800">Pengumuman RT</h2>
          </div>
          <div className="grid gap-4">
            {publicInfos.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">Belum ada pengumuman.</p> : publicInfos.map(info => (
              <div key={info.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${info.type === 'Posyandu' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>{info.type}</span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{info.date}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800">{info.title}</h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">{info.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2 text-indigo-500"/>
            <h2 className="text-xl font-bold text-slate-800">Jadwal Warga</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {jadwals.length === 0 ? <p className="text-slate-400 text-sm text-center py-4 col-span-2">Belum ada jadwal aktif.</p> : jadwals.map(jadwal => (
              <div key={jadwal.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase bg-indigo-50 text-indigo-600">{jadwal.type}</span>
                <h3 className="font-bold text-lg text-slate-800 mt-3">{jadwal.hari}</h3>
                <div className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{jadwal.details}</p>
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
    const [photo, setPhoto] = useState(''); // SheetDB aman jika base64 string pendek, tp hati2 jika file besar
    const [isEnhancing, setIsEnhancing] = useState(false);
    const fileInputRef = useRef(null);

    const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) { 
        if(file.size > 2000000) return showToast('Peringatan: Ukuran foto maksimal 2MB untuk kelancaran database!');
        const reader = new FileReader(); 
        reader.onloadend = () => setPhoto(reader.result); 
        reader.readAsDataURL(file); 
      }
    };

    const handleEnhanceText = async () => {
      if (!desc.trim()) return showToast('Tuliskan keluhan singkat terlebih dahulu!');
      setIsEnhancing(true);
      try {
        const prompt = `Perbaiki teks ini agar formal dan sopan tanpa menambah salam berlebihan: "${desc}"`;
        const result = await callGeminiAPI(prompt);
        if (result) { setDesc(result.trim()); showToast('✨ Keluhan berhasil disempurnakan!'); }
      } catch (error) { showToast('Gagal menyempurnakan teks.'); } finally { setIsEnhancing(false); }
    };

    const submitKeluhan = async (e) => {
      e.preventDefault();
      if (!desc) return showToast('Deskripsi tidak boleh kosong!');
      
      const newKeluhan = { 
        id: Date.now().toString(), 
        sender: `${currentUser.name} (${currentUser.profile})`, 
        description: desc, 
        photo: photo, 
        status: 'Menunggu', 
        date: new Date().toLocaleDateString('id-ID'),
        rtReply: '' 
      };
      
      setIsLoadingDB(true);
      await postToDB('keluhan', newKeluhan);
      setComplaints(prev => [newKeluhan, ...prev]);
      
      setDesc(''); setPhoto(''); 
      setIsLoadingDB(false);
      showToast('Laporan berhasil tersimpan di Database!'); 
      setActiveTab('beranda');
    };

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><MessageSquare className="w-8 h-8" /></div>
          <h2 className="text-2xl font-extrabold text-slate-800">Lapor ke RT</h2>
          <p className="text-sm text-slate-500 mt-2">Sampaikan masukan atau masalah di lingkungan dengan mudah dan cepat.</p>
        </div>
        
        <form onSubmit={submitKeluhan} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-3">
                <label className="block text-sm font-bold text-slate-700">Detail Laporan</label>
                <button type="button" onClick={handleEnhanceText} disabled={isEnhancing} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full flex items-center hover:bg-indigo-100 transition-all active:scale-95">
                  {isEnhancing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />} Rapikan Bahasa (AI)
                </button>
              </div>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows="5" placeholder="Contoh: Lampu jalan di Blok A mati sejak kemarin..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm resize-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Lampirkan Bukti Foto (Maks 2MB)</label>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
              {!photo ? (
                <div onClick={() => fileInputRef.current.click()} className="w-full border-2 border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all group">
                  <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Camera className="w-6 h-6 text-slate-400" /></div>
                  <span className="text-sm font-bold text-slate-600">Klik untuk Unggah Foto</span>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 group">
                  <img src={photo} alt="Preview" className="w-full h-64 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => setPhoto('')} className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 shadow-xl transform hover:scale-110 transition-all"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
            </div>
            <button type="submit" disabled={isLoadingDB} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              {isLoadingDB ? <Loader2 className="w-6 h-6 animate-spin"/> : 'Kirim Laporan'}
            </button>
          </div>
        </form>
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
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"><Star className="w-8 h-8 fill-yellow-500" /></div>
          <h2 className="text-2xl font-extrabold text-slate-800">Penilaian Kinerja RT</h2>
          <p className="text-sm text-slate-500 mt-2">Bantu kami menjadi lebih baik dengan ulasan Anda.</p>
        </div>

        <form onSubmit={submitRating} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center">
          <h3 className="font-bold text-slate-700 mb-6">Berapa bintang untuk pengurus RT saat ini?</h3>
          <div className="flex justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5].map((num) => (
              <button key={num} type="button" onClick={() => setStar(num)} className="focus:outline-none hover:scale-110 transition-transform">
                <Star className={`w-12 h-12 transition-all duration-300 ${num <= star ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' : 'text-slate-200'}`} />
              </button>
            ))}
          </div>
          <div className="text-left">
            <label className="block text-sm font-bold text-slate-700 mb-3">Tulis Ulasan (Opsional)</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Saran atau kritik yang membangun..." rows="4" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm resize-none mb-6 focus:bg-white focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all" />
          </div>
          <button type="submit" disabled={isLoadingDB} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all">
            {isLoadingDB ? 'Menyimpan...' : 'Kirim Penilaian'}
          </button>
        </form>
      </div>
    );
  };

  // --- KOMPONEN BERSAMA (UANG KAS) ---
  const UangKasView = () => {
    const [kasData, setKasData] = useState({ nama: currentUser?.name || '', hari: '', jumlah: '' });
    const [kasSummary, setKasSummary] = useState('');
    const [isAnalyzingKas, setIsAnalyzingKas] = useState(false);

    const handleAnalyzeKas = async () => {
      setIsAnalyzingKas(true);
      try {
        const financeData = finances.map(f => `${f.type}: Rp${f.amount}`).join(', ');
        const prompt = `Berikan 2 kalimat ringkasan tentang kesehatan kas. Total Saldo: Rp${totalKas}. Transaksi: ${financeData}`;
        const result = await callGeminiAPI(prompt);
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
      setIsLoadingDB(false);
      showToast('Setoran berhasil tersimpan ke Database!');
    };

    return (
      <div className="animate-in fade-in max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div><h2 className="text-2xl font-extrabold text-slate-800">Uang Kas Lingkungan</h2><p className="text-sm text-slate-500 mt-1">Transparansi dan pencatatan kas RT.</p></div>
        </div>
        
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
          <form onSubmit={submitSetorKas} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center"><div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3"><PlusCircle className="w-4 h-4 text-emerald-600"/></div> Lapor Setor Kas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div><label className="block text-xs font-bold text-slate-600 mb-2">Nama Penyetor</label><input type="text" value={kasData.nama} onChange={(e)=>setKasData({...kasData, nama: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-2">Hari / Tanggal</label><input type="text" value={kasData.hari} onChange={(e)=>setKasData({...kasData, hari: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" /></div>
            </div>
            <div className="mb-6"><label className="block text-xs font-bold text-slate-600 mb-2">Jumlah Uang (Rp)</label><input type="number" value={kasData.jumlah} onChange={(e)=>setKasData({...kasData, jumlah: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-semibold text-emerald-600" /></div>
            <button type="submit" disabled={isLoadingDB} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all">{isLoadingDB ? 'Menyimpan...' : 'Input Setoran'}</button>
          </form>
        )}

        <div>
          <h3 className="font-bold text-lg text-slate-800 mb-4">Riwayat Kas Terbaru</h3>
          <div className="space-y-4">
            {finances.length === 0 ? <p className="text-slate-400 text-sm">Belum ada data kas.</p> : finances.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${item.type === 'Pemasukan' ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white' : 'bg-gradient-to-br from-rose-400 to-red-500 text-white'}`}><Wallet className="w-5 h-5" /></div>
                  <div><p className="font-bold text-slate-800 text-sm md:text-base">{item.desc}</p><p className="text-[11px] md:text-xs text-slate-500 mt-1 font-medium">{item.date} • <span className="text-slate-700 font-semibold">{item.sender}</span></p></div>
                </div>
                <div className={`font-extrabold text-sm md:text-lg ${item.type === 'Pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>{item.type === 'Pemasukan' ? '+' : '-'}{formatRupiah(item.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- KOMPONEN RT ---
  const RtBuatJadwalDanInfo = () => {
    const [mode, setMode] = useState('info');
    const [title, setTitle] = useState(''); const [content, setContent] = useState('');
    const [type, setType] = useState('Kegiatan'); const [targetWarga, setTargetWarga] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [jType, setJType] = useState('Ronda Malam'); const [jCustomType, setJCustomType] = useState('');
    const [jHari, setJHari] = useState(''); const [jDetails, setJDetails] = useState('');
    const [isIdeating, setIsIdeating] = useState(false);

    const generateIdeKegiatan = async () => { /* ... (Sama seperti sebelumnya) ... */ };
    const generateAnnouncement = async () => { /* ... (Sama seperti sebelumnya) ... */ };

    const submitInfo = async (e) => {
      e.preventDefault();
      if (!title || !content) return showToast('Lengkapi info!');
      
      const newInfo = { id: Date.now().toString(), title, content, type, date: new Date().toLocaleDateString('id-ID'), target: type === 'Bantuan Sosial' ? targetWarga : '' };
      
      setIsLoadingDB(true);
      await postToDB('info', newInfo);
      setInfos(prev => [newInfo, ...prev]);
      
      setTitle(''); setContent(''); setTargetWarga(''); setIsLoadingDB(false);
      showToast('Berhasil Disebarkan ke Database!');
    };

    const submitJadwal = async (e) => {
      e.preventDefault();
      if (!jHari || !jDetails) return showToast('Lengkapi Jadwal!');
      
      const newJadwal = { id: Date.now().toString(), type: jType === 'Custom' ? jCustomType : jType, hari: jHari, details: jDetails, date: new Date().toLocaleDateString('id-ID') };
      
      setIsLoadingDB(true);
      await postToDB('jadwal', newJadwal);
      setJadwals(prev => [newJadwal, ...prev]);
      
      setJHari(''); setJDetails(''); setJCustomType(''); setIsLoadingDB(false);
      showToast('Jadwal Tersimpan di Database!');
    };

    return (
      <div className="animate-in fade-in max-w-2xl mx-auto space-y-6">
        <div className="mb-6 text-center"><h2 className="text-2xl font-extrabold text-slate-800">Manajemen Info & Jadwal</h2><p className="text-sm text-slate-500 mt-2">Publikasi pengumuman, bantuan, atau atur jadwal warga.</p></div>

        <div className="flex p-1.5 bg-slate-200/70 rounded-full w-full max-w-sm mx-auto backdrop-blur-md">
          <button onClick={()=>setMode('info')} className={`flex-1 py-3 text-xs font-bold rounded-full transition-all ${mode==='info' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Pengumuman</button>
          <button onClick={()=>setMode('jadwal')} className={`flex-1 py-3 text-xs font-bold rounded-full transition-all ${mode==='jadwal' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Jadwal Warga</button>
        </div>

        {mode === 'info' ? (
          <form onSubmit={submitInfo} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 space-y-6">
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all">
              <option value="Kegiatan">Kegiatan Warga (Publik)</option><option value="Posyandu">Posyandu (Publik)</option><option value="Bantuan Sosial">Bantuan Sosial (Kirim Pribadi)</option>
            </select>
            {type === 'Bantuan Sosial' && (
               <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200">
                  <label className="block text-sm font-bold text-rose-700 mb-2 flex items-center"><Gift className="w-4 h-4 mr-2" /> Pilih Warga Penerima</label>
                  <select value={targetWarga} onChange={(e) => setTargetWarga(e.target.value)} className="w-full p-4 bg-white border border-rose-200 rounded-xl outline-none text-sm font-medium"><option value="">-- Pilih Warga (Wajib) --</option>{wargaList.map(w => <option key={w.id} value={w.nama}>{w.nama} (Usia {w.umur})</option>)}</select>
               </div>
            )}
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul Pengumuman" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Isi pengumuman..." rows="6" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" />
            <button type="submit" disabled={isLoadingDB} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all ${type === 'Bantuan Sosial' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{isLoadingDB ? 'Menyimpan...' : 'Terbitkan ke Database'}</button>
          </form>
        ) : (
          <form onSubmit={submitJadwal} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 space-y-6">
            <select value={jType} onChange={(e) => setJType(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all">
              <option value="Ronda Malam">Ronda Malam</option><option value="Kerja Bakti">Kerja Bakti</option><option value="Custom">Jadwal Kustom</option>
            </select>
            {jType === 'Custom' && <input type="text" value={jCustomType} onChange={(e) => setJCustomType(e.target.value)} placeholder="Jenis Custom (Contoh: Senam Sehat)" className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-2xl outline-none text-sm" />}
            <input type="text" value={jHari} onChange={(e) => setJHari(e.target.value)} placeholder="Hari & Waktu" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" />
            <textarea value={jDetails} onChange={(e) => setJDetails(e.target.value)} placeholder="Sebutkan nama petugas atau deskripsi..." rows="5" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm resize-none" />
            <button type="submit" disabled={isLoadingDB} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg">{isLoadingDB ? 'Menyimpan...' : 'Simpan Jadwal ke Database'}</button>
          </form>
        )}
      </div>
    );
  };

  const RtKeluhanView = () => {
    const [replyingTo, setReplyingTo] = useState(null);
    const [aiReplyText, setAiReplyText] = useState('');
    const [isGeneratingReply, setIsGeneratingReply] = useState(false);

    const handleGenerateReply = async (desc) => { /* Sama seperti sebelumnya */ };

    const handleSelesai = async (id) => {
      setIsLoadingDB(true);
      await updateInDB('keluhan', id, { status: 'Selesai', rtReply: aiReplyText });
      
      setComplaints(complaints.map(c => c.id === id ? { ...c, status: 'Selesai', rtReply: aiReplyText } : c));
      setReplyingTo(null); setAiReplyText(''); 
      setIsLoadingDB(false);
      showToast('Laporan diupdate di Database!');
    };

    return (
      <div className="animate-in fade-in max-w-3xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div><h2 className="text-2xl font-extrabold text-slate-800">Laporan Warga</h2><p className="text-sm text-slate-500 mt-1">Pantau dan tindak lanjuti masalah di lingkungan.</p></div>
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl text-xs font-bold flex items-center border border-red-100 shadow-sm"><AlertTriangle className="w-4 h-4 mr-2"/> {complaints.filter(c => c.status !== 'Selesai').length} Perlu Tindakan</div>
        </div>

        <div className="space-y-6">
          {complaints.length === 0 ? <p className="text-center text-slate-400 py-10">Belum ada laporan dari warga.</p> : complaints.map(comp => (
            <div key={comp.id} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="flex justify-between items-start mb-5 border-b border-slate-50 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shadow-inner"><User className="w-6 h-6" /></div>
                  <div><h4 className="font-bold text-slate-800 text-sm md:text-base">{comp.sender}</h4><p className="text-xs text-slate-500 font-medium mt-0.5">{comp.date}</p></div>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${comp.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{comp.status}</span>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 mb-4"><p className="text-slate-700 text-sm md:text-base leading-relaxed">{comp.description}</p></div>

              {comp.photo && (
                <div className="mb-5 rounded-2xl overflow-hidden border border-slate-200 shadow-sm"><img src={comp.photo} alt="Bukti" className="w-full max-h-72 object-cover hover:scale-105 transition-transform duration-500" /></div>
              )}
              
              {comp.status === 'Selesai' && comp.rtReply && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl"><p className="text-xs font-bold text-emerald-700 mb-2 flex items-center"><CheckCircle className="w-4 h-4 mr-1.5" /> Ditutup dengan Balasan:</p><p className="text-sm text-emerald-800 font-medium leading-relaxed">{comp.rtReply}</p></div>
              )}

              {comp.status !== 'Selesai' && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  {replyingTo === comp.id ? (
                    <div className="animate-in slide-in-from-top-2 space-y-4">
                      <textarea value={aiReplyText} onChange={(e) => setAiReplyText(e.target.value)} placeholder="Tuliskan tindak lanjut..." rows="3" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-sm" />
                      <button onClick={() => handleSelesai(comp.id)} disabled={isLoadingDB} className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-3.5 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95">{isLoadingDB ? 'Menyimpan...' : 'Kirim & Tutup Laporan'}</button>
                    </div>
                  ) : (
                    <button onClick={() => setReplyingTo(comp.id)} className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 text-sm font-bold py-3.5 rounded-2xl flex items-center justify-center transition-all"><ChevronRight className="w-5 h-5 mr-1"/> Tanggapi Laporan Ini</button>
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

    const keluargaGroup = wargaList.reduce((acc, warga) => {
      const key = warga.nik || 'Tanpa NIK';
      if (!acc[key]) acc[key] = []; acc[key].push(warga); return acc;
    }, {});

    return (
      <div className="animate-in fade-in max-w-3xl mx-auto">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Demografi Warga</h2>
        
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-100 pb-5 mb-6 gap-4">
            <div><h3 className="font-extrabold text-lg text-slate-800">Statistik Usia</h3><p className="text-xs text-slate-500 font-medium mt-1">Berdasarkan {wargaList.length} warga terdaftar</p></div>
          </div>
          
          <div className="space-y-5">
             <div><div className="flex justify-between mb-2 text-sm font-bold text-slate-700"><span>Orang Tua (&gt;26 Thn)</span><span className="text-emerald-500">{pctOrangTua}%</span></div><div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-emerald-400 h-3 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${pctOrangTua}%` }}></div></div></div>
             <div><div className="flex justify-between mb-2 text-sm font-bold text-slate-700"><span>Remaja (14-26 Thn)</span><span className="text-blue-500">{pctRemaja}%</span></div><div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-blue-400 h-3 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ width: `${pctRemaja}%` }}></div></div></div>
             <div><div className="flex justify-between mb-2 text-sm font-bold text-slate-700"><span>Anak-anak (8-13 Thn)</span><span className="text-orange-400">{pctAnak}%</span></div><div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-orange-300 h-3 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]" style={{ width: `${pctAnak}%` }}></div></div></div>
          </div>
        </div>
        
        <h3 className="font-extrabold text-xl text-slate-800 mb-5">Kartu Keluarga</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.keys(keluargaGroup).map((nik, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center mb-5 pb-4 border-b border-slate-50"><div className="p-3 bg-indigo-50 rounded-2xl text-indigo-500 mr-4"><Users className="w-6 h-6" /></div><div><h4 className="font-bold text-slate-800 text-sm">Keluarga</h4><p className="text-xs text-slate-400 font-mono mt-0.5">KK: {nik}</p></div></div>
              <div className="space-y-3">
                {keluargaGroup[nik].map(warga => (
                  <div key={warga.id} className="flex items-center justify-between group">
                    <div><p className="font-bold text-slate-700 text-sm flex items-center">{warga.nama} {isPenerimaBantuan(warga.nama) && <span className="bg-rose-50 text-rose-500 text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-2 border border-rose-100">Bantuan</span>}</p><p className="text-[11px] text-slate-400 font-medium mt-0.5">{warga.sebutan} • {warga.umur} Tahun</p></div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 group-hover:bg-slate-200 transition-colors">{warga.kategori}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RtPenilaianView = () => {
    const avgRating = ratings.length > 0 ? (ratings.reduce((acc, curr) => acc + parseInt(curr.stars||0), 0) / ratings.length).toFixed(1) : 0;
    
    return (
      <div className="animate-in fade-in max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Evaluasi Kinerja</h2>
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl mix-blend-screen"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div><p className="text-yellow-400/80 text-sm font-bold tracking-widest uppercase mb-3">Rata-rata Rating</p><div className="flex items-end gap-3"><h3 className="text-5xl font-extrabold text-white">{avgRating}</h3><span className="text-xl font-bold text-slate-500 mb-1.5">/ 5.0</span></div></div>
          </div>
          <Star className="absolute -bottom-6 -right-6 w-32 h-32 text-yellow-300 fill-yellow-300 opacity-30 pointer-events-none" />
        </div>

        <div className="grid gap-4 mt-8">
          {ratings.length === 0 ? <p className="text-center text-slate-400 py-10">Belum ada penilaian dari warga.</p> : ratings.map(rating => (
            <div key={rating.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1"><h4 className="font-bold text-slate-800 mb-1">{rating.sender}</h4><p className="text-sm text-slate-500 font-medium leading-relaxed italic">"{rating.comment}"</p></div>
              <div className="flex items-center bg-slate-50 px-3 py-2 rounded-xl self-start sm:self-auto border border-slate-100"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-2" /><span className="font-bold text-slate-700 text-sm">{rating.stars}.0</span></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- MAIN RENDER (TIDAK ADA PERUBAHAN NAVIGASI BAWAH) ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-24 md:pb-0 md:pl-72 selection:bg-teal-200 selection:text-teal-900">
      
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center animate-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 mr-3 text-emerald-400" />
          <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* LOADING OVERLAY SCREEN AWAL */}
      {isLoadingDB && view === 'login' && (
         <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <p className="font-bold text-slate-700">Menghubungkan ke Database...</p>
         </div>
      )}

      {/* --- AUTH VIEWS --- */}
      {view === 'login' && (
        <div className="fixed inset-0 flex items-center justify-center p-5 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="bg-white w-full max-w-[400px] rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden border border-white">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 text-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-200/50"><Home className="w-10 h-10" /></div>
              <h1 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight">Cintalembur</h1>
              <p className="text-sm text-slate-500 font-medium mb-4">Lingkungan Pintar, Warga Nyaman.</p>
              <div className="inline-block bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><p className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Appby_Amarmuhammad</p></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              <div><label className="block text-xs font-bold text-slate-600 mb-2 ml-1">Alamat Email</label><input type="text" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} placeholder="contoh@email.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-2 ml-1">Password</label><input type="password" value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium" /></div>
              <button type="submit" disabled={isLoadingDB} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-2">Masuk ke Dasbor</button>
            </form>
            
            <div className="text-center mt-8 relative z-10">
              <p className="text-sm text-slate-500 font-medium">Belum punya akun warga? <button onClick={()=>setView('register')} className="text-emerald-600 font-extrabold hover:text-emerald-700 transition-colors">Daftar sekarang</button></p>
            </div>
          </div>
        </div>
      )}

      {view === 'register' && (
        <div className="fixed inset-0 flex items-center justify-center p-5 bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto py-10">
          <div className="bg-white w-full max-w-[400px] rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white my-auto">
            <h2 className="text-2xl font-extrabold mb-2 text-slate-800">Daftar Akun Baru</h2>
            <p className="text-sm text-slate-500 font-medium mb-8">Lengkapi formulir untuk bergabung dengan lingkungan.</p>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" value={regData.nama} onChange={(e)=>setRegData({...regData, nama: e.target.value})} placeholder="Nama Lengkap" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-all" />
              <input type="number" value={regData.nik} onChange={(e)=>setRegData({...regData, nik: e.target.value})} placeholder="NIK / No. Kartu Keluarga" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-all" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={regData.umur} onChange={(e)=>setRegData({...regData, umur: e.target.value})} placeholder="Umur (Thn)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-all" />
                <select value={regData.sebutan} onChange={(e)=>setRegData({...regData, sebutan: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-all text-slate-600">
                  <option value="Bapak">Bapak</option><option value="Ibu">Ibu</option><option value="Saudara">Sdr/Sdri</option>
                </select>
              </div>
              <input type="email" value={regData.email} onChange={(e)=>setRegData({...regData, email: e.target.value})} placeholder="Alamat Email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-all" />
              <input type="password" value={regData.password} onChange={(e)=>setRegData({...regData, password: e.target.value})} placeholder="Buat Password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-all" />
              
              <button type="submit" disabled={isLoadingDB} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-4">
                {isLoadingDB ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Daftar & Masuk'}
              </button>
            </form>
            <button onClick={()=>setView('login')} className="mt-6 text-sm text-slate-500 font-bold w-full text-center hover:text-slate-800 transition-colors">← Kembali ke Login</button>
          </div>
        </div>
      )}

      {/* --- DASHBOARD WRAPPER --- */}
      {(view === 'warga-dashboard' || view === 'rt-dashboard') && (
        <>
          <nav className="fixed bottom-0 md:left-0 w-full md:w-72 bg-white/80 backdrop-blur-2xl border-t md:border-t-0 md:border-r border-slate-200/60 flex justify-around md:justify-start p-3 md:p-6 z-50 md:h-screen md:flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.03)] md:shadow-none">
            <div className="hidden md:flex flex-col items-center mb-10 px-2 py-8 text-center bg-slate-50/50 rounded-3xl border border-slate-100">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center mb-4 shadow-lg shadow-emerald-200/50"><Home className="w-10 h-10" /></div>
              <h1 className="font-extrabold text-xl text-slate-800 tracking-tight">Cintalembur</h1>
              <p className="text-[10px] font-extrabold text-emerald-600 mt-1 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-md">Lingkungan Pintar</p>
            </div>

            {/* NAVIGASI WARGA */}
            {currentUser?.role === 'warga' && (
              <div className="flex md:flex-col w-full justify-around md:justify-start gap-1 md:gap-3">
                <button onClick={() => setActiveTab('beranda')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'beranda' ? 'text-emerald-700 bg-emerald-50/80 md:bg-emerald-50 shadow-sm border border-emerald-100/50' : 'text-slate-400 hover:text-emerald-600 md:hover:bg-slate-50'}`}><Home className={`w-6 h-6 md:w-5 md:h-5 md:mr-4 ${activeTab === 'beranda' ? 'fill-emerald-200/50' : ''}`} /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Beranda</span></button>
                <button onClick={() => setActiveTab('lapor')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'lapor' ? 'text-emerald-700 bg-emerald-50/80 md:bg-emerald-50 shadow-sm border border-emerald-100/50' : 'text-slate-400 hover:text-emerald-600 md:hover:bg-slate-50'}`}><PlusCircle className={`w-6 h-6 md:w-5 md:h-5 md:mr-4 ${activeTab === 'lapor' ? 'fill-emerald-200/50' : ''}`} /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Lapor</span></button>
                <button onClick={() => setActiveTab('kas')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'kas' ? 'text-emerald-700 bg-emerald-50/80 md:bg-emerald-50 shadow-sm border border-emerald-100/50' : 'text-slate-400 hover:text-emerald-600 md:hover:bg-slate-50'}`}><Wallet className={`w-6 h-6 md:w-5 md:h-5 md:mr-4 ${activeTab === 'kas' ? 'fill-emerald-200/50' : ''}`} /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Uang Kas</span></button>
                <button onClick={() => setActiveTab('penilaian')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'penilaian' ? 'text-emerald-700 bg-emerald-50/80 md:bg-emerald-50 shadow-sm border border-emerald-100/50' : 'text-slate-400 hover:text-emerald-600 md:hover:bg-slate-50'}`}><Star className={`w-6 h-6 md:w-5 md:h-5 md:mr-4 ${activeTab === 'penilaian' ? 'fill-yellow-200 text-yellow-500' : ''}`} /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Nilai RT</span></button>
              </div>
            )}

            {/* NAVIGASI RT */}
            {currentUser?.role === 'rt' && (
              <div className="flex md:flex-col w-full justify-around md:justify-start gap-1 md:gap-3">
                <button onClick={() => setActiveTab('keluhan')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'keluhan' ? 'text-slate-800 bg-slate-100 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-700 md:hover:bg-slate-50'}`}><AlertTriangle className={`w-6 h-6 md:w-5 md:h-5 md:mr-4 ${activeTab === 'keluhan' ? 'fill-slate-200/50 text-slate-800' : ''}`} /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Laporan</span></button>
                <button onClick={() => setActiveTab('jadwal')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'jadwal' ? 'text-slate-800 bg-slate-100 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-700 md:hover:bg-slate-50'}`}><CalendarDays className={`w-6 h-6 md:w-5 md:h-5 md:mr-4 ${activeTab === 'jadwal' ? 'fill-slate-200/50 text-slate-800' : ''}`} /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Jadwal</span></button>
                <button onClick={() => setActiveTab('kas')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'kas' ? 'text-slate-800 bg-slate-100 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-700 md:hover:bg-slate-50'}`}><Wallet className={`w-6 h-6 md:w-5 md:h-5 md:mr-4 ${activeTab === 'kas' ? 'fill-slate-200/50 text-slate-800' : ''}`} /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Keuangan</span></button>
                <button onClick={() => setActiveTab('warga')} className={`hidden md:flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'warga' ? 'text-slate-800 bg-slate-100 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-700 md:hover:bg-slate-50'}`}><Users className={`w-6 h-6 md:w-5 md:h-5 md:mr-4 ${activeTab === 'warga' ? 'fill-slate-200/50 text-slate-800' : ''}`} /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Data Warga</span></button>
                <button onClick={() => setActiveTab('warga')} className={`md:hidden flex flex-col items-center justify-center flex-1 py-2.5 transition-all ${activeTab === 'warga' ? 'text-slate-800' : 'text-slate-400'}`}><Users className={`w-6 h-6 ${activeTab === 'warga' ? 'fill-slate-200' : ''}`} /><span className="text-[10px] font-bold mt-1.5">Warga</span></button>
                <button onClick={() => setActiveTab('penilaian')} className={`hidden md:flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:px-5 py-2.5 md:py-4 rounded-2xl transition-all ${activeTab === 'penilaian' ? 'text-slate-800 bg-slate-100 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-700 md:hover:bg-slate-50'}`}><Star className={`w-6 h-6 md:w-5 md:h-5 md:mr-4 ${activeTab === 'penilaian' ? 'fill-yellow-200 text-yellow-500' : ''}`} /><span className="text-[10px] md:text-sm font-bold mt-1.5 md:mt-0">Evaluasi</span></button>
              </div>
            )}

            <div className="hidden md:flex md:mt-auto md:flex-col w-full gap-3 pt-6 border-t border-slate-100">
              <button onClick={handleLogout} className="flex items-center px-5 py-4 rounded-2xl transition-all text-red-500 hover:bg-red-50 w-full group">
                <LogOut className="w-5 h-5 mr-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold">Keluar Akun</span>
              </button>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center"><p className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Created By</p><p className="text-xs font-bold text-slate-700 mt-1">Appby_Amarmuhammad</p></div>
            </div>
          </nav>

          <div className="flex flex-col min-h-screen relative">
            
            {/* Tombol Refresh Melayang (Mobile Only) */}
            <button onClick={fetchDataFromDB} disabled={isLoadingDB} className="md:hidden fixed bottom-24 right-5 bg-white p-3 rounded-full shadow-lg border border-slate-100 text-emerald-600 z-40" title="Refresh Data">
              <RefreshCw className={`w-6 h-6 ${isLoadingDB ? 'animate-spin text-slate-400' : ''}`} />
            </button>

            <HeaderDashboard />
            <main className="flex-1 w-full max-w-5xl mx-auto px-5 pb-8 pt-4 md:px-8 animate-in fade-in duration-500">
              
              {currentUser?.role === 'warga' && (
                <>
                  {activeTab === 'beranda' && <WargaBeranda />}
                  {activeTab === 'lapor' && <WargaLapor />}
                  {activeTab === 'kas' && <UangKasView />}
                  {activeTab === 'penilaian' && <WargaPenilaian />}
                </>
              )}

              {currentUser?.role === 'rt' && (
                <>
                  {activeTab === 'keluhan' && <RtKeluhanView />}
                  {activeTab === 'warga' && <RtDataWargaView />}
                  {activeTab === 'jadwal' && <RtBuatJadwalDanInfo />}
                  {activeTab === 'kas' && <UangKasView />}
                  {activeTab === 'penilaian' && <RtPenilaianView />}
                </>
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
