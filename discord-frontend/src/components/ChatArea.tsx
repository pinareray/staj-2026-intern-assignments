import React from 'react';

export default function ChatArea() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden relative bg-mahogany-red">
      
      {/* Üst Bar (Header) */}
      <header className="h-16 px-md flex items-center justify-between border-b border-outline-variant/10 z-10 bg-surface-container-lowest/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>book</span>
          <div>
            <h2 className="font-title-md text-title-md text-on-surface">the-archive</h2>
            <p className="text-xs text-on-surface-variant/70 italic">Where ancient texts and lost knowledge reside.</p>
          </div>
        </div>
        
        {/* Sağ Üst İkonlar ve Arama Kutusu */}
        <div className="flex items-center gap-lg">
          <div className="hidden lg:flex items-center gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined hover:text-primary cursor-pointer">notifications</span>
            <span className="material-symbols-outlined hover:text-primary cursor-pointer">group</span>
          </div>
          <div className="relative">
            <input 
              className="bg-surface-container-low border-none rounded-full py-1.5 px-4 text-sm w-48 focus:ring-1 focus:ring-primary-container/50 placeholder:text-on-surface-variant/40 outline-none text-on-surface" 
              placeholder="Search archive..." 
              type="text"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant/50">search</span>
          </div>
        </div>
      </header>

      {/* Mesajların Listelendiği Akış Alanı */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-md py-lg inner-depth space-y-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low/30">
        
        {/* Tarih Ayırıcı */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/10"></div></div>
          <span className="relative bg-mahogany-red px-4 text-[10px] font-bold uppercase tracking-widest text-outline-variant/60">September 14, 1892</span>
        </div>

        {/* Gelen Mesaj Örneği */}
        <div className="flex gap-4">
          <img className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-outline-variant/20" alt="Clara Vance" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-2vM3jmpHV6vn1inmUdTbXE5rRBknytjivXSEq5tYCAuRr1Ft5AMDoCS_ZpWUWotlChmJnuD2AXhifSGvs_z4sWakRXkRzWwvEzM2Va3nDgzQX7fczp9rxklwpLUYwp6wPUEURQJwIdGdPlDfSsJAaFGvWduiiGWYC7Buuc63wFkCT9HRe5i3aIP9ypDawQ6AbB8sPyILKXuuajHxAgYiURsVnQvFul6QNZHwHRL_LuGWvmJYmEOrXw"/>
          <div className="flex-1 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-label-md text-label-md text-primary-container">Clara Vance</span>
              <span className="text-[10px] text-outline-variant font-medium">10:42 AM</span>
            </div>
            <div className="space-y-2">
              <div className="inline-block max-w-[85%] p-md rounded-xl rounded-tl-sm bg-black-cherry text-on-surface shadow-lg border border-outline-variant/10">
                <p className="font-body-md text-body-md">Has anyone had a chance to examine the digital scan of the *Voynich* marginalia recently unearthed in the Prague collection? The ink composition seems... inconsistent with the period.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Giden Mesaj Örneği (Senin Gönderdiğin) */}
        <div className="flex gap-4 flex-row-reverse">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 border border-primary-container/30 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary-container">person</span>
          </div>
          <div className="flex-1 space-y-1 text-right">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-[10px] text-outline-variant font-medium">11:15 AM</span>
              <span className="font-label-md text-label-md text-primary">You</span>
            </div>
            <div className="inline-block max-w-[85%] p-md rounded-xl rounded-tr-sm bg-primary-container text-on-primary shadow-xl border border-primary/20">
              <p className="font-body-md text-body-md">I'll bring my findings from the Al-Andalus manuscripts to the seminar. There might be a linguistic bridge we've been overlooking.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mesaj Yazma (Input) Kutusu */}
      <footer className="p-md bg-surface-container-lowest/40 border-t border-outline-variant/10">
        <div className="max-w-5xl mx-auto flex items-end gap-3 bg-surface-container-low rounded-2xl p-2 border border-outline-variant/20 shadow-inner group transition-all focus-within:border-primary-container/40">
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <div className="flex-1">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 py-2 custom-scrollbar resize-none max-h-32 font-body-md outline-none" 
              placeholder="Compose a scroll for #the-archive..." 
              rows={1}
            ></textarea>
          </div>
          <div className="flex items-center gap-2 p-1">
            <button className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">mood</span>
            </button>
            <button className="w-10 h-10 bg-primary-container text-on-primary rounded-xl flex items-center justify-center hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </footer>

    </main>
  );
}