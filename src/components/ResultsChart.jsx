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

const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: legendTheme,
    tooltip: tooltipTheme,
  },
  scales: {
    x: {
      ticks: { color: axisColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      grid: { color: gridColor },
    },
    y: {
      ticks: { color: axisColor },
      grid: { color: gridColor },
      beginAtZero: true,
    },
  },
  elements: {
    line: { borderWidth: 3, tension: 0.25 },
    point: { radius: 2, hoverRadius: 5, hitRadius: 8 },
  },
}

const matchesScoreOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: legendTheme,
    tooltip: tooltipTheme,
  },
  scales: {
    x: {
      ticks: { color: axisColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      grid: { color: gridColor },
    },
    y: {
      position: 'left',
      title: { display: true, text: 'Matches', color: axisColor },
      ticks: { color: axisColor },
      grid: { color: gridColor },
      beginAtZero: true,
      suggestedMax: 70,
    },
    yScore: {
      position: 'right',
      title: { display: true, text: 'Final score (goals)', color: axisColor },
      ticks: { color: axisColor, stepSize: 1 },
      grid: { drawOnChartArea: false },
      beginAtZero: true,
      max: 6,
    },
  },
  elements: {
    line: { borderWidth: 3, tension: 0.25 },
    point: { radius: 3, hoverRadius: 5, hitRadius: 8 },
  },
}

const stackedOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: legendTheme,
    tooltip: tooltipTheme,
  },
  scales: {
    x: {
      stacked: true,
      ticks: { color: axisColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      grid: { color: gridColor },
    },
    y: {
      stacked: true,
      title: { display: true, text: 'Goals', color: axisColor },
      ticks: { color: axisColor },
      grid: { color: gridColor },
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
        <div className="h-[420px]">
          <Chart type="bar" data={buildMatchesAndFinalScoreData(worldCups)} options={matchesScoreOptions} />
        </div>
      </article>

      <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">
          Goals by Tournament Phase
        </h3>
        <p className="mb-3 text-xs text-slate-400">
          Stacked breakdown — group stage vs each knockout round. Currently seeded for 2010–2022; older tournaments will appear once their per-phase data is added.
        </p>
        <div className="h-[320px]">
          <Bar data={buildGoalsByPhaseData(worldCups)} options={stackedOptions} />
        </div>
      </article>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Titles by Winner</h3>
          <div className="h-[300px]">
            <Bar data={buildWinnerTitlesData(worldCups)} options={options} />
          </div>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Goals per Tournament</h3>
          <div className="h-[300px]">
            <Line data={buildGoalsTrendData(worldCups)} options={options} />
          </div>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Goals per Match (avg)</h3>
          <div className="h-[300px]">
            <Line data={buildGoalsPerMatchData(worldCups)} options={options} />
          </div>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Teams and Matches Trend</h3>
          <div className="h-[360px]">
            <Line data={buildTeamsMatchesData(worldCups)} options={options} />
          </div>
        </article>
      </div>
    </div>
  )
}

export default ResultsChart
