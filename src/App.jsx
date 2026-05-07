import React, { useEffect } from 'react';
import { 
  Check, 
  Mail, 
  Lock, 
  X, 
  EyeOff, 
  Home, 
  Heart, 
  User, 
  ShoppingBag 
} from 'lucide-react';

export default function App() {
  // Hook untuk memuat efek partikel (tsParticles) saat komponen di-mount
  useEffect(() => {
    const scriptId = 'tsparticles-script';
    
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdn.jsdelivr.net/npm/tsparticles@2/tsparticles.bundle.min.js';
      script.async = true;
      script.onload = () => {
        if (window.tsParticles) {
          window.tsParticles.load("tsparticles-container", {
            background: { color: { value: "transparent" } },
            particles: {
              number: { value: 50, density: { enable: true, value_area: 800 } },
              color: { value: "#ffffff" },
              shape: { type: "circle" },
              opacity: { value: 0.4, random: true },
              size: { value: 2, random: true },
              move: { enable: true, speed: 1, direction: "top", out_mode: "out" },
              interactivity: { events: { onhover: { enable: true, mode: "repulse" } } }
            },
            detectRetina: true
          });
        }
      };
      document.body.appendChild(script);
    }

    return () => {
      const script = document.getElementById(scriptId);
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          .font-poppins { font-family: 'Poppins', sans-serif; }
          /* Menyembunyikan scrollbar untuk tampilan native */
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* Global Wrapper: Fullscreen responsive, ditambah antialiased agar font HD dan tajam */}
      <div className="w-full h-[100dvh] overflow-hidden bg-black text-white font-poppins relative selection:bg-blue-500/30 antialiased">
        
        {/* Latar Belakang Gambar HD Premium (Full layar) */}
        <div className="absolute inset-0 z-0 flex justify-center items-center overflow-hidden">
          
          {/* Gambar utama: object-cover tanpa scale agar piksel gambar tetap tajam (HD) */}
          <img 
            src="https://i.ibb.co.com/21yzfm9D/anime-wallpaper-for-4k-quality.jpg"
            alt="HD Background"
            className="absolute w-full h-full object-cover"
          />
          
          {/* Overlay gelap agar teks dan form tetap terbaca jelas di atas gambar yang ramai */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Wadah Partikel (dipisah agar melayang di atas background) */}
        <div id="tsparticles-container" className="absolute inset-0 z-10 pointer-events-none"></div>

        {/* App Container - Full Layout */}
        <div className="relative z-20 w-full h-[100dvh] flex flex-col justify-center items-center">
          
          {/* Konten UI Utama (Maksimal lebar md agar form tetap proporsional dan elegan) */}
          <div className="w-full max-w-md flex flex-col justify-center px-6 overflow-y-auto no-scrollbar py-10">
            
            {/* Profile Header */}
            <div className="text-center flex flex-col items-center mb-8">
              <div className="relative w-[85px] h-[85px] mb-4">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                <img 
                  src="https://i.ibb.co.com/v6dP9z6v/file-00000000aa6471f8b42ace59e3dfc373.png" 
                  alt="Avatar" 
                  className="relative z-10 w-full h-full rounded-full object-cover border-[3px] border-[#2979ff] shadow-lg"
                />
                <div className="absolute top-0 right-0 z-20 bg-gradient-to-tr from-[#2979ff] to-[#64b5f6] text-white w-6 h-6 rounded-full flex justify-center items-center text-[10px] border-2 border-[#001122] shadow-sm">
                  <Check size={14} strokeWidth={4} />
                </div>
              </div>
              <h1 className="m-0 text-2xl font-bold tracking-tight text-white drop-shadow-md">Nano Cell</h1>
              <p className="mt-1 text-sm text-blue-200/80 font-light">Welcome back, Member!</p>
            </div>

            {/* Glass Login Card - Dipertajam efek blurnya */}
            <div className="bg-white/[0.04] backdrop-blur-2xl rounded-[32px] p-7 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <h2 className="m-0 mb-1 text-xl font-semibold text-white tracking-wide">Log In</h2>
              <p className="m-0 mb-6 text-sm text-white/50 font-light">Please enter your login details</p>

              {/* Input Field: Username/Email */}
              <div className="bg-black/30 rounded-2xl border border-white/10 py-3 px-4 flex items-center mb-4 transition-all focus-within:border-blue-500/60 focus-within:bg-black/50 shadow-inner">
                <Mail size={18} className="text-white/40" />
                <input 
                  type="text" 
                  placeholder="Username/Email" 
                  className="bg-transparent border-none outline-none text-white font-poppins text-sm flex-grow px-3 placeholder:text-white/30"
                />
                <X size={16} className="text-white/30 cursor-pointer hover:text-white transition-colors" />
              </div>

              {/* Input Field: Password */}
              <div className="bg-black/30 rounded-2xl border border-white/10 py-3 px-4 flex items-center mb-4 transition-all focus-within:border-blue-500/60 focus-within:bg-black/50 shadow-inner">
                <Lock size={18} className="text-white/40" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="bg-transparent border-none outline-none text-white font-poppins text-sm flex-grow px-3 placeholder:text-white/30"
                />
                <EyeOff size={16} className="text-white/30 cursor-pointer hover:text-white transition-colors" />
              </div>

              <a href="#" className="block text-right text-xs text-blue-400/80 hover:text-blue-400 transition-colors mb-7">
                Forgot Password?
              </a>

              {/* Main Login Button */}
              <button className="relative overflow-hidden w-full h-[52px] rounded-2xl border-none font-poppins text-sm font-semibold text-white cursor-pointer bg-gradient-to-r from-[#2979ff] to-[#0d47a1] shadow-[0_8px_20px_rgba(41,121,255,0.25)] mb-6 hover:shadow-[0_8px_25px_rgba(41,121,255,0.4)] hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0">
                <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl opacity-0 hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 tracking-wider">LOG IN</span>
              </button>

              {/* "Or login with" Separator */}
              <div className="flex items-center justify-center gap-4 text-white/40 text-xs mb-5">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent to-white/10"></div>
                <span className="whitespace-nowrap">Or login with</span>
                <div className="h-[1px] w-full bg-gradient-to-l from-transparent to-white/10"></div>
              </div>

              {/* Social Login Buttons */}
              <div className="flex gap-4 mb-6">
                <button className="flex-1 h-[48px] rounded-2xl border border-white/10 flex justify-center items-center cursor-pointer font-poppins text-sm font-medium gap-2 bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-[0.98]">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button className="flex-1 h-[48px] rounded-2xl border border-[#25d366]/30 flex justify-center items-center cursor-pointer font-poppins text-sm font-medium gap-2 bg-[#25d366]/10 text-white hover:bg-[#25d366]/20 transition-colors active:scale-[0.98]">
                  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="#25d366">
                    <path d="M12.01 2.002c-5.522 0-9.998 4.477-9.998 9.998 0 1.956.51 3.84 1.48 5.51L2.002 22l4.63-1.214c1.63.895 3.47 1.366 5.38 1.366 5.52 0 9.998-4.477 9.998-9.998s-4.477-9.998-9.998-9.998zm5.495 14.37c-.225.642-1.306 1.206-1.802 1.242-.462.034-1.042.14-3.324-.805-2.75-1.14-4.536-4.004-4.67-4.184-.132-.18-1.116-1.485-1.116-2.833 0-1.348.7-2.012.946-2.284.246-.272.538-.34.717-.34.18 0 .358.003.518.01.166.007.39-.066.608.462.226.545.768 1.88.835 2.016.068.136.112.296.022.477-.09.18-.136.295-.27.453-.136.158-.285.348-.406.463-.135.13-.277.273-.122.54.155.268.687 1.137 1.477 1.84.996.887 1.84 1.164 2.11 1.296.27.13.428.11.587-.07.16-.18.686-.803.87-1.077.18-.274.364-.23.61-.136.246.095 1.554.733 1.822.868.268.136.446.204.512.318.066.114.066.66-.16 1.302z" />
                  </svg>
                  WhatsApp
                </button>
              </div>

              <p className="text-center text-xs text-white/60">
                Don't have an account? <a href="#" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors ml-1">Sign Up</a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
