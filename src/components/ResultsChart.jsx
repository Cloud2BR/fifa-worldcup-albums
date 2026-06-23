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
import { buildGoalsTrendData, buildTeamsMatchesData, buildWinnerTitlesData } from '../utils/stats'

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

function ResultsChart({ worldCups }) {
  return (
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
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Teams and Matches Trend</h3>
        <Line data={buildTeamsMatchesData(worldCups)} options={options} />
      </article>
    </div>
  )
}

export default ResultsChart
