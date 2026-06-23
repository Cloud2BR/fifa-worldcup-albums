function StatCard({ label, value, helper }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-sky-700">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </article>
  )
}

export default StatCard
