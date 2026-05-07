import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Wrench, Cpu, User, Search, ShoppingBag, 
  Smartphone, Battery, Zap, ChevronRight, MessageCircle,
  X, Star, Clock, MapPin, Package, Settings, LogOut, FileText,
  CheckCircle, PenTool, LayoutDashboard, Send, Ticket, 
  Heart, Bell, Camera, Mic, History, ArrowLeft, MoreVertical,
  Activity, Tag, Users, Smartphone as PhoneIcon, RefreshCw, Unlock, Headphones, Truck,
  AlertCircle, Info
} from 'lucide-react';

// --- STYLING GLOBAL ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  body { font-family: 'Poppins', sans-serif; background-color: #F3F4F6; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .bounce-active:active { transform: scale(0.92); transition: transform 0.1s ease; }
`;

const WHATSAPP_NUMBER = "6281234567890"; 

// --- DUMMY DATA ---
const CATEGORIES = [
  { id: 'lcd', name: 'LCD', icon: <Smartphone size={24} />, bg: 'bg-blue-100', text: 'text-blue-500' },
  { id: 'baterai', name: 'Baterai', icon: <Battery size={24} />, bg: 'bg-green-100', text: 'text-green-500' },
  { id: 'charger', name: 'Charger', icon: <Zap size={24} />, bg: 'bg-yellow-100', text: 'text-yellow-500' },
  { id: 'service', name: 'Service', icon: <Wrench size={24} />, bg: 'bg-orange-100', text: 'text-orange-500' },
  { id: 'konsul', name: 'Konsultasi', icon: <MessageCircle size={24} />, bg: 'bg-teal-100', text: 'text-teal-500' },
  { id: 'tracking', name: 'Tracking', icon: <Activity size={24} />, bg: 'bg-red-100', text: 'text-red-500' },
  { id: 'frp', name: 'FRP', icon: <Unlock size={24} />, bg: 'bg-pink-100', text: 'text-pink-500' },
  { id: 'kirim', name: 'Kirim Service', icon: <Truck size={24} />, bg: 'bg-indigo-100', text: 'text-indigo-500' },
];

const DUMMY_PROMOS = [
  { id: 1, image: 'https://i.ibb.co.com/LDf9nHwJ/Screenshot-20260508-012957.jpg', title: 'Promo Service Spesial', desc: 'Dapatkan pelayanan terbaik dengan penawaran harga khusus dari Nano Cell. Kunjungi konter kami atau chat admin untuk info lebih lanjut.' },
  { id: 2, image: 'https://i.ibb.co.com/B5vZdSz1/Screenshot-20260508-012927.jpg', title: 'Gratis Pengecekan Device', desc: 'Kami memberikan layanan gratis pengecekan kerusakan handphone Anda secara transparan sebelum proses service dimulai.' },
  { id: 3, image: 'https://i.ibb.co.com/BVX59cgV/Screenshot-20260508-012903.jpg', title: 'Aksesoris & Sparepart Ori', desc: 'Tersedia berbagai sparepart dan aksesoris original berkualitas. Konsultasikan kebutuhan gadget Anda bersama teknisi ahli kami.' }
];

const DUMMY_PRODUCTS = [
  { id: 1, name: 'LCD Samsung A52 Original', price: 850000, category: 'lcd', brand: 'Samsung', stock: 5, rating: 4.8, sold: 124, image: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=300&q=80', desc: 'LCD Original Copotan Samsung A52. Warna tajam, touch responsif 100%.' },
  { id: 2, name: 'Baterai iPhone 11 Pro Max', price: 450000, category: 'baterai', brand: 'iPhone', stock: 12, rating: 4.9, sold: 340, image: 'https://images.unsplash.com/photo-1619652554790-a352055106e2?w=300&q=80', desc: 'Baterai high capacity untuk iPhone 11 Pro Max. Health 100%.' },
  { id: 3, name: 'Charger Xiaomi 33W', price: 150000, category: 'charger', brand: 'Xiaomi', stock: 25, rating: 4.7, sold: 512, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&q=80', desc: 'Charger original Xiaomi 33W. Support Turbo Charge.' },
  { id: 4, name: 'Kaca Kamera Poco X3', price: 35000, category: 'sparepart', brand: 'Xiaomi', stock: 50, rating: 4.5, sold: 89, image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&q=80', desc: 'Kaca kamera belakang pengganti.' },
  { id: 5, name: 'Fleksibel On/Off Oppo', price: 25000, category: 'sparepart', brand: 'Oppo', stock: 15, rating: 4.4, sold: 42, image: 'https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?w=300&q=80', desc: 'Fleksibel power volume.' },
  { id: 6, name: 'Backdoor Vivo V20', price: 120000, category: 'aksesoris', brand: 'Vivo', stock: 3, rating: 4.6, sold: 18, image: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=300&q=80', desc: 'Tutup belakang original.' },
];

const DUMMY_SERVICES = [
  { id: 's1', name: 'Ganti LCD', icon: <Smartphone className="text-[#00AEEF]" size={32} />, estPrice: 'Mulai Rp 200rb', estTime: '1-3 Jam', desc: 'Penggantian layar LCD pecah, bergaris, atau blank hitam.' },
  { id: 's2', name: 'Flash / Software', icon: <RefreshCw className="text-[#00AEEF]" size={32} />, estPrice: 'Mulai Rp 50rb', estTime: '1-2 Jam', desc: 'Mengatasi bootloop, lupa pola, atau upgrade/downgrade OS.' },
  { id: 's3', name: 'Unlock FRP', icon: <Unlock className="text-[#00AEEF]" size={32} />, estPrice: 'Mulai Rp 100rb', estTime: '1 Jam', desc: 'Bypass akun Google yang terkunci setelah factory reset.' },
  { id: 's4', name: 'Ganti Baterai', icon: <Battery className="text-[#00AEEF]" size={32} />, estPrice: 'Mulai Rp 100rb', estTime: '30 Menit', desc: 'Baterai drop, kembung, atau mati mendadak.' },
  { id: 's5', name: 'Mati Total', icon: <Zap className="text-[#00AEEF]" size={32} />, estPrice: 'Cek Dulu', estTime: '1-3 Hari', desc: 'Pengecekan mendalam IC Power, eMMC, atau short circuit.' },
  { id: 's6', name: 'Service Charging', icon: <Zap className="text-[#00AEEF]" size={32} />, estPrice: 'Mulai Rp 50rb', estTime: '1 Jam', desc: 'Ganti konektor cas longgar atau tidak bisa mengisi daya.' },
];

const BRANDS = ['Semua', 'Xiaomi', 'Samsung', 'iPhone', 'Oppo', 'Vivo', 'Realme', 'Infinix'];
const TRACKING_STEPS = ['Menunggu', 'Diperiksa', 'Dikerjakan', 'Selesai'];

// --- HELPERS ---
const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
const handleWA = (text) => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');

// --- MAIN APP COMPONENT ---
export default function App() {
  const [appState, setAppState] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [products] = useState(DUMMY_PRODUCTS);
  const [services] = useState(DUMMY_SERVICES);
  const [bookings, setBookings] = useState([
    { id: 'NANO-7721', serviceName: 'Ganti LCD Samsung A50', device: 'Samsung A50', status: 'Dikerjakan', date: '08 Mei 2026' }
  ]);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPromo, setSelectedPromo] = useState(null);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = globalStyles;
    document.head.appendChild(styleSheet);
    
    // Minta Izin Push Notification dari OS/Browser
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
       Notification.requestPermission();
    }

    const timer = setTimeout(() => setAppState('login'), 2000);
    return () => { clearTimeout(timer); document.head.removeChild(styleSheet); };
  }, []);

  // FUNGSI PUSAT: Buat Tiket & Notif Real-time
  const handleAddBooking = (newBooking) => {
     // 1. Tambah ke database/state lokal
     setBookings(prev => [newBooking, ...prev]);
     setActiveTab('service');
     setSelectedService(null);

     // 2. Tembak Notifikasi OS (Muncul walau di luar aplikasi)
     if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('✅ Resi Dibuat: ' + newBooking.id, {
           body: `Pesanan service Anda untuk ${newBooking.device} telah dicatat. Teknisi akan segera merespon.`,
        });
     }

     // 3. Simulasi Webhook / Real-time Update Server
     // 10 detik kemudian, status otomatis berubah dan ngirim notifikasi lagi!
     setTimeout(() => {
        setBookings(prev => prev.map(b => 
           b.id === newBooking.id ? { ...b, status: 'Diperiksa' } : b
        ));
        
        if ('Notification' in window && Notification.permission === 'granted') {
           new Notification('🔄 Status Update: ' + newBooking.id, {
              body: `Perangkat ${newBooking.device} Anda saat ini sedang Diperiksa oleh teknisi NANO CELL.`,
           });
        }
     }, 10000); // 10 detik
  };

  const handleLogin = (role) => {
    setUser({ uid: 'usr-8890', name: role === 'admin' ? 'Admin Nano' : 'Pelanggan Setia', email: 'user@nanocell.com' });
    setIsAdmin(role === 'admin');
    setAppState('main');
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setAppState('login');
    setActiveTab('home');
  };

  if (appState === 'splash') return <SplashScreen />;
  if (appState === 'login') return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex justify-center text-gray-800 font-sans selection:bg-[#00AEEF]/30 bg-gray-100">
      <div className="w-full max-w-md relative bg-gray-50 shadow-2xl overflow-hidden flex flex-col sm:border-x sm:border-gray-200">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
          {activeTab === 'home' && <HomeView products={products} services={services} setTab={setActiveTab} onServiceClick={setSelectedService} onProductClick={setSelectedProduct} onPromoClick={setSelectedPromo} />}
          {activeTab === 'produk' && <ProductView products={products} onProductClick={setSelectedProduct} />}
          {activeTab === 'service' && <ServiceView services={services} onServiceClick={setSelectedService} bookings={bookings} />}
          {activeTab === 'chat' && <KonsultasiView />}
          {activeTab === 'kirim' && <KirimView setTab={setActiveTab} onAddBooking={handleAddBooking} />}
          {activeTab === 'akun' && (isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <ProfileView user={user} onLogout={handleLogout} bookings={bookings} setTab={setActiveTab} />)}
        </div>

        {/* Bottom Navigation Navbar */}
        {activeTab !== 'kirim' && (
          <div className="absolute bottom-0 w-full bg-white rounded-t-[24px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 pb-safe z-40">
            <div className="flex justify-between items-center px-4 py-2 mt-1">
              <NavButton icon={<Home size={22} />} label="Beranda" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
              <NavButton icon={<ShoppingBag size={22} />} label="Produk" active={activeTab === 'produk'} onClick={() => setActiveTab('produk')} />
              <NavButton icon={<Wrench size={22} />} label="Service" active={activeTab === 'service'} onClick={() => setActiveTab('service')} />
              <NavButton icon={<MessageCircle size={22} />} label="Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
              <NavButton icon={<User size={22} />} label="Akun" active={activeTab === 'akun'} onClick={() => setActiveTab('akun')} />
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        {activeTab !== 'chat' && activeTab !== 'kirim' && !selectedProduct && !selectedService && !selectedPromo && (
          <button 
            onClick={() => handleWA("Halo Nano Cell, saya mau konsultasi cepat.")}
            className="absolute bottom-24 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_5px_15px_rgba(0,174,239,0.3)] hover:scale-105 transition-transform z-30 border border-blue-100"
          >
            <MessageCircle size={24} className="text-[#00AEEF]" />
          </button>
        )}

        {/* Modals */}
        {selectedPromo && <PromoDetailModal promo={selectedPromo} onClose={() => setSelectedPromo(null)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct} formatRp={formatRp} onClose={() => setSelectedProduct(null)} />}
        {selectedService && (
          <ServiceBookingModal 
            service={selectedService} 
            onClose={() => setSelectedService(null)} 
            onSubmit={(data) => {
              const resiId = `NANO-${Math.floor(10000 + Math.random() * 90000)}`;
              const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
              handleAddBooking({
                 id: resiId,
                 serviceName: data.serviceName,
                 device: data.device,
                 status: 'Menunggu',
                 date: dateStr
              });
            }} 
          />
        )}
      </div>
    </div>
  );
}

// ================= SCREENS & VIEWS =================

function SplashScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#00AEEF]">
      <div className="flex flex-col items-center">
        <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 transform rotate-12">
           <Cpu size={56} className="text-[#00AEEF] transform -rotate-12" />
        </div>
        <h1 className="text-4xl font-bold tracking-widest text-white mb-2 shadow-sm">NANO CELL</h1>
        <p className="text-blue-100 text-sm tracking-widest">PREMIUM SERVICE</p>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-white animate-in fade-in duration-700">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#00AEEF] rounded-3xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,174,239,0.3)] mb-4">
             <Smartphone size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Masuk untuk melanjutkan ke Nano Cell</p>
        </div>

        <div className="space-y-4 w-full">
          <div>
            <label className="text-xs text-gray-500 font-medium ml-1 mb-1 block">Email</label>
            <input type="email" placeholder="user@email.com" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF] transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium ml-1 mb-1 block">Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF] transition-all" />
          </div>
          <div className="flex justify-end">
            <span className="text-xs text-[#00AEEF] font-semibold cursor-pointer">Lupa Password?</span>
          </div>

          <button onClick={() => onLogin('user')} className="w-full bg-[#00AEEF] text-white font-bold py-3.5 rounded-2xl mt-4 shadow-[0_8px_20px_rgba(0,174,239,0.3)] bounce-active">
            Masuk
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400 font-medium">ATAU</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <button onClick={() => onLogin('user')} className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-3 bounce-active shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/></svg>
            Lanjutkan dengan Google
          </button>
          
          <button onClick={() => onLogin('admin')} className="w-full bg-transparent text-gray-400 text-xs font-medium py-2 rounded-xl mt-2">
            Simulasi Login Admin
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 1. HOME VIEW ---
function HomeView({ products, services, setTab, onServiceClick, onProductClick, onPromoClick }) {
  return (
    <div className="animate-in fade-in duration-500 pb-10 bg-gray-50">
      
      {/* HEADER BIRU BESAR */}
      <div className="bg-[#00AEEF] px-5 pt-10 pb-28 relative rounded-b-[40px] overflow-hidden">
        {/* Ornamen Latar */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        {/* Profil Mini */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold border border-white/30">
                P
             </div>
             <div>
               <p className="text-white/80 text-[10px] font-medium leading-tight">Halo, Pelanggan</p>
               <h2 className="text-sm font-bold text-white leading-tight">Cari Service HP?</h2>
             </div>
          </div>
          <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-white relative bounce-active">
             <Bell size={18} />
             <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border border-[#00AEEF] rounded-full"></span>
          </button>
        </div>

        {/* Tagline / Search */}
        <div className="relative z-10 mt-4 pr-32">
           <h1 className="text-2xl font-bold text-white leading-snug mb-3">Solusi Cepat<br/>Untuk Gadgetmu!</h1>
           <div className="relative bg-white rounded-full shadow-lg flex items-center px-4 py-2.5">
             <Search size={18} className="text-gray-400 mr-2 shrink-0" />
             <input type="text" placeholder="Cari LCD, Baterai..." className="w-full bg-transparent text-sm text-gray-700 focus:outline-none placeholder-gray-400" />
           </div>
        </div>

        {/* Mockup HP di Tengah Kanan */}
        <div className="absolute -bottom-4 -right-4 w-40 h-52 z-0 transform rotate-[-10deg]">
           {/* Pure CSS Mockup */}
           <div className="w-full h-full bg-white border-[4px] border-blue-200/50 rounded-[30px] shadow-2xl overflow-hidden relative">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-gray-200 rounded-b-xl z-20"></div>
              <div className="w-full h-full bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col p-2 pt-6 gap-2">
                 <div className="w-full h-12 bg-[#00AEEF]/20 rounded-lg"></div>
                 <div className="w-full h-12 bg-[#00AEEF]/20 rounded-lg"></div>
                 <div className="w-full flex-1 bg-[#00AEEF]/10 rounded-t-lg"></div>
              </div>
           </div>
        </div>
      </div>

      {/* CARD PUTIH ROUNDED MENU */}
      <div className="bg-white rounded-[32px] mx-4 -mt-20 p-5 pt-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] relative z-20">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Kategori Layanan</h3>
         </div>
         <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {CATEGORIES.map(cat => (
               <div key={cat.id} 
                    onClick={() => {
                       if (cat.id === 'kirim') setTab('kirim');
                       else if (cat.id === 'service' || cat.id === 'frp' || cat.id === 'tracking') setTab('service');
                       else if (cat.id === 'konsul') setTab('chat');
                       else setTab('produk');
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer bounce-active group">
                  <div className={`w-12 h-12 rounded-[14px] ${cat.bg} ${cat.text} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                     {cat.icon}
                  </div>
                  <span className="text-[9px] font-medium text-gray-600 text-center leading-tight">{cat.name}</span>
               </div>
            ))}
         </div>
      </div>

      {/* BANNER PROMO DARI URL */}
      <div className="mt-6 px-4 pb-8">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x">
           {DUMMY_PROMOS.map((promo, idx) => (
             <div key={idx} onClick={() => onPromoClick(promo)} className="snap-center shrink-0 w-[90%] h-[160px] rounded-2xl overflow-hidden shadow-[0_5px_15px_rgba(0,0,0,0.05)] bounce-active cursor-pointer border border-gray-100 relative group">
                <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10 translate-y-1 group-hover:translate-y-0 transition-transform">
                   <p className="text-white font-bold text-sm">{promo.title}</p>
                   <p className="text-white/80 text-[10px] line-clamp-1 mt-0.5">{promo.desc}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

// --- 2. PRODUK VIEW ---
function ProductView({ products, onProductClick }) {
  const [activeBrand, setActiveBrand] = useState('Semua');
  const filtered = activeBrand === 'Semua' ? products : products.filter(p => p.brand === activeBrand);

  return (
    <div className="animate-in fade-in duration-500 bg-gray-50 min-h-full">
      <div className="p-4 bg-white sticky top-0 z-20 border-b border-gray-100 shadow-sm pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Marketplace</h2>
        
        <div className="relative bg-gray-100 rounded-xl mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari LCD, Baterai..." className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-gray-700 focus:outline-none" />
        </div>
        
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {BRANDS.map(brand => (
            <button 
              key={brand}
              onClick={() => setActiveBrand(brand)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                activeBrand === brand ? 'bg-[#00AEEF] text-white shadow-md shadow-blue-200' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} formatRp={formatRp} onClick={() => onProductClick(product)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 3. SERVICE VIEW ---
function ServiceView({ services, onServiceClick, bookings }) {
  const [tab, setTab] = useState('pesan');

  return (
    <div className="animate-in fade-in duration-500 flex flex-col min-h-full bg-gray-50">
      <div className="p-4 bg-white sticky top-0 z-20 border-b border-gray-100 shadow-sm pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Service Center</h2>
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'pesan' ? 'bg-white text-[#00AEEF] shadow-sm' : 'text-gray-500'}`}
            onClick={() => setTab('pesan')}
          >
            Pesan Layanan
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'lacak' ? 'bg-white text-[#00AEEF] shadow-sm' : 'text-gray-500'}`}
            onClick={() => setTab('lacak')}
          >
            Lacak Status
          </button>
        </div>
      </div>

      <div className="p-4">
        {tab === 'pesan' ? (
          <div className="space-y-3">
             <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-center">
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheckIcon size={20} className="text-[#00AEEF]" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-800 text-sm">Garansi Resmi</h4>
                  <p className="text-[10px] text-gray-500">Semua layanan di-cover garansi 30 hari.</p>
               </div>
             </div>

            {services.map(srv => (
              <div key={srv.id} onClick={() => onServiceClick(srv)} className="bg-white rounded-2xl p-4 flex gap-4 items-center shadow-sm border border-gray-100 bounce-active cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  {srv.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{srv.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><Clock size={12} className="text-orange-400" /> {srv.estTime}</span>
                    <span className="flex items-center gap-1"><FileText size={12} className="text-green-500" /> {srv.estPrice}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-semibold text-sm mb-2 text-gray-700">Cari Invoice</h4>
              <div className="flex gap-2">
                <input type="text" placeholder="Contoh: INV-7721" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#00AEEF]" />
                <button className="bg-[#00AEEF] px-5 py-2.5 rounded-xl text-white font-bold bounce-active">Cari</button>
              </div>
            </div>

            {bookings.map((b, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <span className="font-mono text-sm text-[#00AEEF] font-bold">{b.id}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{b.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${b.status === 'Selesai' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {b.status}
                  </span>
                </div>
                <h5 className="font-bold text-gray-800 text-sm mb-1">{b.serviceName}</h5>
                <p className="text-xs text-gray-500 mb-5">{b.device}</p>
                
                {/* Progress Tracking */}
                <div className="relative pt-1 px-2">
                   <div className="absolute top-[9px] left-4 right-4 h-0.5 bg-gray-200 -z-10"></div>
                   <div className="flex justify-between relative z-10">
                      {TRACKING_STEPS.map((step, idx) => {
                         const currentIdx = TRACKING_STEPS.indexOf(b.status);
                         const isActive = idx <= currentIdx;
                         const isCurrent = idx === currentIdx;
                         return (
                            <div key={step} className="flex flex-col items-center gap-1.5">
                               <div className={`w-4 h-4 rounded-full border-2 ${isActive ? 'bg-[#00AEEF] border-[#00AEEF]' : 'bg-white border-gray-300'} ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}></div>
                               <span className={`text-[9px] font-semibold ${isActive ? 'text-[#00AEEF]' : 'text-gray-400'}`}>{step}</span>
                            </div>
                         )
                      })}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- 4. KONSULTASI VIEW ---
function KonsultasiView() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Halo Kak! Ada yang bisa kami bantu?', sender: 'admin', time: '10:00' }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if(!input.trim()) return;
    const newMsg = { id: Date.now(), text: input, sender: 'user', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setMessages([...messages, newMsg]);
    setInput('');
    setTimeout(() => {
       setMessages(prev => [...prev, { id: Date.now()+1, text: 'Baik, teknisi kami sedang mengecek pesan kakak.', sender: 'admin', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
       endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 animate-in fade-in duration-300">
      <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 shadow-sm pt-8">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <PenTool size={18} className="text-[#00AEEF]" />
             </div>
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
             <h3 className="font-bold text-sm text-gray-800">Teknisi Nano Cell</h3>
             <p className="text-[10px] text-green-500 font-semibold">Online</p>
          </div>
        </div>
        <button className="p-2 text-gray-400"><MoreVertical size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        <div className="text-center">
           <span className="text-[10px] bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-medium">Hari ini</span>
        </div>
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-[#00AEEF] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'}`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <span className={`text-[9px] block mt-1 text-right font-medium ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>{msg.time}</span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="absolute bottom-16 w-full p-3 bg-white border-t border-gray-100 flex items-center gap-2 px-4 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <button className="p-2 text-gray-400"><Camera size={20}/></button>
        <form onSubmit={handleSend} className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ketik keluhan..." className="flex-1 bg-transparent py-2 text-sm text-gray-800 focus:outline-none" />
          <button type="button" className="p-1.5 text-gray-400"><Mic size={18}/></button>
        </form>
        {input ? (
           <button onClick={handleSend} className="w-10 h-10 bg-[#00AEEF] rounded-full flex items-center justify-center text-white shrink-0 bounce-active shadow-md shadow-blue-200">
             <Send size={16} className="ml-1" />
           </button>
        ) : (
           <button onClick={() => handleWA("Halo Teknisi Nano Cell.")} className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 bounce-active shadow-md shadow-green-200">
             <PhoneIcon size={18} />
           </button>
        )}
      </div>
    </div>
  );
}

// --- KIRIM SERVICE VIEW (ALA E-COMMERCE - LEBIH DETAIL) ---
function KirimView({ setTab, onAddBooking }) {
  const [device, setDevice] = useState('');
  const [issue, setIssue] = useState('');
  const [notes, setNotes] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const handleKirim = () => {
    if (!device || !issue) {
       alert("Mohon isi Detail Perangkat dan Keluhan.");
       return;
    }
    
    // Auto Generate Nomor Resi / ID Tracking
    const resiId = `NANO-${Math.floor(10000 + Math.random() * 90000)}`;
    const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Simpan pesanan ke sistem tracking lokal
    onAddBooking({
       id: resiId,
       serviceName: 'Kirim Service (Kurir)',
       device: device,
       status: 'Menunggu',
       date: dateStr
    });

    const text = `Halo Admin Nano Cell, saya ingin mengirim unit untuk diservice:\n\n*No. Resi:* ${resiId}\n*Merk & Tipe:* ${device}\n*Keluhan:* ${issue}\n*Catatan:* ${notes || '-'}\n*Foto Terlampir:* ${hasPhoto ? 'Ya' : 'Tidak'}\n\nSaya akan mengirimkan paket ke alamat konter, mohon konfirmasinya.`;
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="animate-in slide-in-from-right duration-300 bg-gray-100 min-h-screen relative flex flex-col pb-32">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <button onClick={() => setTab('home')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors bounce-active">
           <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-800">Kirim Perangkat</h2>
      </div>

      {/* Alamat Pengirim (Peta Simulasi) */}
      <div className="bg-white p-4 mt-2 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
         <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
               <MapPin size={18} className="text-[#00AEEF]"/>
               <span className="font-bold text-sm text-gray-800">Alamat Pengirim</span>
            </div>
            <span className="bg-blue-50 text-[#00AEEF] text-[9px] font-bold px-2 py-1 rounded">UTAMA</span>
         </div>
         
         {/* Map Simulation */}
         <div className="w-full h-32 rounded-xl overflow-hidden mb-3 border border-gray-200 relative bg-gray-100">
            <iframe 
               width="100%" 
               height="100%" 
               frameBorder="0" 
               style={{border:0}}
               src="https://maps.google.com/maps?q=-6.2088,106.8456&z=15&output=embed" 
               allowFullScreen
               title="Lokasi User"
               loading="lazy"
            ></iframe>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
               <MapPin size={32} className="text-[#00AEEF] drop-shadow-lg -mt-4" fill="white" />
            </div>
         </div>

         <div className="flex justify-between items-start">
            <div>
               <p className="text-xs text-gray-800 font-bold mb-0.5">Pelanggan Nano (+62 812-3456-7890)</p>
               <p className="text-[11px] text-gray-500 leading-relaxed pr-4">Jl. Contoh Simulasi No. 12, RT 01/RW 02, Kec. Kebayoran, Jakarta Selatan, 12345.</p>
            </div>
            <button className="text-[10px] bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold bounce-active shrink-0">Ubah</button>
         </div>
      </div>

      {/* Alamat Tujuan Konter */}
      <div className="bg-white p-4 mt-2 mb-2 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
         <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-[#00AEEF]"/>
            <span className="font-bold text-sm text-gray-800">Tujuan Pengiriman (Konter)</span>
         </div>

         {/* Embedded Real Google Maps Nano Cell Bogor */}
         <div className="w-full h-40 rounded-xl overflow-hidden mb-3 border border-gray-200 bg-gray-100 shadow-sm relative">
            <iframe 
               width="100%" 
               height="100%" 
               frameBorder="0" 
               style={{border:0}}
               src="https://maps.google.com/maps?q=NANO+CELL,+Jl.+Raya+Cipaku+No.02,+Bogor&z=15&output=embed" 
               allowFullScreen
               title="Lokasi Konter Nano Cell"
               loading="lazy"
            ></iframe>
         </div>

         <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 flex flex-col">
            <div className="flex items-center gap-3 mb-3 border-b border-blue-100/50 pb-3">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-50 shrink-0">
                  <Smartphone size={22} className="text-[#00AEEF]" />
               </div>
               <div>
                  <div className="flex items-center gap-2 mb-0.5">
                     <p className="text-sm text-gray-800 font-bold">NANO CELL</p>
                     <span className="bg-[#00AEEF] text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Official</span>
                  </div>
                  <p className="text-[10px] flex items-center gap-1 text-gray-500">
                     4.9 <Star size={10} className="text-yellow-400 fill-yellow-400" /> (1.2K Ulasan)
                  </p>
               </div>
            </div>
            
            <div className="flex items-start gap-2 mb-2">
               <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
               <p className="text-[10px] text-gray-600 leading-relaxed">
                  Jl. Raya Cipaku No.02, RT.01/RW.10, Cipaku, Kec. Bogor Sel., Kota Bogor, Jawa Barat 16133
               </p>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
               <Clock size={14} className="text-gray-400 shrink-0" />
               <p className="text-[10px] text-gray-600"><span className="text-green-500 font-bold">Buka</span> ⋅ Tutup pukul 20.00 WIB</p>
            </div>

            <a href="https://maps.google.com/maps?q=NANO+CELL,+Jl.+Raya+Cipaku+No.02,+Bogor" target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 text-xs font-bold text-[#00AEEF] bg-white border border-blue-200 px-4 py-2.5 rounded-lg bounce-active shadow-sm hover:bg-blue-50 transition-colors">
               <MapPin size={14} fill="currentColor" className="text-blue-100" /> Buka di Aplikasi Maps
            </a>
         </div>
      </div>

      {/* Detail Form Service */}
      <div className="bg-white p-4 mt-2 shadow-[0_2px_4px_rgba(0,0,0,0.01)] flex-1">
         <div className="flex items-center gap-2 mb-4">
            <Wrench size={18} className="text-[#00AEEF]"/>
            <span className="font-bold text-sm text-gray-800">Informasi Perangkat</span>
         </div>
         
         <div className="space-y-4">
            <div>
               <label className="text-[11px] font-semibold text-gray-500 mb-1 block ml-1">Merk & Tipe HP <span className="text-red-500">*</span></label>
               <input 
                 type="text" 
                 value={device}
                 onChange={(e) => setDevice(e.target.value)}
                 placeholder="Contoh: Samsung A52s 5G" 
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF] outline-none transition-all" 
               />
            </div>
            <div>
               <label className="text-[11px] font-semibold text-gray-500 mb-1 block ml-1">Keluhan Detail <span className="text-red-500">*</span></label>
               <textarea 
                 value={issue}
                 onChange={(e) => setIssue(e.target.value)}
                 placeholder="Jelaskan secara detail (Cth: Layar retak, touch screen kadang ngaco)" 
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF] outline-none resize-none transition-all" 
                 rows="3"
               ></textarea>
            </div>
         </div>

         {/* Tambahan: Upload Foto */}
         <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
               <label className="text-[11px] font-semibold text-gray-800 flex items-center gap-1.5 ml-1">
                  <Camera size={14} className="text-gray-400"/> Foto Kondisi HP 
                  <span className="text-gray-400 font-normal">(Opsional)</span>
               </label>
            </div>
            <div 
              onClick={() => setHasPhoto(!hasPhoto)}
              className={`w-full border-2 ${hasPhoto ? 'border-[#00AEEF] bg-blue-50/50' : 'border-dashed border-gray-300 bg-gray-50'} rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bounce-active hover:bg-gray-100`}
            >
               {hasPhoto ? (
                  <>
                    <CheckCircle size={28} className="text-[#00AEEF]" />
                    <span className="text-[11px] font-semibold text-[#00AEEF]">3 Foto Berhasil Dilampirkan</span>
                  </>
               ) : (
                  <>
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-1">
                       <Camera size={18} className="text-gray-400" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 text-center px-4">Upload foto HP dari depan, belakang, dan sisi yang rusak.</span>
                  </>
               )}
            </div>
         </div>

         {/* Tambahan: Catatan Ekstra */}
         <div className="mt-5 pt-5 border-t border-gray-100">
            <label className="text-[11px] font-semibold text-gray-800 flex items-center gap-1.5 mb-2 ml-1">
               <FileText size={14} className="text-gray-400"/> Catatan Tambahan 
               <span className="text-gray-400 font-normal">(Opsional)</span>
            </label>
            <input 
               type="text" 
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Pesan untuk teknisi / kurir..." 
               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF] outline-none transition-all" 
            />
         </div>

         {/* Tambahan: Panduan Packing (Alert) */}
         <div className="mt-5 bg-yellow-50 border border-yellow-200 p-3.5 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <div>
               <p className="text-xs font-bold text-yellow-800 mb-1">Panduan Kirim Paket Aman</p>
               <p className="text-[10px] text-yellow-700 leading-relaxed pr-2">
                 Pastikan HP dibungkus rapat dengan <b>Bubble Wrap tebal</b> dan dimasukkan ke dalam kardus. Kerusakan selama di perjalanan oleh pihak ekspedisi di luar tanggung jawab Nano Cell.
               </p>
            </div>
         </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 p-4 pb-safe z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.04)] flex flex-col gap-3">
         <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <Info size={14} className="text-[#00AEEF]" />
            <p>Dengan melanjutkan, Anda setuju dengan Syarat & Ketentuan kami.</p>
         </div>
         <div className="flex justify-between items-center">
            <div>
               <p className="text-[10px] text-gray-500 font-semibold mb-0.5 uppercase tracking-wide">Status Pengiriman</p>
               <p className="text-sm font-bold text-gray-800">Cetak Resi</p>
            </div>
            <button 
              onClick={handleKirim} 
              className="bg-[#00AEEF] text-white font-bold px-6 py-3.5 rounded-xl bounce-active shadow-[0_5px_15px_rgba(0,174,239,0.3)] hover:bg-blue-500 transition-colors flex items-center gap-2"
            >
               <FileText size={18} /> Cetak Resi
            </button>
         </div>
      </div>
    </div>
  );
}

// --- 5. AKUN VIEW ---
function ProfileView({ user, onLogout, setTab }) {
  return (
    <div className="animate-in fade-in duration-500 bg-gray-50 min-h-full">
      <div className="bg-[#00AEEF] p-6 pt-12 rounded-b-[40px] shadow-sm text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#00AEEF] shadow-lg">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold leading-tight">{user?.name}</h2>
            <p className="text-xs text-blue-100 mb-1.5">{user?.email}</p>
            <span className="text-[10px] bg-blue-600/50 text-white px-2 py-0.5 rounded-full font-medium border border-blue-400/50">Member Silver</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-4 relative z-10">
        <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex flex-col items-center justify-center p-2 bounce-active cursor-pointer">
              <History size={22} className="text-[#00AEEF] mb-1.5" />
              <span className="text-[10px] text-gray-500 font-medium">Pesanan</span>
           </div>
           <div className="flex flex-col items-center justify-center p-2 bounce-active cursor-pointer" onClick={() => setTab('service')}>
              <Wrench size={22} className="text-[#00AEEF] mb-1.5" />
              <span className="text-[10px] text-gray-500 font-medium">Service</span>
           </div>
           <div className="flex flex-col items-center justify-center p-2 bounce-active cursor-pointer">
              <Ticket size={22} className="text-[#00AEEF] mb-1.5" />
              <span className="text-[10px] text-gray-500 font-medium">Voucher</span>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <MenuRow icon={<Package className="text-gray-400"/>} label="Riwayat Order" />
          <MenuRow icon={<Heart className="text-gray-400"/>} label="Favorit Produk" />
          <MenuRow icon={<MapPin className="text-gray-400"/>} label="Alamat Pengiriman" noBorder />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <MenuRow icon={<Bell className="text-gray-400"/>} label="Notifikasi" badge={3} />
          <MenuRow icon={<Settings className="text-gray-400"/>} label="Pengaturan Akun" />
          <MenuRow icon={<LogOut className="text-red-500"/>} label="Keluar" color="text-red-600" noBorder onClick={onLogout} />
        </div>
      </div>
    </div>
  );
}

// --- ADMIN DASHBOARD ---
function AdminDashboard({ onLogout }) {
  return (
    <div className="animate-in slide-in-from-right duration-300 min-h-screen bg-gray-50 p-4 pt-8">
       <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-xs text-[#00AEEF] font-semibold">Admin Panel</p>
          </div>
          <button onClick={onLogout} className="p-2 bg-red-100 text-red-500 rounded-full bounce-active"><LogOut size={18}/></button>
       </div>
       
       <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-[#00AEEF]">
             <p className="text-gray-500 text-[10px] mb-1 font-semibold uppercase">Total Service</p>
             <h3 className="text-xl font-bold text-gray-800">48</h3>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
             <p className="text-gray-500 text-[10px] mb-1 font-semibold uppercase">Pendapatan</p>
             <h3 className="text-lg font-bold text-gray-800">Rp 8.5M</h3>
          </div>
       </div>

       <div className="grid grid-cols-3 gap-3 mb-6">
          <AdminMenu icon={<ShoppingBag size={20} className="text-blue-500"/>} label="Produk" bg="bg-blue-50" />
          <AdminMenu icon={<Wrench size={20} className="text-orange-500"/>} label="Service" bg="bg-orange-50" />
          <AdminMenu icon={<MessageCircle size={20} className="text-green-500"/>} label="Chat" bg="bg-green-50" badge={5} />
       </div>
    </div>
  );
}

function AdminMenu({ icon, label, badge, bg }) {
  return (
    <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center relative cursor-pointer shadow-sm border border-gray-100 bounce-active">
      {badge && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm">{badge}</span>}
      <div className={`p-2 rounded-xl ${bg} mb-1.5`}>{icon}</div>
      <span className="text-[10px] font-semibold text-gray-600">{label}</span>
    </div>
  );
}

// --- SHARED COMPONENTS ---
function ProductCard({ product, formatRp, onClick }) {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden bounce-active cursor-pointer flex flex-col h-full border border-gray-100 shadow-sm">
      <div className="h-32 relative bg-gray-100 p-2">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
        {product.stock === 0 ? (
           <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
             <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">Habis</span>
           </div>
        ) : (
           <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
             <Star size={10} className="text-yellow-400 fill-yellow-400" />
             <span className="text-[9px] text-gray-700 font-bold">{product.rating}</span>
           </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <span className="text-[9px] text-gray-400 mb-0.5 font-semibold uppercase tracking-wider">{product.brand}</span>
        <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-2 flex-1">{product.name}</h4>
        <div className="flex justify-between items-end mt-auto">
          <span className="text-sm font-bold text-[#00AEEF]">{formatRp(product.price)}</span>
        </div>
      </div>
    </div>
  );
}

function MenuRow({ icon, label, badge, color = "text-gray-700", value, noBorder, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between p-4 bounce-active cursor-pointer ${!noBorder ? 'border-b border-gray-100' : ''}`}>
      <div className={`flex items-center gap-3 ${color}`}>
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-gray-400">{value}</span>}
        {badge > 0 && <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{badge}</span>}
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 w-[20%] py-1 relative`}>
      <div className={`transition-all duration-300 ${active ? 'text-[#00AEEF] transform -translate-y-1 scale-110' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-semibold transition-all ${active ? 'text-[#00AEEF]' : 'text-gray-400'}`}>{label}</span>
    </button>
  );
}

// --- MODALS (BOTTOM SHEETS) ---
function ProductDetailModal({ product, formatRp, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end animate-in fade-in duration-200">
      <div className="absolute top-4 left-4 z-50">
         <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md bounce-active text-gray-800"><ArrowLeft size={20} /></button>
      </div>

      <div className="h-[85vh] bg-white rounded-t-[32px] relative z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
        <div className="h-64 bg-gray-100 shrink-0 relative p-4">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-2xl shadow-sm" />
          <button className="absolute bottom-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-400 bounce-active"><Heart size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24 scrollbar-hide">
          <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-gray-500">
             <span className="bg-blue-50 text-[#00AEEF] px-2 py-0.5 rounded-md uppercase">{product.brand}</span>
             <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400"/> {product.rating}</span>
             <span>Terjual {product.sold}</span>
          </div>
          
          <h2 className="text-lg font-bold text-gray-800 leading-tight mb-2">{product.name}</h2>
          <p className="text-2xl font-bold text-[#00AEEF] mb-6">{formatRp(product.price)}</p>
          
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-gray-50 border border-gray-100 p-3 rounded-2xl text-center">
              <p className="text-[10px] text-gray-500 mb-0.5 font-medium">Stok</p>
              <p className="font-bold text-sm text-gray-800">{product.stock > 0 ? product.stock : 'Habis'}</p>
            </div>
            <div className="flex-1 bg-gray-50 border border-gray-100 p-3 rounded-2xl text-center">
              <p className="text-[10px] text-gray-500 mb-0.5 font-medium">Kondisi</p>
              <p className="font-bold text-sm text-green-500">Baru</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-2 text-gray-800">Detail Produk</h4>
            <p className="text-gray-500 text-xs leading-relaxed">{product.desc}</p>
          </div>
        </div>

        <div className="absolute bottom-0 w-full p-4 bg-white border-t border-gray-100 flex gap-3 pb-safe z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
           <button className="w-14 h-14 rounded-2xl border border-gray-200 flex items-center justify-center text-[#00AEEF] bg-blue-50 bounce-active">
              <MessageCircle size={24} />
           </button>
           <button 
             disabled={product.stock === 0}
             onClick={() => handleWA(`Halo Admin Nano Cell, saya mau order:\n\n*${product.name}*\nHarga: ${formatRp(product.price)}\n\nApakah stok ada?`)}
             className={`flex-1 rounded-2xl font-bold text-white shadow-md flex items-center justify-center gap-2 bounce-active ${
               product.stock > 0 
               ? 'bg-[#00AEEF] shadow-blue-200' 
               : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
             }`}
           >
             {product.stock > 0 ? 'Lanjut Pemesanan' : 'Stok Habis'}
           </button>
        </div>
      </div>
    </div>
  );
}

function ServiceBookingModal({ service, onClose, onSubmit }) {
  const [device, setDevice] = useState('');
  const [issue, setIssue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if(device && issue) onSubmit({ serviceName: service.name, device, issue });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl p-6 pb-8 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Booking Service</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 bounce-active"><X size={20}/></button>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-4 mb-6 border border-blue-100">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            {service.icon}
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-1">{service.name}</h4>
            <p className="text-xs text-[#00AEEF] font-bold mb-1">Estimasi: {service.estPrice}</p>
            <p className="text-[10px] text-gray-500 leading-relaxed">{service.desc}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Merk & Tipe HP</label>
            <input required type="text" value={device} onChange={e => setDevice(e.target.value)} placeholder="Contoh: iPhone 11 Pro" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Penjelasan Kerusakan</label>
            <textarea required value={issue} onChange={e => setIssue(e.target.value)} placeholder="Ceritakan kronologi singkat..." rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF] resize-none"></textarea>
          </div>
          
          <button type="submit" className="w-full bg-[#00AEEF] text-white font-bold py-4 rounded-xl mt-4 shadow-md shadow-blue-200 bounce-active">
            Lanjut Buat Tiket
          </button>
        </form>
      </div>
    </div>
  );
}

function PromoDetailModal({ promo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
      <div className="h-[90vh] bg-white rounded-t-[32px] relative z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
        
        {/* HD Image Area */}
        <div className="relative bg-black h-72 shrink-0">
          <img src={promo.image} alt={promo.title} className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-md bounce-active text-white border border-white/20">
             <X size={20} />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
             <span className="bg-[#00AEEF] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-1.5 inline-block shadow-sm">Promo Nano Cell</span>
             <h2 className="text-xl font-bold text-white leading-tight">{promo.title}</h2>
          </div>
        </div>
        
        {/* Description Area */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-24 scrollbar-hide">
          <h4 className="font-bold text-sm mb-2 text-gray-800">Keterangan / Detail Info</h4>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {promo.desc}
          </p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
             <Info size={20} className="text-[#00AEEF] shrink-0" />
             <p className="text-[10px] text-gray-600 leading-relaxed">
                Tunjukkan halaman informasi/promo ini ke admin kami di konter atau screenshot dan kirim via WhatsApp untuk mengklaim penawaran.
             </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="absolute bottom-0 w-full p-4 bg-white border-t border-gray-100 pb-safe z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
           <button 
             onClick={() => window.open(`https://wa.me/6281234567890?text=Halo Admin Nano Cell, saya ingin menanyakan info ini:\n\n*${promo.title}*\n\nBisa dibantu jelaskan?`, '_blank')}
             className="w-full rounded-2xl font-bold text-white bg-[#00AEEF] shadow-[0_5px_15px_rgba(0,174,239,0.3)] hover:bg-blue-500 py-3.5 flex items-center justify-center gap-2 bounce-active"
           >
             <MessageCircle size={18} /> Chat Admin Sekarang
           </button>
        </div>
      </div>
    </div>
  );
}

function ShieldCheckIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
