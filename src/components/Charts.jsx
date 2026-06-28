import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#2563eb', '#64748b', '#0f766e', '#f59e0b'];

export function SpendChart({ data }) {
  return (
    <div className="h-72 min-w-0 w-full">
      <ResponsiveContainer minWidth={260} minHeight={240}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="direct" stackId="1" stroke="#2563eb" fill="#bfdbfe" />
          <Area type="monotone" dataKey="indirect" stackId="1" stroke="#64748b" fill="#cbd5e1" />
          <Area type="monotone" dataKey="services" stackId="1" stroke="#0f766e" fill="#99f6e4" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RfqPieChart({ data }) {
  return (
    <div className="h-72 min-w-0 w-full">
      <ResponsiveContainer minWidth={260} minHeight={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersChart({ data }) {
  return (
    <div className="h-72 min-w-0 w-full">
      <ResponsiveContainer minWidth={260} minHeight={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="week" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Legend />
          <Bar dataKey="created" fill="#2563eb" radius={[4, 4, 0, 0]} />
          <Bar dataKey="fulfilled" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
