import React from 'react';

export default function ChannelSidebar() {
  return (
    // HTML'deki style="..." özelliğini Tailwind rengimiz olan bg-mahogany-red ile değiştirdik
    <nav className="w-72 flex flex-col border-r border-outline-variant/10 bg-mahogany-red shrink-0">
      
      {/* Üst Kısım: Sunucu Adı */}
      <header className="h-16 px-md flex items-center justify-between border-b border-outline-variant/10">
        <h1 className="font-title-md text-title-md tracking-tight text-on-surface">The Great Hall</h1>
        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">expand_more</span>
      </header>

      {/* Orta Kısım: Kanallar ve Kategoriler */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-sm space-y-6">
        
        {/* Kategori 1: Scriptorium */}
        <div className="px-sm">
          <div className="flex items-center px-sm py-xs text-on-surface-variant opacity-60 uppercase tracking-widest text-[10px] font-bold">
            <span className="material-symbols-outlined text-sm mr-1">keyboard_arrow_down</span>
            Scriptorium
          </div>
          <div className="mt-2 space-y-1">
            {/* Aktif Kanal (Seçili olan) */}
            <button className="w-full flex items-center gap-3 px-sm py-2 rounded-lg ribbon-active bg-primary-container/10 text-on-surface group">
              <span className="material-symbols-outlined text-on-primary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>book</span>
              <span className="font-body-md text-body-md">the-archive</span>
            </button>
            
            {/* Pasif Kanal */}
            <button className="w-full flex items-center gap-3 px-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all group">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">diversity_3</span>
              <span className="font-body-md text-body-md">socratic-circle</span>
            </button>
          </div>
        </div>

      </div>

      {/* Alt Kısım: Kullanıcı Profili (Senin giriş yapan kullanıcı bilgilerin buraya gelecek) */}
      <div className="p-sm bg-surface-container-lowest/50 border-t border-outline-variant/10 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-primary-container/30">
            <img 
              className="w-full h-full object-cover" 
              alt="Elias Thorne" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXHrZStYV7OJyDL1gJ5tTUNDrO-pIAk0hNGToRem2_r_kTHi62wlj6FnbcUo8RB4C5aijqkq-JXTXSqxrOkjSraeqQtK8cDEzTNUyHPYkmV5A_vYQDNxLaC77g0Kk0HzhKLSlVEoN54o-kZ85d_HKpCwJTTzozkqgAflGyvDTQoZtBecCvgFwRCOjH4pR8771-oVLWxj0bFKUBTomQd4kUjGBRMeBYIhAV1oFKutJkaO24h3U69OtLOA" 
            />
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-container rounded-full border-2 border-surface"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-label-md text-label-md text-on-surface truncate">Elias Thorne</div>
          <div className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">Scholar Elite</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface cursor-pointer text-xl">settings</span>
        </div>
      </div>

    </nav>
  );
}