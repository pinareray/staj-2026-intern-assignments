export default function ServerSidebar() {
  return (
    <aside className="w-20 flex flex-col items-center py-6 space-y-6 border-r border-stone-200 bg-mahogany-dark shrink-0">
      {/* micodex logo */}
      <div className="relative group cursor-pointer">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container p-0.5 transition-transform duration-300 group-hover:scale-110 bg-white flex items-center justify-center">
          <span className="font-libre text-lg text-primary-container font-bold leading-none">
            m
          </span>
        </div>
      </div>

      <div className="w-10 h-px bg-stone-300 mx-auto" />

      <div className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center cursor-pointer transition-all duration-300 hover:rounded-xl hover:bg-primary-container/10 group shadow-sm">
          <span className="material-symbols-outlined text-stone-500 group-hover:text-primary-container">
            forum
          </span>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center cursor-pointer transition-all duration-300 hover:rounded-xl hover:bg-primary-container/10 group shadow-sm">
          <span className="material-symbols-outlined text-stone-500 group-hover:text-primary-container">
            groups
          </span>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center cursor-pointer transition-all duration-300 hover:rounded-xl hover:bg-primary-container/10 group shadow-sm">
          <span className="material-symbols-outlined text-stone-500 group-hover:text-primary-container">
            auto_stories
          </span>
        </div>

        <div className="w-12 h-12 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:border-primary-container/60 transition-colors bg-white/50">
          <span className="material-symbols-outlined text-stone-400">add</span>
        </div>
      </div>
    </aside>
  );
}
