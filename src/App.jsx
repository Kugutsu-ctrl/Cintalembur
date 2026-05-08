import React, { useEffect, useState, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  Check, Mail, Shield, X, LogOut, Home, ShoppingBag, 
  Wrench, User, Search, Bell, Battery, Zap, Smartphone, 
  Cpu, MessageCircle, Image as ImageIcon, LayoutDashboard, 
  TrendingUp, Users, ChevronLeft, ShieldCheck, MapPin, 
  ChevronRight, History, Clock, Star, Plus, Tag, DollarSign, 
  Package, Send, KeyRound, Phone, Camera, UploadCloud, Truck, 
  FileText, Hash, CheckCircle2, AlertCircle, Loader2, Info,
  Receipt, WrenchIcon, PenTool, CheckSquare, FileWarning, Wallet,
  QrCode, Printer, Share2, Palette, Plug, Headset, Store, Lock, Terminal
} from 'lucide-react';

// --- FIREBASE INITIALIZATION & FIX ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: ""
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// FIX: Membersihkan appId agar tidak ada karakter '/' yang menyebabkan error Firebase (Odd Segments)
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'nano-cell-app';
const appId = rawAppId.replace(/\//g, '_'); 

export default function App() {
  // ----------------------------------------------------
  // 1. TOP-LEVEL HOOKS & STATES
  // ----------------------------------------------------
  const [user, setUser] = useState(null);
  const [fbUser, setFbUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [subPage, setSubPage] = useState(null); 
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [currentDraftResi, setCurrentDraftResi] = useState('');

  // Data States
  const [products, setProducts] = useState([
    { id: 'p1', name: 'Baterai Ori Samsung S22', category: 'Sparepart', price: 299000, originalPrice: 350000, rating: 4.9, sold: '1rb+', isPromo: true },
    { id: 'p2', name: 'LCD iPhone 11 Pro Max', category: 'Sparepart', price: 1250000, originalPrice: 1500000, rating: 4.8, sold: '500+', isPromo: true },
    { id: 'p3', name: 'Adaptor Charger 20W', category: 'Aksesoris', price: 150000, originalPrice: 0, rating: 5.0, sold: '2rb+', isPromo: false },
    { id: 'p4', name: 'Kabel Data Type-C 5A', category: 'Aksesoris', price: 45000, originalPrice: 0, rating: 4.7, sold: '5rb+', isPromo: false },
  ]);
  const [serviceOrders, setServiceOrders] = useState([]);

  // States untuk Chat
  const [messages, setMessages] = useState([{ id: 1, text: 'Halo kak! Layanan Nano Cell siap membantu. Ada yang bisa kami bantu perihal kerusakan HP-nya?', sender: 'tech', time: '14:02' }]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // States untuk Tracking
  const [searchResi, setSearchResi] = useState(''); 
  const [searchWa, setSearchWa] = useState(''); 
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  // States untuk Auth (Sistem OTP/Google/Tamu)
  const [loginStep, setLoginStep] = useState(1); 
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const otpInputRef = useRef(null);

  // States untuk Overlays Form
  const [lcdIsSubmitting, setLcdIsSubmitting] = useState(false);
  const [lcdShowTicket, setLcdShowTicket] = useState(null);
  const [lcdForm, setLcdForm] = useState({
    customerName: '', wa: '', address: '', brand: 'Samsung', model: '', 
    imei: '', color: '', issues: [], conditions: [], 
    priceLcd: '', priceJasa: '', notes: ''
  });
  const [lcdFormImages, setLcdFormImages] = useState({ front: null, back: null, damage: null });

  const [frpIsSubmitting, setFrpIsSubmitting] = useState(false);
  const [frpShowTicket, setFrpShowTicket] = useState(null);
  const [frpForm, setFrpForm] = useState({
    customerName: '', wa: '', brand: 'Samsung', model: '', 
    androidVer: '', chipset: '', imei: '', sn: '',
    deviceStatus: ['FRP Aktif'], workMethod: [], 
    priceJasa: '', estimatedTime: '', notes: ''
  });
  const [frpFormImages, setFrpFormImages] = useState({ device: null, back: null, screen: null });

  const [isDeliverySubmitting, setIsDeliverySubmitting] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    name: '', wa: '', address: '', brand: '', model: '', imei: '', issue: '', shippingOption: 'Jemput Kurir Nano Cell', notes: ''
  });

  const [updateModal, setUpdateModal] = useState({ isOpen: false, orderId: null, currentStatus: '' });

  // ----------------------------------------------------
  // 2. EFFECTS & FIREBASE SYNC
  // ----------------------------------------------------
  useEffect(() => {
    // FIX: Auth harus menggunakan Custom Token yang disiapkan sistem agar dapat izin akses
    const initAuth = async () => {
      try { 
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth); 
        }
      } catch (err) { 
        console.error("Firebase Auth Error:", err); 
      }
    };
    initAuth();
    const unsubAuth = onAuthStateChanged(auth, (u) => setFbUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!fbUser) return;
    // Mendengarkan Database Realtime Service
    const servicesRef = collection(db, 'artifacts', appId, 'public', 'data', 'services');
    const unsubServices = onSnapshot(servicesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServiceOrders(data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (err) => console.error("Firestore sync error:", err));

    return () => unsubServices();
  }, [fbUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, subPage]);

  useEffect(() => {
    let timer;
    if (countdown > 0) timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (loginStep === 2) setTimeout(() => { otpInputRef.current?.focus(); }, 300);
  }, [loginStep]);

  useEffect(() => {
    if (user && user.role !== 'guest') {
      if (!lcdForm.customerName) setLcdForm(prev => ({...prev, customerName: user.displayName, wa: user.wa || prev.wa}));
      if (!frpForm.customerName) setFrpForm(prev => ({...prev, customerName: user.displayName, wa: user.wa || prev.wa}));
      if (!deliveryForm.name) setDeliveryForm(prev => ({...prev, name: user.displayName, wa: user.wa || prev.wa}));
    }
  }, [user]);

  // ----------------------------------------------------
  // 3. UTILS & HANDLERS
  // ----------------------------------------------------
  const openSubPage = (page) => {
    const isAdmin = user?.role === 'admin';
    if (page === 'form_lcd') setCurrentDraftResi(`${isAdmin ? 'INV' : 'REQ'}-NANO-${Math.floor(1000 + Math.random() * 9000)}`);
    else if (page === 'form_frp') setCurrentDraftResi(`${isAdmin ? 'INV-FRP' : 'REQ-FRP'}-${Math.floor(1000 + Math.random() * 9000)}`);
    else if (page === 'delivery') setCurrentDraftResi(`NANO-${Math.floor(100000 + Math.random() * 900000)}`);
    else setCurrentDraftResi('');
    setSubPage(page);
  };

  const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

  const handleFormatPhone = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('0')) val = val.substring(1);
    if (val.startsWith('62')) val = val.substring(2);
    setLoginPhone(val);
  };

  // Auth Handlers
  const handleRequestOTP = (e) => {
    e.preventDefault();
    if (loginPhone.length < 9) {
      setModal({ isOpen: true, title: 'Nomor Tidak Valid', message: 'Silakan masukkan nomor WhatsApp yang valid.' });
      return;
    }
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setCountdown(60); 
      setLoginStep(2);
    }, 1200);
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (loginOtp.length !== 6) return;
    setIsAuthenticating(true);
    const isAdmin = loginPhone.endsWith('000') || loginPhone === '85715053337'; 
    
    setTimeout(() => {
      if (loginOtp === '123456') {
        setUser({
          displayName: isAdmin ? 'Administrator' : 'Customer Nano Cell',
          email: isAdmin ? 'admin@nanocell.com' : `+62${loginPhone}@user.nanocell`,
          wa: `0${loginPhone}`,
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          role: isAdmin ? 'admin' : 'member'
        });
      } else {
        setModal({ isOpen: true, title: 'OTP Salah', message: 'Kode OTP yang Anda masukkan salah. (Gunakan: 123456)' });
      }
      setIsAuthenticating(false);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser({
        displayName: 'Google User (Admin)',
        email: 'admin@nanocell.com',
        wa: '085715053337',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        role: 'admin' 
      });
      setIsAuthenticating(false);
    }, 1500);
  };

  const handleGuestLogin = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser({ displayName: 'Tamu', email: 'guest@nanocell', wa: '', photoURL: '', role: 'guest' });
      setIsAuthenticating(false);
    }, 1000);
  };

  const handleLogout = () => {
    setUser(null); setLoginStep(1); setLoginPhone(''); setLoginOtp(''); setCountdown(0); setActiveTab('home'); setSubPage(null);
  };

  // ----------------------------------------------------
  // 4. TAB RENDERS
  // ----------------------------------------------------
  const renderHomeTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-blue-400 text-xs font-medium uppercase tracking-wider mb-1">Selamat Datang</p>
          <h2 className="text-2xl font-bold text-white line-clamp-1">{user?.displayName || 'Pengguna'}</h2>
        </div>
        <div className="relative bg-white/10 p-2 rounded-full border border-white/10 backdrop-blur-md">
          <Bell size={20} className="text-white" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#000814]"></span>
        </div>
      </div>

      <div className="relative w-full h-40 rounded-3xl overflow-hidden mb-8 shadow-lg border border-white/5">
        <img src="https://i.ibb.co.com/bMf9TMm2/file-0000000057fc71f885c2f242e1bcd0a5.png" alt="Promo" className="w-full h-full object-cover" />
      </div>

      <h3 className="text-white font-semibold mb-4 text-lg">Kategori Layanan</h3>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { IconComp: Smartphone, color: 'from-blue-500 to-blue-400', label: 'Ganti LCD', onClick: () => openSubPage('form_lcd') },
          { IconComp: Plug, color: 'from-purple-500 to-purple-400', label: 'Aksesoris', onClick: () => { setActiveTab('products'); setSelectedCategory('Aksesoris'); } },
          { IconComp: ShieldCheck, color: 'from-cyan-500 to-cyan-400', label: 'Unlock FRP', onClick: () => openSubPage('form_frp') },
          { IconComp: Truck, color: 'from-emerald-500 to-emerald-400', label: 'Kirim HP', onClick: () => openSubPage('delivery') },
          { IconComp: Headset, color: 'from-indigo-500 to-indigo-400', label: 'Konsultasi', onClick: () => openSubPage('chat') },
          { IconComp: Store, color: 'from-amber-500 to-amber-400', label: 'Lokasi Kami', onClick: () => openSubPage('location') },
        ].map((cat, i) => (
          <div key={i} onClick={cat.onClick} className="flex flex-col items-center gap-2.5 cursor-pointer active:scale-95 transition-transform group">
            <div className={`w-[60px] h-[60px] rounded-[20px] bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:brightness-110`}>
               <cat.IconComp size={26} strokeWidth={1.5} className="text-white drop-shadow-md" />
            </div>
            <span className="text-[11px] text-white/80 font-medium text-center leading-tight tracking-wide">{cat.label}</span>
          </div>
        ))}
      </div>

      <h3 className="text-white font-semibold mb-4 text-lg">Tracking Servis Aktif</h3>
      {serviceOrders.filter(o => user.role === 'admin' || o.wa === user.wa).slice(0, 1).map((ord, idx) => (
        <div key={idx} onClick={() => { setSearchResi(ord.resi); setSearchWa(ord.wa); setActiveTab('service'); }} className="bg-[#0a192f] border border-blue-500/30 rounded-3xl p-5 shadow-[0_10px_30px_rgba(21,101,192,0.15)] relative overflow-hidden cursor-pointer active:scale-95 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#1565c0]/20 rounded-xl text-blue-400 border border-[#1565c0]/30">
                <Wrench size={20} />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">{String(ord.brand || '')} {String(ord.model || '')}</h4>
                <p className="text-white/50 text-xs">{String(ord.resi || '')}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              {ord.status === 'Selesai' ? <Check size={10} /> : <Loader2 size={10} className="animate-spin" />} {String(ord.status || '')}
            </span>
          </div>
        </div>
      ))}
      {serviceOrders.filter(o => user.role === 'admin' || o.wa === user.wa).length === 0 && (
        <div className="bg-white/5 border border-white/5 border-dashed rounded-3xl p-6 text-center text-white/30 text-sm">
          Belum ada servis yang sedang berjalan.
        </div>
      )}
    </div>
  );

  const renderProductsTab = () => {
    const filteredProducts = selectedCategory === 'Semua' ? products : products.filter(p => p.category === selectedCategory);
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="sticky top-0 z-20 bg-[#000814]/95 backdrop-blur-xl pt-2 pb-4 -mx-6 px-6 border-b border-white/5">
          <h2 className="text-2xl font-bold text-white mb-4">Marketplace</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-3 shadow-inner focus-within:border-blue-500/50 transition-colors">
            <Search size={18} className="text-white/40" />
            <input type="text" placeholder="Cari suku cadang..." className="bg-transparent border-none outline-none text-white text-sm w-full ml-3 placeholder:text-white/30" />
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
            {['Semua', 'Sparepart', 'Aksesoris'].map((tab, i) => (
              <button key={i} onClick={() => setSelectedCategory(tab)} className={`px-5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === tab ? 'bg-[#1565c0] text-white shadow-md' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {filteredProducts.length === 0 && <p className="col-span-2 text-center text-white/40 text-sm mt-10">Produk tidak ditemukan.</p>}
          {filteredProducts.map((item) => (
            <div key={item.id} onClick={() => setModal({isOpen: true, title: item.name, message: 'Fungsionalitas keranjang belanja akan segera hadir.'})} className="bg-[#0a192f] border border-white/10 rounded-3xl p-3 backdrop-blur-md relative overflow-hidden group cursor-pointer active:scale-95 transition-transform shadow-sm flex flex-col justify-between">
              {item.isPromo && <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-red-600 rounded-lg text-[9px] font-bold text-white shadow-sm">PROMO</div>}
              <div className="w-full h-32 bg-[#000814] border border-white/5 rounded-2xl mb-3 flex items-center justify-center relative overflow-hidden">
                <ImageIcon size={30} className="text-white/20" />
              </div>
              <div>
                <p className="text-[9px] text-blue-400 font-medium uppercase tracking-wider mb-0.5">{String(item.category || '')}</p>
                <h4 className="text-white text-sm font-semibold mb-1 line-clamp-2">{String(item.name || '')}</h4>
              </div>
              <div className="flex items-center gap-1 mb-2 mt-1">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] text-white/60">{String(item.rating || '5.0')} | Terjual {String(item.sold || '0')}</span>
              </div>
              <div className="flex justify-between items-end mt-1">
                <div>
                  {item.originalPrice > 0 && <span className="text-[10px] text-white/40 line-through block">{formatRp(item.originalPrice)}</span>}
                  <span className="text-blue-400 font-bold text-sm">{formatRp(item.price)}</span>
                </div>
                <button className="w-8 h-8 rounded-full bg-[#1565c0] flex items-center justify-center text-white shadow-md"><ShoppingBag size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderServiceTab = () => {
    const handleTrack = (e) => {
      e.preventDefault();
      setIsTracking(true);
      setTimeout(() => {
        const found = serviceOrders.find(o => String(o.resi || '').toUpperCase() === searchResi.toUpperCase() && String(o.wa || '') === searchWa);
        setTrackedOrder(found || 'NOT_FOUND');
        setIsTracking(false);
      }, 1000);
    };

    const showWarrantyPolicy = () => {
      setModal({ isOpen: true, title: 'Kebijakan Garansi', message: 'SYARAT KLAIM GARANSI:\n• Nota/Invoice asli tidak hilang.\n• Segel garansi utuh.\n• Kerusakan bukan karena human error (jatuh, kena air).\n• Untuk FRP/Software, garansi berlaku jika bootloop kembali karena sistem (bukan update mandiri OTA/Root).' });
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <h2 className="text-2xl font-bold text-white mb-6">Tracking Realtime</h2>
        
        <div className="bg-[#0a192f] border border-[#1565c0]/20 rounded-3xl p-6 shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
          <h3 className="text-white font-semibold text-sm mb-4 relative z-10">Lacak Perangkat Anda</h3>
          <form onSubmit={handleTrack} className="space-y-4 relative z-10">
            <div className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 flex items-center focus-within:border-[#1565c0] transition-colors">
              <Receipt size={18} className="text-white/40 mr-3" />
              <input type="text" placeholder="No Invoice/Tiket (INV-XXXX)" required value={searchResi} onChange={e=>setSearchResi(e.target.value.toUpperCase())} className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/30 uppercase" />
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 flex items-center focus-within:border-[#1565c0] transition-colors">
              <Phone size={18} className="text-white/40 mr-3" />
              <input type="tel" placeholder="Nomor WhatsApp Anda" required value={searchWa} onChange={e=>setSearchWa(e.target.value)} className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/30" />
            </div>
            <button type="submit" disabled={isTracking} className="w-full bg-gradient-to-r from-[#1565c0] to-blue-700 hover:brightness-110 py-3.5 rounded-xl text-white font-bold shadow-md active:scale-[0.98] transition-all flex justify-center items-center">
              {isTracking ? <Loader2 size={18} className="animate-spin" /> : 'Lacak Status Service'}
            </button>
          </form>
        </div>

        {trackedOrder === 'NOT_FOUND' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
            <AlertCircle size={32} className="text-red-400 mb-2" />
            <h4 className="text-white font-semibold mb-1">Data Tidak Ditemukan</h4>
            <p className="text-white/60 text-xs">Pastikan Nomor Tiket dan Nomor WhatsApp yang dimasukkan benar.</p>
          </div>
        )}

        {trackedOrder && trackedOrder !== 'NOT_FOUND' && (
          <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-6">
            <div className={`bg-gradient-to-br ${trackedOrder.type === 'FRP' ? 'from-[#001122] to-cyan-950/20 border-cyan-500/40' : 'from-[#0a192f] to-[#000814] border-[#1565c0]/40'} border rounded-3xl p-6 shadow-2xl relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 px-4 py-1.5 ${trackedOrder.type === 'FRP' ? 'bg-cyan-600' : 'bg-[#1565c0]'} rounded-bl-2xl text-[10px] font-bold text-white tracking-wider`}>
                {String(trackedOrder.resi || '')}
              </div>
              <div className="flex items-center gap-4 mb-5 mt-2">
                <div className={`w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center shadow-inner ${trackedOrder.type === 'FRP' ? 'text-cyan-400' : 'text-blue-400'}`}>
                  {trackedOrder.type === 'FRP' ? <Terminal size={28} /> : <Smartphone size={28} />}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{String(trackedOrder.brand || '')} {String(trackedOrder.model || '')}</h3>
                  <p className="text-white/60 text-xs">{String(trackedOrder.customerName || '')} • {String(trackedOrder.wa || '')}</p>
                </div>
              </div>

              <div className={`bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5`}>
                <p className="text-red-400 text-[10px] font-semibold mb-1 flex items-center gap-1"><FileWarning size={12}/> {trackedOrder.type === 'FRP' ? 'Kasus Software:' : 'Kerusakan Terdaftar:'}</p>
                <p className="text-white text-sm font-medium">{String(trackedOrder.issue || '')}</p>
              </div>

              {trackedOrder.cost && (
                <div className="bg-black/30 rounded-2xl p-4 border border-white/5 mb-6">
                   <h4 className={`text-white text-sm font-semibold mb-3 flex items-center gap-2`}><Wallet size={16} className={trackedOrder.type === 'FRP' ? 'text-cyan-400' : 'text-green-400'}/> Rincian Biaya</h4>
                   <div className="space-y-2 text-xs">
                      {trackedOrder.type === 'LCD' && <div className="flex justify-between text-white/70"><span>Harga Sparepart (LCD)</span><span>{formatRp(trackedOrder.cost.lcd)}</span></div>}
                      <div className="flex justify-between text-white/70"><span>Biaya Jasa Eksekusi</span><span>{formatRp(trackedOrder.cost.jasa || trackedOrder.cost.total)}</span></div>
                      <div className="h-[1px] w-full bg-white/10 my-2"></div>
                      <div className="flex justify-between text-white font-bold text-sm"><span>Total Biaya</span><span className={trackedOrder.type === 'FRP' ? 'text-cyan-400' : 'text-blue-400'}>{formatRp(trackedOrder.cost.total)}</span></div>
                   </div>
                </div>
              )}

              <h4 className={`text-white text-sm font-semibold mb-4 flex items-center gap-2`}><CheckSquare size={16} className={trackedOrder.type === 'FRP' ? 'text-cyan-400' : 'text-[#1565c0]'}/> Progress {trackedOrder.type === 'FRP' ? 'Unlock/Flash' : 'Service'}</h4>
              <div className={`relative pl-5 border-l-2 ${trackedOrder.type === 'FRP' ? 'border-cyan-500/30' : 'border-[#1565c0]/30'} space-y-6 mb-6`}>
                {trackedOrder.timeline && trackedOrder.timeline.map((step, idx) => {
                  if(step.skipped) return null; 
                  return (
                  <div key={idx} className="relative">
                    {step.done ? (
                      <div className={`absolute -left-[29px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center ${step.active ? (trackedOrder.type === 'FRP' ? 'bg-cyan-500 shadow-[0_0_12px_#06b6d4]' : 'bg-[#1565c0] shadow-[0_0_12px_#1565c0]') : 'bg-green-500'}`}>
                        {step.active ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> : <Check size={10} className="text-[#000814]" strokeWidth={4} />}
                      </div>
                    ) : (
                      <div className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-white/20"></div>
                    )}
                    <h4 className={`text-sm font-semibold ${step.done ? 'text-white' : 'text-white/40'}`}>{String(step.status || '')}</h4>
                    {step.desc && <p className={`text-xs mt-1 leading-relaxed ${step.active ? 'text-white/80' : 'text-white/40'}`}>{String(step.desc || '')}</p>}
                    {step.time && <p className={`text-[10px] mt-1.5 font-medium ${step.active ? (trackedOrder.type==='FRP'?'text-cyan-400':'text-blue-400') : 'text-white/30'}`}>{String(step.time || '')}</p>}
                  </div>
                )})}
              </div>

              {trackedOrder.techNotes && trackedOrder.techNotes.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                  <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><PenTool size={14}/> Catatan Teknisi:</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/80 text-xs">
                    {trackedOrder.techNotes.map((note, i) => (<li key={i}>{String(note)}</li>))}
                  </ul>
                </div>
              )}

              {trackedOrder.cost && (
                <div onClick={showWarrantyPolicy} className={`flex items-center justify-between p-3 ${trackedOrder.type==='FRP'?'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20':'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20'} border rounded-xl cursor-pointer transition-colors`}>
                   <div className="flex items-center gap-2"><ShieldCheck size={18} className={trackedOrder.type==='FRP'?'text-cyan-400':'text-blue-400'} /><div><p className="text-white text-xs font-semibold">Status Garansi</p><p className={trackedOrder.type==='FRP'?'text-cyan-200 text-[10px]':'text-blue-200 text-[10px]'}>{String(trackedOrder.warranty || 'Berlaku')}</p></div></div>
                   <ChevronRight size={16} className={trackedOrder.type==='FRP'?'text-cyan-400/50':'text-blue-400/50'} />
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={() => openSubPage('chat')} className="flex-1 bg-white/5 border border-white/10 py-3.5 rounded-2xl text-white text-sm font-semibold flex justify-center items-center gap-2 hover:bg-white/10 transition-colors shadow-sm">
                <MessageCircle size={18} /> Tanya Teknisi
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="relative -mx-6 -mt-10 mb-20">
        <div className="h-40 bg-gradient-to-br from-[#0a192f] to-[#000814] border-b border-white/10 relative overflow-hidden"></div>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="relative w-24 h-24 rounded-full p-1 bg-[#1565c0] mb-2 shadow-lg">
            <img src={user?.photoURL || ''} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-[#000814]" />
            <div className="absolute bottom-0 right-0 bg-[#1565c0] text-white p-1 rounded-full border-2 border-[#000814]">
              <ShieldCheck size={12} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white">{user?.displayName || 'Pengguna'}</h2>
          <p className="text-blue-400 text-xs font-medium">{user?.role === 'admin' ? 'Administrator' : user?.role === 'guest' ? 'Akun Tamu' : 'Premium Member'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Servis', val: user?.role === 'guest' ? '0' : serviceOrders.filter(o=>o.wa === user.wa).length },
          { label: 'Pesanan', val: '0' },
          { label: 'Poin', val: user?.role === 'guest' ? '0' : '120' },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <h4 className="text-white text-xl font-bold mb-1">{s.val}</h4>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0a192f] border border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <MenuListItem IconComp={User} label="Edit Profil" onClick={() => setModal({isOpen: true, title: 'Edit Profil', message: 'Fitur pengaturan profil sedang disempurnakan.'})} />
        <MenuListItem IconComp={History} label="Riwayat Tiket & Servis" onClick={() => setActiveTab('service')} />
        
        {user?.role === 'admin' && (
          <MenuListItem IconComp={LayoutDashboard} label="Admin Dashboard" onClick={() => openSubPage('admin')} color="text-blue-400" />
        )}
        
        <div className="h-[1px] bg-white/5 my-1"></div>
        <div onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-500/10 cursor-pointer transition-colors">
          <div className="flex items-center gap-3 text-red-400">
            <LogOut size={18} />
            <span className="font-semibold text-sm">Keluar Akun</span>
          </div>
        </div>
      </div>
    </div>
  );

  const MenuListItem = ({ IconComp, label, onClick, color="text-white/70" }) => (
    <div onClick={onClick} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
      <div className={`flex items-center gap-3 ${color}`}>
        <IconComp size={18} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <ChevronRight size={18} className="text-white/30" />
    </div>
  );

  // ----------------------------------------------------
  // 5. OVERLAYS (SUB PAGES)
  // ----------------------------------------------------

  // 🔥 OVERLAY FRP FORM (TEKNISI SOFTWARE)
  const renderFrpFormOverlay = () => {
    const isAdmin = user?.role === 'admin';
    const statusList = ['FRP Aktif', 'Bootloop', 'Fastboot', 'Recovery', 'Mati Total', 'Pola/Sandi', 'Mi Cloud', 'iCloud'];
    const methodList = ['EDL Mode', 'Test Point', 'Fastboot Mode', 'Odin Flash', 'SP Flash Tool', 'Direct eMMC/UFS', 'Server Auth', 'Bypass Senam Jari'];

    const toggleArrayItem = (arrayName, item) => {
      setFrpForm(prev => ({
        ...prev,
        [arrayName]: prev[arrayName].includes(item) ? prev[arrayName].filter(i => i !== item) : [...prev[arrayName], item]
      }));
    };

    const handleImageUpload = (e, type) => {
      const file = e.target.files[0];
      if (file) setFrpFormImages(prev => ({...prev, [type]: URL.createObjectURL(file)}));
    };

    const handleSubmitFrpForm = async (e) => {
      e.preventDefault();
      if (frpForm.deviceStatus.length === 0) {
        setModal({isOpen: true, title:'Data Belum Lengkap', message:'Silakan pilih minimal 1 Status Device.'});
        return;
      }
      setFrpIsSubmitting(true);
      
      const newResi = currentDraftResi;
      const timeNow = new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});

      const newOrder = {
        resi: newResi,
        type: 'FRP',
        wa: frpForm.wa,
        customerName: frpForm.customerName,
        brand: frpForm.brand,
        model: frpForm.model,
        imei: frpForm.imei,
        issue: frpForm.deviceStatus.join(', '),
        status: isAdmin ? 'Proses Eksekusi' : 'Antrean Masuk',
        date: new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}),
        techNotes: isAdmin ? [`Chipset: ${frpForm.chipset}`, `Metode: ${frpForm.workMethod.join(', ')}`, frpForm.notes] : [],
        cost: isAdmin ? { jasa: parseInt(frpForm.priceJasa||0), total: parseInt(frpForm.priceJasa||0) } : null,
        warranty: 'Garansi 7 Hari (Software Only)',
        timestamp: serverTimestamp(),
        timeline: [
          { status: isAdmin ? 'Antrean Masuk' : 'Tiket Dibuat', time: timeNow, desc: 'Perangkat masuk antrean software.', done: true, active: !isAdmin },
          { status: 'Proses Eksekusi', time: isAdmin ? timeNow : '', desc: 'Sedang dilakukan flashing/bypass/unlock.', done: isAdmin, active: isAdmin },
          { status: 'Testing (QC)', time: '', desc: 'Pengecekan fungsi & jaringan setelah unlock.', done: false },
          { status: 'Selesai', time: '', desc: 'Perangkat siap digunakan.', done: false }
        ]
      };

      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'services'), newOrder);
        setFrpIsSubmitting(false);
        setFrpShowTicket(newOrder); 
      } catch (err) {
        console.error(err);
        setModal({isOpen: true, title:'Error Database', message:'Gagal menyimpan ke Firebase. Pastikan izin database valid.'});
        setFrpIsSubmitting(false);
      }
    };

    const closeInvoice = () => {
      setFrpShowTicket(null);
      setSubPage(null);
      if(!isAdmin) setActiveTab('service');
    };

    if (frpShowTicket) {
      return (
        <div className="fixed inset-0 z-[60] flex flex-col justify-center items-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-[#000d1a] border border-cyan-500/30 w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.2)] flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-br from-[#001f3f] to-cyan-950 p-6 text-center relative border-b border-cyan-500/20">
              {isAdmin && <div className="absolute top-4 right-4 cursor-pointer" onClick={closeInvoice}><X size={20} className="text-cyan-400 hover:text-white" /></div>}
              <div className="w-12 h-12 bg-black rounded-xl mx-auto flex items-center justify-center mb-3 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                 <Terminal size={24} className="text-cyan-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-1">{isAdmin ? 'Invoice Software' : 'Tiket Antrean Software'}</h2>
              <p className="text-cyan-200 text-xs">Nano Cell Tech Dept.</p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-blend-overlay">
              <div id="printable-area">
                <div className="flex justify-between items-end mb-6 pb-4 border-b border-cyan-500/20 border-dashed">
                  <div>
                     <p className="text-cyan-500/70 text-[10px] uppercase font-bold tracking-widest">No. {isAdmin ? 'Invoice' : 'Tiket'}</p>
                     <p className="text-cyan-50 font-bold text-sm tracking-wider">{String(frpShowTicket.resi || '')}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-cyan-500/70 text-[10px] uppercase font-bold tracking-widest">Tanggal</p>
                     <p className="text-cyan-50 text-xs">{String(frpShowTicket.date || '')}</p>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex justify-between"><span className="text-cyan-100/60 text-xs">Pelanggan</span><span className="text-cyan-50 text-xs font-semibold">{String(frpShowTicket.customerName || '')}</span></div>
                  <div className="flex justify-between"><span className="text-cyan-100/60 text-xs">WhatsApp</span><span className="text-cyan-50 text-xs font-semibold">{String(frpShowTicket.wa || '')}</span></div>
                  <div className="flex justify-between"><span className="text-cyan-100/60 text-xs">Perangkat</span><span className="text-cyan-50 text-xs font-semibold">{String(frpShowTicket.brand || '')} {String(frpShowTicket.model || '')}</span></div>
                </div>

                <div className="bg-cyan-950/30 rounded-xl p-4 border border-cyan-500/20 mb-6">
                  <p className="text-cyan-500/70 text-[10px] uppercase font-bold mb-2 tracking-widest">Status Terdata</p>
                  <p className="text-cyan-50 text-xs leading-relaxed font-mono">{String(frpShowTicket.issue || '')}</p>
                </div>

                {isAdmin ? (
                  <div className="flex justify-between items-center mb-6 border-t border-cyan-500/20 pt-4">
                     <span className="text-cyan-50 font-bold">Biaya Service</span>
                     <span className="text-cyan-400 font-bold text-xl">{formatRp(frpShowTicket.cost?.total)}</span>
                  </div>
                ) : (
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 mb-6 text-center">
                    <p className="text-cyan-300 text-[10px] font-semibold">Tunjukkan tiket ini kepada teknisi software untuk pengecekan harga & eksekusi.</p>
                  </div>
                )}
              </div>

              <div className="no-print flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] mx-auto w-32 border-2 border-cyan-500">
                 <QrCode size={64} className="text-black mb-1" strokeWidth={1.5} />
                 <p className="text-black/70 text-[8px] font-extrabold tracking-[0.2em] uppercase">Scan Lacak</p>
              </div>
            </div>

            <div className="p-4 bg-[#000814] grid grid-cols-2 gap-3 border-t border-cyan-500/20 no-print">
              {isAdmin ? (
                 <>
                   <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-500/30 py-3 rounded-xl text-cyan-400 text-xs font-semibold transition-colors"><Printer size={16} /> Print</button>
                   <a href={`https://wa.me/62${frpShowTicket.wa}?text=Halo%20${frpShowTicket.customerName},%20berikut%20nota%20service%20software%20anda:%20${frpShowTicket.resi}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-cyan-600 hover:brightness-110 py-3 rounded-xl text-white text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all"><Share2 size={16} /> Kirim WA</a>
                 </>
              ) : (
                 <>
                   <button onClick={closeInvoice} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-white text-xs font-semibold transition-colors border border-white/10">Tutup</button>
                   <button onClick={closeInvoice} className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl text-white text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"><Search size={16} /> Lacak Tiket</button>
                 </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-[#000814] z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-5 border-b border-cyan-900/50 bg-[#000d1a] shadow-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubPage(null)} className="p-2 rounded-full bg-cyan-950 text-cyan-400 active:scale-90 border border-cyan-900"><ChevronLeft size={20}/></button>
            <div>
              <h2 className="text-xl font-bold text-cyan-50">{isAdmin ? 'Tech: Input FRP/Software' : 'Form Bantuan Software'}</h2>
              <p className="text-[10px] text-cyan-500 tracking-wider font-mono uppercase">{isAdmin ? 'Mode Teknisi Aktif' : 'Layanan Flashing & Unlock'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 pb-28 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-blend-overlay">
          <form id="frpServiceForm" onSubmit={handleSubmitFrpForm} className="space-y-6">
            
            <div className="bg-[#001122]/80 backdrop-blur-sm border border-cyan-900/50 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex justify-between items-center">
              <div>
                <p className="text-cyan-500/70 text-[10px] uppercase font-bold tracking-wider mb-1">Nomor {isAdmin ? 'Invoice' : 'Tiket'} (Auto Generate)</p>
                <h3 className="text-cyan-400 font-bold text-xl tracking-widest font-mono">{currentDraftResi}</h3>
              </div>
              <div className="w-12 h-12 bg-cyan-900/30 border border-cyan-500/30 rounded-full flex items-center justify-center">
                <Hash size={20} className="text-cyan-400" />
              </div>
            </div>

            <div className="bg-[#001122]/80 backdrop-blur-sm border border-cyan-900/50 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <h3 className="text-cyan-400 font-semibold text-sm mb-4 border-b border-cyan-900/50 pb-3 flex items-center gap-2 tracking-wide"><User size={16}/> 1. Data Customer</h3>
              <div className="space-y-4">
                <input required type="text" value={frpForm.customerName} onChange={e=>setFrpForm({...frpForm, customerName: e.target.value})} className="bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 text-sm w-full outline-none focus:border-cyan-400 transition-colors font-mono" placeholder="Nama Pemilik" />
                <input required type="tel" value={frpForm.wa} onChange={e=>setFrpForm({...frpForm, wa: e.target.value})} className="bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 text-sm w-full outline-none focus:border-cyan-400 transition-colors font-mono" placeholder="Nomor WhatsApp" />
              </div>
            </div>

            <div className="bg-[#001122]/80 backdrop-blur-sm border border-cyan-900/50 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <h3 className="text-cyan-400 font-semibold text-sm mb-4 border-b border-cyan-900/50 pb-3 flex items-center gap-2 tracking-wide"><Cpu size={16}/> 2. Identifikasi Perangkat</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/50 border border-cyan-900/50 rounded-xl px-3 focus-within:border-cyan-400 transition-colors">
                    <select required value={frpForm.brand} onChange={e=>setFrpForm({...frpForm, brand: e.target.value})} className="bg-transparent border-none outline-none text-cyan-50 text-sm w-full py-3.5 appearance-none font-mono">
                      <option value="Samsung" className="bg-[#001122]">Samsung</option>
                      <option value="Xiaomi" className="bg-[#001122]">Xiaomi / Poco</option>
                      <option value="Oppo" className="bg-[#001122]">Oppo</option>
                      <option value="Vivo" className="bg-[#001122]">Vivo</option>
                      <option value="Realme" className="bg-[#001122]">Realme</option>
                      <option value="Infinix" className="bg-[#001122]">Infinix</option>
                      <option value="Apple" className="bg-[#001122]">Apple</option>
                      <option value="Lainnya" className="bg-[#001122]">Lainnya</option>
                    </select>
                  </div>
                  <input required type="text" value={frpForm.model} onChange={e=>setFrpForm({...frpForm, model: e.target.value})} className="bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 text-sm w-full outline-none focus:border-cyan-400 transition-colors font-mono uppercase" placeholder="Tipe / Model" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={frpForm.androidVer} onChange={e=>setFrpForm({...frpForm, androidVer: e.target.value})} className="bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 text-sm w-full outline-none focus:border-cyan-400 transition-colors font-mono" placeholder="Android Ver / iOS" />
                  <input type="text" value={frpForm.chipset} onChange={e=>setFrpForm({...frpForm, chipset: e.target.value})} className="bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 text-sm w-full outline-none focus:border-cyan-400 transition-colors font-mono uppercase" placeholder="Chipset (MTK/QCOM)" />
                </div>
                <input type="text" value={frpForm.imei} onChange={e=>setFrpForm({...frpForm, imei: e.target.value})} className="bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 text-sm w-full outline-none focus:border-cyan-400 transition-colors font-mono tracking-widest" placeholder="IMEI / SN Device" />
              </div>
            </div>

            <div className="bg-[#001122]/80 backdrop-blur-sm border border-cyan-900/50 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <h3 className="text-cyan-400 font-semibold text-sm mb-4 border-b border-cyan-900/50 pb-3 flex items-center gap-2 tracking-wide"><Lock size={16}/> 3. Status Device Saat Ini</h3>
              <div className="flex flex-wrap gap-2">
                {statusList.map(status => (
                  <button type="button" key={status} onClick={() => toggleArrayItem('deviceStatus', status)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 font-mono uppercase tracking-wider ${frpForm.deviceStatus.includes(status) ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'bg-black/50 border border-cyan-900/50 text-cyan-600 hover:border-cyan-400'}`}>
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="bg-[#001122]/80 backdrop-blur-sm border border-cyan-900/50 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <h3 className="text-cyan-400 font-semibold text-sm mb-4 border-b border-cyan-900/50 pb-3 flex items-center gap-2 tracking-wide"><Terminal size={16}/> 4. Metode Eksekusi (Tech Only)</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {methodList.map(method => (
                    <button type="button" key={method} onClick={() => toggleArrayItem('workMethod', method)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 font-mono uppercase tracking-wider ${frpForm.workMethod.includes(method) ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)] border-indigo-400' : 'bg-black/50 border border-cyan-900/50 text-indigo-300 hover:border-indigo-400'}`}>
                      {method}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input type="text" value={frpForm.estimatedTime} onChange={e=>setFrpForm({...frpForm, estimatedTime: e.target.value})} className="bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 text-sm w-full outline-none focus:border-cyan-400 transition-colors font-mono" placeholder="Estimasi Waktu (ex: 2 Jam)" />
                  <input required type="number" value={frpForm.priceJasa} onChange={e=>setFrpForm({...frpForm, priceJasa: e.target.value})} className="bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-400 font-bold text-sm w-full outline-none focus:border-cyan-400 transition-colors font-mono placeholder:text-cyan-800" placeholder="Biaya (Rp)" />
                </div>
                <textarea value={frpForm.notes} onChange={e=>setFrpForm({...frpForm, notes: e.target.value})} placeholder="Catatan kendala / risiko software..." className="bg-black/50 border border-cyan-900/50 rounded-xl p-3 text-cyan-50 text-sm w-full h-16 resize-none outline-none focus:border-cyan-400 transition-colors font-mono"></textarea>
              </div>
            )}
          </form>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#000814]/95 backdrop-blur-xl border-t border-cyan-900/50 z-10">
          <button form="frpServiceForm" type="submit" disabled={frpIsSubmitting} className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl text-[#000814] font-extrabold tracking-widest uppercase shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            {frpIsSubmitting ? <Loader2 size={20} className="animate-spin text-[#000814]" /> : (isAdmin ? 'Simpan Data Teknisi' : 'Buat Request Software')}
          </button>
        </div>
      </div>
    );
  };

  // Overlay LCD Form
  const renderLcdFormOverlay = () => {
    const isAdmin = user?.role === 'admin';
    const issueList = ['LCD Pecah', 'Touch Error', 'Blank Hitam', 'Greenline', 'Shadow', 'Ghost Touch', 'Layar Berkedip', 'Fleksibel Rusak'];
    const conditionList = ['Frame Bengkok', 'Bekas Air', 'Backdoor Retak', 'Mesin Normal', 'Face Unlock Normal', 'Fingerprint Normal'];

    const totalEstimasi = (parseInt(lcdForm.priceLcd||0) + parseInt(lcdForm.priceJasa||0));

    const toggleArrayItem = (arrayName, item) => {
      setLcdForm(prev => ({
        ...prev,
        [arrayName]: prev[arrayName].includes(item) ? prev[arrayName].filter(i => i !== item) : [...prev[arrayName], item]
      }));
    };

    const handleImageUpload = (e, type) => {
      const file = e.target.files[0];
      if (file) setLcdFormImages(prev => ({...prev, [type]: URL.createObjectURL(file)}));
    };

    const handleSubmitLcdForm = async (e) => {
      e.preventDefault();
      if (lcdForm.issues.length === 0) {
        setModal({isOpen: true, title:'Data Belum Lengkap', message:'Silakan pilih minimal 1 Kendala / Kerusakan LCD.'});
        return;
      }
      setLcdIsSubmitting(true);
      
      const newResi = currentDraftResi;
      const newOrder = {
        resi: newResi,
        type: 'LCD',
        wa: lcdForm.wa,
        customerName: lcdForm.customerName,
        address: lcdForm.address,
        brand: lcdForm.brand,
        model: lcdForm.model,
        imei: lcdForm.imei,
        color: lcdForm.color,
        issue: lcdForm.issues.join(', '),
        status: isAdmin ? 'Sedang dikerjakan' : 'Menunggu Pengecekan',
        date: new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}),
        techNotes: isAdmin ? lcdForm.conditions : [],
        cost: isAdmin ? { lcd: parseInt(lcdForm.priceLcd||0), jasa: parseInt(lcdForm.priceJasa||0), total: totalEstimasi } : null,
        warranty: 'Pending Pengecekan',
        timestamp: serverTimestamp(),
        timeline: [
          { status: isAdmin ? 'Masuk' : 'Tiket Dibuat', time: new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}), desc: isAdmin ? 'Perangkat diterima' : 'Request berhasil, menunggu teknisi.', done: true, active: !isAdmin },
          { status: 'Pengecekan', time: isAdmin ? new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '', desc: 'Diagnosa teknisi.', done: isAdmin, active: false },
          { status: 'Menunggu sparepart', time: '', desc: 'Sparepart tersedia.', done: isAdmin, skipped: true },
          { status: 'Sedang dikerjakan', time: isAdmin ? new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '', desc: 'Proses penggantian LCD.', done: isAdmin, active: isAdmin },
          { status: 'QC', time: '', desc: 'Testing menyeluruh.', done: false },
          { status: 'Selesai', time: '', desc: 'Siap diambil.', done: false }
        ],
        images: lcdFormImages
      };

      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'services'), newOrder);
        setLcdIsSubmitting(false);
        setLcdShowTicket(newOrder); 
      } catch (err) {
        console.error(err);
        setModal({isOpen: true, title:'Error Database', message:'Gagal menyimpan ke Firebase. Pastikan izin database valid.'});
        setLcdIsSubmitting(false);
      }
    };

    const closeInvoice = () => {
      setLcdShowTicket(null);
      setSubPage(null);
      if(!isAdmin) setActiveTab('service');
    };

    if (lcdShowTicket) {
      return (
        <div className="fixed inset-0 z-[60] flex flex-col justify-center items-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-[#0a192f] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-br from-[#1565c0] to-blue-900 p-6 text-center relative">
              {isAdmin && <div className="absolute top-4 right-4 cursor-pointer" onClick={closeInvoice}><X size={20} className="text-white/50 hover:text-white" /></div>}
              <div className="w-12 h-12 bg-white rounded-xl mx-auto flex items-center justify-center mb-3 shadow-md">
                 {isAdmin ? <Receipt size={28} className="text-[#1565c0]" /> : <Wrench size={28} className="text-[#1565c0]" />}
              </div>
              <h2 className="text-white font-bold text-lg mb-1">{isAdmin ? 'Invoice Service' : 'Tiket Booking Service'}</h2>
              <p className="text-blue-200 text-xs">Nano Cell Repair Center</p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay">
              <div id="printable-area">
                <div className="flex justify-between items-end mb-6 pb-4 border-b border-white/10 border-dashed">
                  <div>
                     <p className="text-white/40 text-[10px] uppercase font-bold">No. {isAdmin ? 'Invoice' : 'Tiket'}</p>
                     <p className="text-white font-bold text-sm tracking-wider">{String(lcdShowTicket.resi || '')}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-white/40 text-[10px] uppercase font-bold">Tanggal</p>
                     <p className="text-white text-xs">{String(lcdShowTicket.date || '')}</p>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex justify-between"><span className="text-white/60 text-xs">Pelanggan</span><span className="text-white text-xs font-semibold">{String(lcdShowTicket.customerName || '')}</span></div>
                  <div className="flex justify-between"><span className="text-white/60 text-xs">WhatsApp</span><span className="text-white text-xs font-semibold">{String(lcdShowTicket.wa || '')}</span></div>
                  <div className="flex justify-between"><span className="text-white/60 text-xs">Perangkat</span><span className="text-white text-xs font-semibold">{String(lcdShowTicket.brand || '')} {String(lcdShowTicket.model || '')}</span></div>
                </div>

                <div className="bg-black/30 rounded-xl p-4 border border-white/5 mb-6">
                  <p className="text-white/40 text-[10px] uppercase font-bold mb-2">Kerusakan Terdata</p>
                  <p className="text-white text-xs leading-relaxed">{String(lcdShowTicket.issue || '')}</p>
                </div>

                {isAdmin ? (
                  <div className="flex justify-between items-center mb-6 border-t border-white/10 pt-4">
                     <span className="text-white font-bold">Total Estimasi</span>
                     <span className="text-green-400 font-bold text-xl">{formatRp(lcdShowTicket.cost?.total)}</span>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 text-center">
                    <p className="text-amber-400 text-[10px] font-semibold">Bawa HP dan tunjukkan tiket ini ke Toko Nano Cell untuk pengecekan harga.</p>
                  </div>
                )}
              </div>

              <div className="no-print flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner mx-auto w-32">
                 <QrCode size={64} className="text-black mb-1" strokeWidth={1.5} />
                 <p className="text-black/50 text-[8px] font-bold tracking-widest uppercase">Scan Lacak</p>
              </div>
            </div>

            <div className="p-4 bg-[#000814] grid grid-cols-2 gap-3 border-t border-white/10 no-print">
              {isAdmin ? (
                 <>
                   <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-3 rounded-xl text-white text-xs font-semibold transition-colors"><Printer size={16} /> Print</button>
                   <a href={`https://wa.me/62${lcdShowTicket.wa}?text=Halo%20${lcdShowTicket.customerName},%20berikut%20nota%20anda:%20${lcdShowTicket.resi}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] hover:brightness-110 py-3 rounded-xl text-white text-xs font-semibold shadow-md"><Share2 size={16} /> Kirim WA</a>
                 </>
              ) : (
                 <>
                   <button onClick={closeInvoice} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-3 rounded-xl text-white text-xs font-semibold transition-colors">Tutup</button>
                   <button onClick={closeInvoice} className="flex items-center justify-center gap-2 bg-[#1565c0] hover:bg-blue-700 py-3 rounded-xl text-white text-xs font-semibold shadow-md"><Search size={16} /> Lacak Tiket</button>
                 </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-[#000814] z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0a192f] shadow-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubPage(null)} className="p-2 rounded-full bg-white/5 text-white active:scale-90"><ChevronLeft size={20}/></button>
            <div>
              <h2 className="text-xl font-bold text-white">{isAdmin ? 'Input Service LCD' : 'Form Ganti LCD'}</h2>
              <p className="text-[10px] text-white/50">{isAdmin ? 'Mode Admin / Kasir' : 'Layanan Service & Penggantian Layar'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 pb-28 no-scrollbar">
          <form id="lcdServiceForm" onSubmit={handleSubmitLcdForm} className="space-y-6">
            
            <div className="bg-[#0a192f] border border-white/5 rounded-3xl p-5 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-1">Nomor {isAdmin ? 'Invoice' : 'Tiket'} (Auto Generate)</p>
                <h3 className="text-white font-bold text-xl tracking-widest text-[#1565c0]">{currentDraftResi}</h3>
              </div>
              <div className="w-12 h-12 bg-[#1565c0]/10 border border-[#1565c0]/20 rounded-full flex items-center justify-center">
                <Hash size={20} className="text-[#1565c0]" />
              </div>
            </div>

            <div className="bg-[#0a192f] border border-white/5 rounded-3xl p-5 shadow-sm">
              <h3 className="text-white font-semibold text-sm mb-4 border-b border-white/5 pb-3 flex items-center gap-2"><User size={16} className="text-[#1565c0]"/> 1. Data Anda</h3>
              <div className="space-y-4">
                <input required type="text" value={lcdForm.customerName} onChange={e=>setLcdForm({...lcdForm, customerName: e.target.value})} className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm w-full outline-none focus:border-[#1565c0] transition-colors" placeholder="Nama Lengkap" />
                <input required type="tel" value={lcdForm.wa} onChange={e=>setLcdForm({...lcdForm, wa: e.target.value})} className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm w-full outline-none focus:border-[#1565c0] transition-colors" placeholder="Nomor WhatsApp Aktif" />
                <textarea required value={lcdForm.address} onChange={e=>setLcdForm({...lcdForm, address: e.target.value})} className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm w-full h-16 resize-none outline-none focus:border-[#1565c0] transition-colors" placeholder="Alamat Lengkap"></textarea>
              </div>
            </div>

            <div className="bg-[#0a192f] border border-white/5 rounded-3xl p-5 shadow-sm">
              <h3 className="text-white font-semibold text-sm mb-4 border-b border-white/5 pb-3 flex items-center gap-2"><Smartphone size={16} className="text-[#1565c0]"/> 2. Data Perangkat</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 border border-white/10 rounded-xl px-3 focus-within:border-[#1565c0] transition-colors">
                    <select required value={lcdForm.brand} onChange={e=>setLcdForm({...lcdForm, brand: e.target.value})} className="bg-transparent border-none outline-none text-white text-sm w-full py-3.5 appearance-none">
                      <option value="Samsung" className="bg-[#0a192f]">Samsung</option>
                      <option value="Apple" className="bg-[#0a192f]">Apple / iPhone</option>
                      <option value="Xiaomi" className="bg-[#0a192f]">Xiaomi</option>
                      <option value="Oppo" className="bg-[#0a192f]">Oppo</option>
                      <option value="Vivo" className="bg-[#0a192f]">Vivo</option>
                      <option value="Lainnya" className="bg-[#0a192f]">Lainnya</option>
                    </select>
                  </div>
                  <input required type="text" value={lcdForm.model} onChange={e=>setLcdForm({...lcdForm, model: e.target.value})} className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm w-full outline-none focus:border-[#1565c0] transition-colors" placeholder="Tipe / Model" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={lcdForm.imei} onChange={e=>setLcdForm({...lcdForm, imei: e.target.value})} className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm w-full outline-none focus:border-[#1565c0] transition-colors" placeholder="IMEI (Opsional)" />
                  <input required type="text" value={lcdForm.color} onChange={e=>setLcdForm({...lcdForm, color: e.target.value})} className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm w-full outline-none focus:border-[#1565c0] transition-colors" placeholder="Warna HP" />
                </div>
              </div>
            </div>

            <div className="bg-[#0a192f] border border-white/5 rounded-3xl p-5 shadow-sm">
              <h3 className="text-white font-semibold text-sm mb-4 border-b border-white/5 pb-3 flex items-center gap-2"><AlertCircle size={16} className="text-[#1565c0]"/> 3. Kendala LCD</h3>
              <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-3">Pilih Kerusakan (Bisa lebih dari 1)</p>
              <div className="flex flex-wrap gap-2">
                {issueList.map(issue => (
                  <button type="button" key={issue} onClick={() => toggleArrayItem('issues', issue)} className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${lcdForm.issues.includes(issue) ? 'bg-[#1565c0] text-white shadow-[0_0_10px_rgba(21,101,192,0.5)] border border-[#1565c0]' : 'bg-black/30 border border-white/10 text-white/50 hover:bg-white/5'}`}>
                    {issue}
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && (
              <>
                <div className="bg-[#0a192f] border border-amber-500/20 rounded-3xl p-5 shadow-sm">
                  <h3 className="text-white font-semibold text-sm mb-4 border-b border-white/5 pb-3 flex items-center gap-2"><WrenchIcon size={16} className="text-amber-500"/> 4. Kondisi Fisik Tambahan</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {conditionList.map(cond => (
                      <button type="button" key={cond} onClick={() => toggleArrayItem('conditions', cond)} className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${lcdForm.conditions.includes(cond) ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(216,134,11,0.4)] border border-amber-600' : 'bg-black/30 border border-white/10 text-white/50 hover:bg-white/5'}`}>
                        {cond}
                      </button>
                    ))}
                  </div>
                  <textarea value={lcdForm.notes} onChange={e=>setLcdForm({...lcdForm, notes: e.target.value})} placeholder="Catatan internal teknisi..." className="bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm w-full h-16 resize-none outline-none focus:border-amber-500 transition-colors"></textarea>
                </div>

                <div className="bg-gradient-to-br from-[#0a192f] to-[#000814] border border-green-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl"></div>
                  <h3 className="text-white font-semibold text-sm mb-4 border-b border-white/5 pb-3 flex items-center gap-2 relative z-10"><Wallet size={16} className="text-green-400"/> 5. Estimasi Harga Service</h3>
                  <div className="space-y-3 relative z-10 mb-5">
                    <div className="flex items-center justify-between"><span className="text-xs text-white/60">Harga LCD</span><input required type="number" value={lcdForm.priceLcd} onChange={e=>setLcdForm({...lcdForm, priceLcd: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 w-32 text-white text-sm text-right outline-none focus:border-green-500 transition-colors" placeholder="Rp" /></div>
                    <div className="flex items-center justify-between"><span className="text-xs text-white/60">Jasa Pasang & Risiko</span><input required type="number" value={lcdForm.priceJasa} onChange={e=>setLcdForm({...lcdForm, priceJasa: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 w-32 text-white text-sm text-right outline-none focus:border-green-500 transition-colors" placeholder="Rp" /></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                     <span className="text-white font-bold text-sm">TOTAL</span>
                     <span className="text-green-400 font-bold text-xl">{formatRp(totalEstimasi)}</span>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#000814]/95 backdrop-blur-md border-t border-white/10 z-10">
          <button form="lcdServiceForm" type="submit" disabled={lcdIsSubmitting} className="w-full bg-[#1565c0] hover:bg-blue-700 py-4 rounded-2xl text-white font-bold shadow-[0_5px_20px_rgba(21,101,192,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            {lcdIsSubmitting ? <Loader2 size={20} className="animate-spin" /> : (isAdmin ? 'Simpan & Buat Invoice' : 'Buat Tiket Booking')}
          </button>
        </div>
      </div>
    );
  };

  const renderAdminOverlay = () => (
    <div className="fixed inset-0 bg-[#000814] z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0a192f] shadow-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => setSubPage(null)} className="p-2 rounded-full bg-white/5 text-white active:scale-90"><ChevronLeft size={20}/></button>
          <div>
            <h2 className="text-xl font-bold text-white">Dashboard Admin</h2>
            <p className="text-[10px] text-white/50">Statistik & Antrean Servis</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20 no-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0a192f] border border-white/10 rounded-2xl p-4 shadow-sm">
            <WrenchIcon size={24} className="text-blue-400 mb-2" />
            <p className="text-white/60 text-xs mb-1">Service Masuk</p>
            <h3 className="text-white font-bold text-lg">{serviceOrders.length} Unit</h3>
          </div>
          <div className="bg-[#0a192f] border border-white/10 rounded-2xl p-4 shadow-sm">
            <CheckSquare size={24} className="text-green-400 mb-2" />
            <p className="text-white/60 text-xs mb-1">Total Selesai</p>
            <h3 className="text-white font-bold text-lg">{serviceOrders.filter(o=>o.status === 'Selesai').length} Unit</h3>
          </div>
        </div>

        <button onClick={() => openSubPage('form_lcd')} className="w-full bg-[#1565c0]/20 border border-[#1565c0]/50 hover:bg-[#1565c0]/30 py-4 rounded-2xl text-blue-400 font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2">
           <Plus size={18}/> Input Service Ganti LCD Baru
        </button>
        <button onClick={() => openSubPage('form_frp')} className="w-full mt-2 bg-cyan-900/30 border border-cyan-500/50 hover:bg-cyan-900/50 py-4 rounded-2xl text-cyan-400 font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2">
           <Terminal size={18}/> Input Service FRP / Software
        </button>
        
        <h3 className="text-white font-semibold text-sm pt-2">Daftar Antrean Terkini</h3>
        <div className="space-y-3">
          {serviceOrders.map((ord, i) => (
            <div key={i} className="bg-[#0a192f] border border-white/5 rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div className="max-w-[60%]">
                <h4 className="text-white font-semibold text-sm truncate">{String(ord.brand || '')} {String(ord.model || '')}</h4>
                <p className="text-white/50 text-[10px] mb-1.5">{String(ord.customerName || '')} • {String(ord.resi || '')}</p>
                <span className={`text-[9px] px-2 py-0.5 ${ord.type==='FRP'?'bg-cyan-500/20 text-cyan-400':'bg-[#1565c0]/20 text-blue-400'} rounded-md`}>{String(ord.status || '')}</span>
              </div>
              <button onClick={() => setUpdateModal({isOpen:true, orderId: ord.id, currentStatus: ord.status})} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg">Update</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDeliveryOverlay = () => {
    const handleOrderCourier = async (e) => {
      e.preventDefault();
      setIsDeliverySubmitting(true);

      const newOrder = {
        resi: currentDraftResi,
        type: 'DELIVERY',
        wa: deliveryForm.wa,
        customerName: deliveryForm.name,
        address: deliveryForm.address,
        brand: 'Lainnya',
        model: 'Pengiriman Unit',
        issue: 'Pesan Kurir Jemput',
        status: 'Menunggu Kurir',
        timestamp: serverTimestamp(),
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        timeline: [
          { status: 'Permintaan Diterima', done: true, active: true, desc: 'Kurir akan segera menuju lokasi Anda.' },
          { status: 'Unit Dijemput', done: false, active: false, desc: 'Unit sedang dalam perjalanan ke Toko.' },
          { status: 'Pengecekan', done: false, active: false, desc: 'Teknisi melakukan pengecekan unit.' }
        ]
      };

      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'services'), newOrder);
        setModal({ isOpen: true, title: 'Permintaan Berhasil!', message: `Nomor Resi Anda: ${currentDraftResi}\n\nPermintaan pengiriman telah diterima. Silakan cek menu Lacak Servis untuk memantau status.` });
        setIsDeliverySubmitting(false);
        setSubPage(null); setActiveTab('service'); 
      } catch (err) {
        console.error(err);
        setModal({ isOpen: true, title: 'Gagal', message: 'Tidak dapat menyimpan permintaan pengiriman. Pastikan izin database aktif.' });
        setIsDeliverySubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-[#000814] z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-4 p-5 border-b border-white/10 bg-[#0a192f] shadow-md z-10">
          <button onClick={() => setSubPage(null)} className="p-2 rounded-full bg-white/5 text-white active:scale-90"><ChevronLeft size={20}/></button>
          <div>
            <h2 className="text-xl font-bold text-white">Kirim Perangkat</h2>
            <p className="text-[10px] text-white/50">Form Ekspedisi & Pick-up Servis HP</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <form id="deliveryForm" onSubmit={handleOrderCourier} className="p-5 space-y-6">

            {/* UI AUTO GENERATE ID PENGIRIMAN */}
            <div className="bg-[#0a192f] border border-white/5 rounded-3xl p-5 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-1">
                  Nomor Resi Pengiriman
                </p>
                <h3 className="text-white font-bold text-xl tracking-widest text-[#1565c0]">{currentDraftResi}</h3>
              </div>
              <div className="w-12 h-12 bg-[#1565c0]/10 border border-[#1565c0]/20 rounded-full flex items-center justify-center">
                <Hash size={20} className="text-[#1565c0]" />
              </div>
            </div>

            <div className="bg-[#0a192f] border border-white/5 rounded-3xl p-5 shadow-sm">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                <User size={18} className="text-[#1565c0]" /> Data Pengirim
              </h3>
              <div className="space-y-4">
                <input required type="text" value={deliveryForm.name} onChange={e=>setDeliveryForm({...deliveryForm, name: e.target.value})} className="bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm w-full outline-none focus:border-[#1565c0]" placeholder="Nama Lengkap" />
                <input required type="tel" value={deliveryForm.wa} onChange={e=>setDeliveryForm({...deliveryForm, wa: e.target.value})} className="bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm w-full outline-none focus:border-[#1565c0]" placeholder="No WhatsApp (08...)" />
                <textarea required value={deliveryForm.address} onChange={e=>setDeliveryForm({...deliveryForm, address: e.target.value})} placeholder="Alamat lengkap jemput..." className="bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm w-full h-20 resize-none outline-none focus:border-[#1565c0]"></textarea>
              </div>
            </div>
            <div className="bg-[#0a192f] border border-white/5 rounded-3xl p-5 shadow-sm text-center text-white/50 text-xs">
              Sistem form perangkat & foto sama seperti Form Ganti LCD. Teknisi kami akan menghubungi WhatsApp Anda segera.
            </div>
          </form>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#000814]/95 backdrop-blur-md border-t border-white/10">
          <button form="deliveryForm" type="submit" disabled={isDeliverySubmitting} className="w-full bg-[#1565c0] hover:bg-blue-700 py-4 rounded-2xl text-white font-bold shadow-[0_5px_20px_rgba(21,101,192,0.4)] active:scale-[0.98] transition-all flex items-center justify-center">
            {isDeliverySubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Pesan Kurir Sekarang'}
          </button>
        </div>
      </div>
    );
  };

  const renderChatOverlay = () => {
    const handleSendMessage = (e) => {
      e.preventDefault();
      if (!chatInput.trim()) return;
      const newMsg = { id: Date.now(), text: chatInput, sender: 'user', time: new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) };
      setMessages([...messages, newMsg]);
      setChatInput('');
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now()+1, text: 'Baik kak, pesan Anda sudah kami terima. Teknisi kami akan segera merespons.', sender: 'tech', time: new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) }]);
      }, 1500);
    };

    return (
      <div className="fixed inset-0 bg-[#000814] z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-[#0a192f]">
          <button onClick={() => setSubPage(null)} className="p-2 rounded-full bg-white/5 text-white active:scale-90"><ChevronLeft size={20}/></button>
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-base font-bold text-white">Teknisi Nano Cell</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#000814]">
          <div className="relative z-10 flex flex-col gap-4">
            {messages.map(msg => (
              <div key={msg.id} className={`p-3 max-w-[80%] text-sm shadow-md ${msg.sender === 'user' ? 'self-end bg-[#1565c0] text-white rounded-2xl rounded-tr-sm' : 'self-start bg-white/10 border border-white/10 text-white rounded-2xl rounded-tl-sm'}`}>
                {String(msg.text || '')}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-[#0a192f] flex items-center gap-2">
          <input type="text" placeholder="Ketik pesan..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-4 py-3 outline-none text-white text-sm w-full" />
          <button type="submit" className="p-3 bg-[#1565c0] text-white rounded-full"><Send size={18}/></button>
        </form>
      </div>
    );
  };

  const renderLocationOverlay = () => {
    return (
      <div className="fixed inset-0 bg-[#000814] z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-4 p-5 border-b border-white/10 bg-[#0a192f] shadow-md z-10">
          <button onClick={() => setSubPage(null)} className="p-2 rounded-full bg-white/5 text-white active:scale-90"><ChevronLeft size={20}/></button>
          <div>
            <h2 className="text-xl font-bold text-white">Lokasi Toko</h2>
            <p className="text-[10px] text-white/50">Kunjungi Nano Cell Store</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="w-full h-72 bg-white/5 relative border-b border-white/10">
            <iframe 
              src="https://maps.google.com/maps?q=Jl.%20Raya%20Cipaku%20No.02%2C%20RT.01%2FRW.10%2C%20Cipaku%2C%20Kec.%20Bogor%20Sel.%2C%20Kota%20Bogor%2C%20Jawa%20Barat%2016133&t=&z=16&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{border:0}} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="opacity-90 grayscale-[15%] filter contrast-125"
            ></iframe>
          </div>
          
          <div className="p-6">
            <div className="bg-[#0a192f] border border-white/5 rounded-3xl p-5 shadow-sm mb-6">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
                <Store size={20} className="text-[#1565c0]"/> Nano Cell
              </h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Jl. Raya Cipaku No.02, RT.01/RW.10, Cipaku, Kec. Bogor Sel., Kota Bogor, Jawa Barat 16133
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Phone size={14} className="text-white/60" /></div>
                <span className="text-white/90 text-sm font-medium">0857-1505-3337</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Clock size={14} className="text-white/60" /></div>
                <span className="text-white/90 text-sm font-medium">Buka Setiap Hari: 09.00 - 21.00 WIB</span>
              </div>
            </div>

            <a href="https://maps.google.com/maps?q=Jl.+Raya+Cipaku+No.02,+RT.01/RW.10,+Cipaku,+Kec.+Bogor+Sel.,+Kota+Bogor,+Jawa+Barat+16133" target="_blank" rel="noreferrer" className="w-full bg-[#1565c0] hover:bg-blue-700 py-4 rounded-2xl text-white font-bold shadow-[0_5px_20px_rgba(21,101,192,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <MapPin size={18} /> Buka di Google Maps
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
          html, body { margin: 0; padding: 0; overscroll-behavior-y: none; -webkit-tap-highlight-color: transparent; user-select: none; }
          .font-poppins { font-family: 'Poppins', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      <div className="w-full h-[100dvh] bg-[#000814] text-white font-poppins relative overflow-hidden flex flex-col antialiased">
        <div className="absolute inset-0 bg-[#000814] pointer-events-none z-0"></div>

        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-6 pt-12">
          {activeTab === 'home' && renderHomeTab()}
          {activeTab === 'products' && renderProductsTab()}
          {activeTab === 'service' && renderServiceTab()}
          {activeTab === 'profile' && renderProfileTab()}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-40 bg-[#000814]/95 border-t border-white/5 pb-safe pt-2 px-6">
          <div className="flex justify-between items-center pb-6">
            <NavItem IconComp={Home} label="Beranda" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavItem IconComp={ShoppingBag} label="Produk" isActive={activeTab === 'products'} onClick={() => setActiveTab('products')} />
            <NavItem IconComp={Wrench} label="Servis" isActive={activeTab === 'service'} onClick={() => setActiveTab('service')} />
            <NavItem IconComp={User} label="Profil" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </div>

        {subPage === 'form_lcd' && renderLcdFormOverlay()}
        {subPage === 'form_frp' && renderFrpFormOverlay()}
        {subPage === 'delivery' && renderDeliveryOverlay()}
        {subPage === 'chat' && renderChatOverlay()}
        {subPage === 'location' && renderLocationOverlay()}
        {subPage === 'admin' && renderAdminOverlay()}
        
        {/* Modal Update Status Realtime Admin */}
        {updateModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
             <div className="bg-[#0a192f] border border-white/10 rounded-[40px] p-8 w-full max-w-sm shadow-2xl">
                <h3 className="text-xl font-black mb-6">Update Status</h3>
                <select className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none mb-6 font-bold" value={updateModal.currentStatus} onChange={e => setUpdateModal({...updateModal, currentStatus: e.target.value})}>
                   <option value="Menunggu Pengecekan">Menunggu Pengecekan</option>
                   <option value="Proses Eksekusi">Proses Eksekusi</option>
                   <option value="Menunggu sparepart">Menunggu Sparepart</option>
                   <option value="QC">QC / Testing</option>
                   <option value="Selesai">Selesai / Ready</option>
                </select>
                <div className="flex gap-4">
                   <button onClick={() => setUpdateModal({isOpen:false, orderId:null, currentStatus:''})} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold">Batal</button>
                   <button onClick={async () => {
                     try {
                       const order = serviceOrders.find(o => o.id === updateModal.orderId);
                       const newTimeline = order.timeline.map(t => t.status === updateModal.currentStatus ? {...t, done:true, active:true} : {...t, active:false});
                       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'services', updateModal.orderId), {
                         status: updateModal.currentStatus,
                         timeline: newTimeline
                       });
                       setUpdateModal({isOpen:false, orderId:null, currentStatus:''});
                     } catch(e) { console.error(e); alert("Gagal update status."); }
                   }} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black">Simpan</button>
                </div>
             </div>
          </div>
        )}

        {modal.isOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-[300] animate-in fade-in duration-200">
            <div className="bg-[#0a192f] border border-[#1565c0]/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-white mb-2 whitespace-pre-wrap">{modal.title}</h3>
              <p className="text-white/70 text-sm mb-6 whitespace-pre-wrap leading-relaxed">{modal.message}</p>
              <button onClick={() => setModal({ isOpen: false, title: '', message: '' })} className="w-full py-3 rounded-2xl bg-[#1565c0] text-white font-semibold">Tutup</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// FIX REACT CHILD ERROR: Menggunakan IconComp reference alih-alih merender object JSX mentah
const NavItem = ({ IconComp, label, isActive, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer transition-transform active:scale-90 w-16">
    <div className={`transition-colors ${isActive ? 'text-[#1565c0]' : 'text-white/40'}`}>
      <IconComp size={24} strokeWidth={isActive ? 2.5 : 2} />
    </div>
    <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#1565c0]' : 'text-white/40'}`}>
      {label}
    </span>
    {isActive && <div className="w-1 h-1 bg-[#1565c0] rounded-full mt-0.5 shadow-[0_0_8px_#1565c0]"></div>}
  </div>
);
