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
import { Bar, Chart, Line } from 'react-chartjs-2'
import {
  buildGoalsByPhaseData,
  buildGoalsPerMatchData,
  buildGoalsTrendData,
  buildMatchesAndFinalScoreData,
  buildTeamsMatchesData,
  buildWinnerTitlesData,
} from '../utils/stats'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

const options = {
  responsive: true,
  plugins: {
    legend: { labels: { color: '#cbd5e1' } },
  },
  scales: {
    x: { ticks: { color: '#cbd5e1' }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#cbd5e1' }, grid: { color: '#1e293b' } },
  },
}

const matchesScoreOptions = {
  responsive: true,
  plugins: {
    legend: { labels: { color: '#cbd5e1' } },
  },
  scales: {
    x: { ticks: { color: '#cbd5e1' }, grid: { color: '#1e293b' } },
    y: {
      position: 'left',
      title: { display: true, text: 'Matches', color: '#cbd5e1' },
      ticks: { color: '#cbd5e1' },
      grid: { color: '#1e293b' },
      beginAtZero: true,
    },
    yScore: {
      position: 'right',
      title: { display: true, text: 'Final score (goals)', color: '#cbd5e1' },
      ticks: { color: '#cbd5e1', stepSize: 1 },
      grid: { drawOnChartArea: false },
      beginAtZero: true,
    },
  },
}

const stackedOptions = {
  responsive: true,
  plugins: {
    legend: { labels: { color: '#cbd5e1' } },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: { stacked: true, ticks: { color: '#cbd5e1' }, grid: { color: '#1e293b' } },
    y: {
      stacked: true,
      title: { display: true, text: 'Goals', color: '#cbd5e1' },
      ticks: { color: '#cbd5e1' },
      grid: { color: '#1e293b' },
      beginAtZero: true,
    },
  },
}

function ResultsChart({ worldCups }) {
  return (
    <div className="space-y-6">
      <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">
          Matches Played & Final Score by Year
        </h3>
        <Chart type="bar" data={buildMatchesAndFinalScoreData(worldCups)} options={matchesScoreOptions} />
      </article>

      <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">
          Goals by Tournament Phase
        </h3>
        <p className="mb-3 text-xs text-slate-400">
          Stacked breakdown — group stage vs each knockout round. Currently seeded for 2010–2022; older tournaments will appear once their per-phase data is added.
        </p>
        <Bar data={buildGoalsByPhaseData(worldCups)} options={stackedOptions} />
      </article>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Titles by Winner</h3>
          <Bar data={buildWinnerTitlesData(worldCups)} options={options} />
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Goals per Tournament</h3>
          <Line data={buildGoalsTrendData(worldCups)} options={options} />
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Goals per Match (avg)</h3>
          <Line data={buildGoalsPerMatchData(worldCups)} options={options} />
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Teams and Matches Trend</h3>
          <Line data={buildTeamsMatchesData(worldCups)} options={options} />
        </article>
      </div>
    </div>
  )
}

export default ResultsChart
