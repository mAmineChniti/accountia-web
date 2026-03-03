'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: { month: string; revenue: number; expenses: number }[];
}

export const RevenueExpensesChart = ({ data }: Props) => {
  return (
    <div className="dark:bg-card/90 w-full rounded-lg bg-white p-4 shadow-sm">
      {/* TITRE */}
      <h2 className="mb-4 text-lg font-semibold">Monthly Stats</h2>

      {/* GRAPHIQUE */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#82ca9d"
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ff6b6b"
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
