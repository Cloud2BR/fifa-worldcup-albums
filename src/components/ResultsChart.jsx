import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import {
  buildContinentalRivalryData,
  buildCumulativeTitlesData,
  buildFinalMarginsData,
  buildFinalsAppearancesData,
  buildGoalsPerMatchData,
} from '../utils/stats'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

const axisColor = '#cbd5e1'
const gridColor = 'rgba(51, 65, 85, 0.55)'

const legendTheme = {
  position: 'top',
  labels: {
    color: axisColor,
    usePointStyle: true,
    pointStyle: 'rectRounded',
    boxWidth: 14,
    boxHeight: 8,
    padding: 14,
  },
}

const tooltipTheme = {
  backgroundColor: '#020617',
  borderColor: '#334155',
  borderWidth: 1,
  titleColor: '#e2e8f0',
  bodyColor: '#cbd5e1',
  padding: 10,
}

const baseScales = {
  x: {
    ticks: { color: axisColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 14 },
    grid: { color: gridColor },
  },
  y: {
    ticks: { color: axisColor },
    grid: { color: gridColor },
    beginAtZero: true,
  },
}

// ── Chart option presets ────────────────────────────────────────────────────

const cumulativeOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { ...legendTheme, position: 'right' },
    tooltip: tooltipTheme,
  },
  scales: {
    x: {
      ...baseScales.x,
      ticks: { ...baseScales.x.ticks, maxRotation: 45, minRotation: 45, maxTicksLimit: 22 },
    },
    y: {
      ...baseScales.y,
      ticks: { ...baseScales.y.ticks, stepSize: 1 },
      title: { display: true, text: 'Cumulative titles', color: axisColor },
      max: 6,
    },
  },
  elements: {
    line: { borderWidth: 2.5, tension: 0 },
    point: { radius: 3, hoverRadius: 7, hitRadius: 8 },
  },
}

const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: legendTheme, tooltip: tooltipTheme },
  scales: {
    x: {
      stacked: true,
      ticks: { color: axisColor, stepSize: 1 },
      grid: { color: gridColor },
      beginAtZero: true,
    },
    y: {
      stacked: true,
      ticks: { color: axisColor, font: { size: 11 } },
      grid: { color: gridColor },
    },
  },
}

const finalMarginsOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltipTheme,
      callbacks: {
        title: ([ctx]) => `${ctx.label} Final`,
        label: (ctx) =>
          ctx.raw === 0
            ? 'Decided by penalty shootout'
            : `Goal difference: ${ctx.raw}`,
      },
    },
  },
  scales: {
    x: {
      ...baseScales.x,
      ticks: { ...baseScales.x.ticks, maxRotation: 45, minRotation: 45 },
    },
    y: {
      ...baseScales.y,
      ticks: { ...baseScales.y.ticks, stepSize: 1 },
      title: { display: true, text: 'Goal diff', color: axisColor },
      max: 5,
    },
  },
}

const goalsPerMatchOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: legendTheme, tooltip: tooltipTheme },
  scales: {
    x: {
      ...baseScales.x,
      ticks: { ...baseScales.x.ticks, maxRotation: 45, minRotation: 45 },
    },
    y: {
      ...baseScales.y,
      ticks: { ...baseScales.y.ticks },
      title: { display: true, text: 'Goals / match', color: axisColor },
      suggestedMax: 6,
    },
  },
  elements: {
    line: { borderWidth: 2.5, tension: 0.3 },
    point: { radius: 3, hoverRadius: 6, hitRadius: 8 },
  },
}

const groupedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: legendTheme, tooltip: tooltipTheme },
  scales: {
    ...baseScales,
    y: { ...baseScales.y, ticks: { ...baseScales.y.ticks, stepSize: 1 } },
  },
}

// ── Legend chip component ───────────────────────────────────────────────────

function LegendChip({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-slate-300">{label}</span>
    </span>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

function ResultsChart({ worldCups }) {
  const completedWorldCups = worldCups.filter(
    (cup) => cup.winner !== 'In Progress' && cup.finalScore !== 'TBD',
  )

  return (
    <div className="space-y-6">

      {/* 1 ─ Title Race Through History */}
      <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Title Race Through History</h3>
        <p className="mt-0.5 mb-4 text-xs text-slate-400">
          Cumulative World Cup titles per nation at each tournament — trace which country led at any point in time.
        </p>
        <div className="h-[360px]">
          <Line data={buildCumulativeTitlesData(completedWorldCups)} options={cumulativeOptions} />
        </div>
      </article>

      {/* 2 ─ Finals Appearances + Final Margins */}
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Finals Appearances by Nation</h3>
          <p className="mt-0.5 mb-4 text-xs text-slate-400">
            Total World Cup final appearances — champions (gold) vs runners-up (grey). West Germany and Germany merged.
          </p>
          <div className="h-[360px]">
            <Bar data={buildFinalsAppearancesData(completedWorldCups)} options={horizontalBarOptions} />
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Final Match Drama by Year</h3>
          <p className="mt-0.5 mb-3 text-xs text-slate-400">
            Goal difference in each final — how decisive was the match?
          </p>
          <div className="mb-3 flex flex-wrap gap-3">
            <LegendChip color="rgba(34,197,94,0.85)" label="Dominant win (2+ goals)" />
            <LegendChip color="rgba(56,189,248,0.85)" label="Close (1 goal)" />
            <LegendChip color="rgba(251,191,36,0.85)" label="Penalty shootout" />
          </div>
          <div className="h-[310px]">
            <Bar data={buildFinalMarginsData(completedWorldCups)} options={finalMarginsOptions} />
          </div>
        </article>
      </div>

      {/* 3 ─ Goals/Match Trend + Continental Rivalry */}
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Scoring Trend — Goals per Match</h3>
          <p className="mt-0.5 mb-4 text-xs text-slate-400">
            Average goals per game across all matches — the 1950s high-scoring era vs modern tactical football.
          </p>
          <div className="h-[280px]">
            <Line data={buildGoalsPerMatchData(completedWorldCups)} options={goalsPerMatchOptions} />
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-200">UEFA vs CONMEBOL — Dominance by Decade</h3>
          <p className="mt-0.5 mb-4 text-xs text-slate-400">
            World Cup wins per decade, split by confederation — Europe vs South America's historic rivalry.
          </p>
          <div className="h-[280px]">
            <Bar data={buildContinentalRivalryData(completedWorldCups)} options={groupedBarOptions} />
          </div>
        </article>
      </div>

    </div>
  )
}

export default ResultsChart


