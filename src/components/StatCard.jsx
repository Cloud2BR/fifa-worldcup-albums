function StatCard({ label, value, helper, onClick, isActive = false }) {
  const Component = onClick ? 'button' : 'article'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'w-full rounded-xl border bg-slate-900 p-5 text-left transition',
        onClick ? 'cursor-pointer hover:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40' : '',
        isActive ? 'border-sky-500/70 ring-1 ring-sky-500/30' : 'border-slate-800',
      ].join(' ')}
      aria-pressed={onClick ? isActive : undefined}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
      {onClick ? <p className="mt-3 text-[11px] text-sky-400/90">Click for details</p> : null}
    </Component>
  )
}

export default StatCard
