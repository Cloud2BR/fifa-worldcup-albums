import albums from '../data/albums.json'
import worldCups from '../data/worldcups.json'
import StatCard from '../components/StatCard'
import Timeline from '../components/Timeline'
import { buildQuickStats, mergeTimelineData } from '../utils/stats'

function Home() {
  const stats = buildQuickStats(worldCups, albums)
  const timeline = mergeTimelineData(worldCups, albums).slice(-8)

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
        <p className="text-sm uppercase tracking-wide text-sky-300">Historical archive</p>
        <h2 className="mt-2 text-3xl font-bold text-white">FIFA World Cup Results and Sticker Albums</h2>
        <p className="mt-3 max-w-3xl text-slate-300">
          Explore every FIFA World Cup tournament and browse official album cover history in one place.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tournaments" value={stats.tournaments} />
        <StatCard label="Unique Winners" value={stats.uniqueWinners} />
        <StatCard label="Total Goals" value={stats.totalGoals} />
        <StatCard label="Albums Catalogued" value={stats.albums} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Scrollable Tournament Timeline</h3>
        <Timeline items={timeline} />
      </section>
    </div>
  )
}

export default Home
