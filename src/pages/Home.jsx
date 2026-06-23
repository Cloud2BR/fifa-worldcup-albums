import albums from '../data/albums.json'
import worldCups from '../data/worldcups.json'
import StatCard from '../components/StatCard'
import Timeline from '../components/Timeline'
import { buildQuickStats, mergeTimelineData } from '../utils/stats'

function Home() {
  const stats = buildQuickStats(worldCups, albums)
  const timeline = mergeTimelineData(worldCups, albums).slice(-8).reverse()

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 p-8">
        {/* Decorative ball rings */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-sky-500/20" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full border border-sky-500/15" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full border border-sky-500/10" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-300">
            ⚽ Historical archive
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white">
            FIFA World Cup<br />
            <span className="text-sky-400">Results &amp; Sticker Albums</span>
          </h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            Explore every FIFA World Cup tournament from 1930 to 2022 — results, goals, and the iconic
            official Panini sticker album covers, all in one place.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#/albums" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
              Browse Albums →
            </a>
            <a href="#/worldcups" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-500 hover:text-sky-300">
              View Results
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Tournaments" value={stats.tournaments} />
        <StatCard label="Unique Winners" value={stats.uniqueWinners} />
        <StatCard label="Total Goals" value={stats.totalGoals.toLocaleString()} />
        <StatCard label="Goals / Match" value={stats.goalsPerMatch} helper={`across ${stats.totalMatches} matches`} />
        <StatCard label="Albums Catalogued" value={stats.albums} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Recent Tournament Timeline</h3>
        <Timeline items={timeline} />
      </section>
    </div>
  )
}

export default Home
