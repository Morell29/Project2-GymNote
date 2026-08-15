import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: '13px',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: 500 }}>
            {p.name}: {p.value} {p.payload.unit}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ProgressChart({ data, dataKey = 'maxWeight', color = 'var(--accent)', name = 'Berat Maks' }) {
  if (!data || data.length < 2) {
    return (
      <div className="empty-state" style={{ padding: '24px' }}>
        <span style={{ fontSize: '1.5rem', opacity: 0.2 }}>📊</span>
        <p className="text-xs text-muted text-center">Butuh minimal 2 sesi untuk menampilkan grafik</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Inter' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Inter' }}
          tickLine={false}
          axisLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          dot={{ fill: color, r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: color, stroke: 'var(--bg-card)', strokeWidth: 2 }}
          name={name}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
