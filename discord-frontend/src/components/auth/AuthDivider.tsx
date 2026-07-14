export default function AuthDivider() {
  return (
    <div className="relative flex items-center py-2">
      <div className="flex-1 border-t border-outline-variant/20" />
      <span className="px-4 text-[10px] uppercase tracking-[0.25em] text-on-surface-variant/60 font-hanken">
        Or
      </span>
      <div className="flex-1 border-t border-outline-variant/20" />
    </div>
  );
}
