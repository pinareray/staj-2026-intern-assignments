export default function ChatArea() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden relative bg-background">
      <header className="h-16 px-6 flex items-center justify-between border-b border-stone-200 z-10 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            tag
          </span>
          <div>
            <h2 className="font-libre text-lg text-stone-900">genel</h2>
            <p className="text-xs text-stone-400 font-hanken">
              micodex genel sohbet kanalı
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-4 text-stone-400">
            <span className="material-symbols-outlined hover:text-primary-container cursor-pointer">
              notifications
            </span>
            <span className="material-symbols-outlined hover:text-primary-container cursor-pointer">
              group
            </span>
          </div>
          <div className="relative">
            <input
              className="bg-stone-100 border border-stone-200 rounded-full py-1.5 px-4 text-sm w-48 focus:ring-1 focus:ring-primary-container/40 placeholder:text-stone-400 outline-none text-stone-900"
              placeholder="Ara..."
              type="text"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
              search
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 inner-depth space-y-10 bg-gradient-to-br from-white to-[#f7f4ef]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <span className="relative bg-[#f7f4ef] px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Bugün
          </span>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0 border border-stone-200">
            <span className="material-symbols-outlined text-stone-500">
              person
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-primary-container font-hanken">
                Clara
              </span>
              <span className="text-[10px] text-stone-400 font-medium">
                10:42
              </span>
            </div>
            <div className="inline-block max-w-[85%] p-4 rounded-xl rounded-tl-sm bg-white text-stone-800 shadow-sm border border-stone-200">
              <p className="text-sm font-hanken leading-relaxed">
                Herkese merhaba! micodex’e hoş geldiniz. Bu kanalda genel
                sohbetleri paylaşıyoruz.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 flex-row-reverse">
          <div className="w-10 h-10 rounded-lg bg-primary-container/10 border border-primary-container/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary-container">
              person
            </span>
          </div>
          <div className="flex-1 space-y-1 text-right">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-[10px] text-stone-400 font-medium">
                11:15
              </span>
              <span className="text-sm font-semibold text-primary-container font-hanken">
                Sen
              </span>
            </div>
            <div className="inline-block max-w-[85%] p-4 rounded-xl rounded-tr-sm bg-primary-container text-white shadow-md">
              <p className="text-sm font-hanken leading-relaxed">
                Teşekkürler! Hemen kanalı keşfetmeye başlıyorum.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="p-6 bg-white border-t border-stone-200">
        <div className="max-w-5xl mx-auto flex items-end gap-3 bg-stone-50 rounded-2xl p-2 border border-stone-200 transition-all focus-within:border-primary-container/40">
          <button className="p-2 text-stone-400 hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <div className="flex-1">
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 text-stone-900 placeholder:text-stone-400 py-2 custom-scrollbar resize-none max-h-32 text-sm outline-none font-hanken"
              placeholder="#genel kanalına bir mesaj yaz..."
              rows={1}
            />
          </div>
          <div className="flex items-center gap-2 p-1">
            <button className="p-2 text-stone-400 hover:text-stone-700 transition-colors">
              <span className="material-symbols-outlined">mood</span>
            </button>
            <button className="w-10 h-10 bg-primary-container text-white rounded-xl flex items-center justify-center hover:bg-[#8f1b1c] transition-all active:scale-95 shadow-md">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
