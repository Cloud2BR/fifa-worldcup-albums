import { useMemo, useState } from 'react'
import albums from '../data/albums.json'
import worldCups from '../data/worldcups.json'
import StatCard from '../components/StatCard'
import Timeline from '../components/Timeline'
import { buildQuickStats, mergeTimelineData } from '../utils/stats'

function Home() {
  const stats = buildQuickStats(worldCups, albums)
  const timeline = mergeTimelineData(worldCups, albums).slice().reverse()
  const [activeStat, setActiveStat] = useState('tournaments')

  const tournamentYears = useMemo(
    () => worldCups.map((cup) => cup.year).sort((a, b) => a - b),
    [],
  )
  const albumYears = useMemo(
    () => albums.map((album) => album.year).sort((a, b) => a - b),
    [],
  )
  const uniqueWinners = useMemo(
    () => [...new Set(worldCups.map((cup) => cup.winner))].sort(),
    [],
  )

  const statDetails = {
    tournaments: {
      title: 'Why 22 tournaments?',
      body:
        'This app includes every FIFA World Cup actually played from 1930 to 2022. There are 22 editions because the 1942 and 1946 tournaments were canceled due to World War II.',
      bullets: [
        `Included years: ${tournamentYears.join(', ')}`,
        'Missing years in that period: 1942 and 1946 (canceled)',
      ],
    },
    winners: {
      title: 'How unique winners are counted',
      body:
        'This number counts distinct winner names across all tournaments in the dataset.',
      bullets: [
        `Teams counted: ${uniqueWinners.join(', ')}`,
        'Note: West Germany and Germany appear as separate historical names in this dataset.',
      ],
    },
    goals: {
      title: 'How total goals is calculated',
      body:
        'Total goals is the sum of the full-tournament goals field across all 22 World Cups.',
      bullets: [
        `Formula: sum of goals from 1930 to 2022 = ${stats.totalGoals.toLocaleString()}`,
      ],
    },
    gpm: {
      title: 'How goals per match is calculated',
      body:
        'Goals per match is the tournament-wide average across all matches in the dataset.',
      bullets: [
        `Formula: ${stats.totalGoals.toLocaleString()} goals / ${stats.totalMatches} matches = ${stats.goalsPerMatch}`,
      ],
    },
    albums: {
      title: 'Why 22 albums catalogued',
      body:
        'The album archive currently has one catalogued album entry for each tournament edition in the app.',
      bullets: [
        `Album years: ${albumYears.join(', ')}`,
      ],
    },
  }

  const activeDetail = statDetails[activeStat]

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
        <StatCard
          label="Tournaments"
          value={stats.tournaments}
          onClick={() => setActiveStat('tournaments')}
          isActive={activeStat === 'tournaments'}
        />
        <StatCard
          label="Unique Winners"
          value={stats.uniqueWinners}
          onClick={() => setActiveStat('winners')}
          isActive={activeStat === 'winners'}
        />
        <StatCard
          label="Total Goals"
          value={stats.totalGoals.toLocaleString()}
          onClick={() => setActiveStat('goals')}
          isActive={activeStat === 'goals'}
        />
        <StatCard
          label="Goals / Match"
          value={stats.goalsPerMatch}
          helper={`across ${stats.totalMatches} matches`}
          onClick={() => setActiveStat('gpm')}
          isActive={activeStat === 'gpm'}
        />
        <StatCard
          label="Albums Catalogued"
          value={stats.albums}
          onClick={() => setActiveStat('albums')}
          isActive={activeStat === 'albums'}
        />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <h3 className="text-sm font-semibold text-slate-100">{activeDetail.title}</h3>
        <p className="mt-2 text-sm text-slate-300">{activeDetail.body}</p>
        <ul className="mt-3 space-y-1 text-xs text-slate-400">
          {activeDetail.bullets.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Winners Tournament Timeline</h3>
        <Timeline items={timeline} />
      </section>
    </div>
  )
}

export default Home
