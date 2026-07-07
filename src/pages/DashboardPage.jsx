import { useState, useEffect } from 'react'
import { getExpenses } from '../api/expenses'
import { TrendingUp, Receipt, Tag } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon size={15} className="text-gray-400" />
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-md px-3 py-2 text-xs shadow-sm">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900">
        ${Number(payload[0].value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getExpenses()
      .then(({ data }) => setExpenses(data))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()

  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const totalThisMonth = thisMonth.reduce((s, e) => s + Number(e.amount), 0)

  const chartData = MONTHS.map((name, i) => ({
    name,
    total: expenses
      .filter(e => {
        const d = new Date(e.date)
        return d.getMonth() === i && d.getFullYear() === now.getFullYear()
      })
      .reduce((s, e) => s + Number(e.amount), 0),
  }))

  const categoryCount = {}
  expenses.forEach(e => {
    if (e.category) categoryCount[e.category.name] = (categoryCount[e.category.name] || 0) + 1
  })
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const recent = expenses.slice(0, 6)

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-400 text-sm">
        <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
        Cargando...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-7">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-0.5">Resumen de tus finanzas</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total este mes"
          value={`$${totalThisMonth.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Gastos este mes"
          value={thisMonth.length}
          icon={Receipt}
        />
        <StatCard
          label="Categoría principal"
          value={topCategory}
          icon={Tag}
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-5">
          Gastos por mes — {now.getFullYear()}
        </p>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartData} barSize={24} margin={{ top: 0, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v.toLocaleString('es-AR')}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="total" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Últimos gastos</p>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-gray-400 text-sm">
            Todavía no registraste gastos
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(e => (
              <div key={e.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-800">
                    {e.description || <span className="text-gray-400 italic">Sin descripción</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {e.category?.name ?? 'Sin categoría'} · {e.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {e.currency?.symbol}{Number(e.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    e.type === 'PERSONAL'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {e.type === 'PERSONAL' ? 'Personal' : 'Trabajo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
