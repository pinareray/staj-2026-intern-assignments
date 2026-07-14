import React from 'react';

export default function ServerSidebar() {
  return (
    <aside className="w-20 flex flex-col items-center py-md space-y-md border-r border-outline-variant/10 bg-mahogany-dark shrink-0">
      
      {/* L'Atelier - Ana Profil/Logo */}
      <div className="relative group cursor-pointer">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container p-0.5 transition-transform duration-300 group-hover:scale-110">
          <img 
            className="w-full h-full object-cover rounded-full" 
            alt="L'Atelier" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNrDyzld7RYExZONfvrF45TjVzrDx9lAQ2jD7S2j76d9WjAAd-keacbNCn_5poBisDtRyj-sQ0348TDLFMD4zqSaG-ZdTiLiPXefLL9Qib52LmtM2G6Ay_dGX30CPTvMNPYXTxXaK-bLX-YfVQzxz-52RxVfJa4Pc5q8xbhJTty60tyKWh_dDQ9rMxru-cfxfOVbncxG-Db8S36slHXY_Tveiv7k0gZdDpvnlpUSiPk9mnBB1iaiYxgQ" 
          />
        </div>
      </div>
      
      {/* Ayırıcı Çizgi */}
      <div className="w-10 h-px bg-outline-variant/20 mx-auto"></div>

      {/* Sunucu İkonları */}
      <div className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center cursor-pointer transition-all duration-300 hover:rounded-xl hover:bg-primary-container/20 group">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">castle</span>
        </div>
        
        <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center cursor-pointer transition-all duration-300 hover:rounded-xl hover:bg-primary-container/20 group">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">ink_pen</span>
        </div>
        
        <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center cursor-pointer transition-all duration-300 hover:rounded-xl hover:bg-primary-container/20 group">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">auto_stories</span>
        </div>

        {/* Yeni Sunucu Ekle Butonu */}
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-outline-variant/40 flex items-center justify-center cursor-pointer hover:border-primary-container/60 transition-colors">
          <span className="material-symbols-outlined text-outline">add</span>
        </div>
      </div>
    </aside>
  );
}