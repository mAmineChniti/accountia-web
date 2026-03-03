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
  translations?: {
    monthlyStats?: string;
    revenue?: string;
    expenses?: string;
    noData?: string;
  };
}

export const RevenueExpensesChart = ({ data, translations }: Props) => {
  // Empty state check
  if (!data || data.length === 0) {
    return (
      <div className="dark:bg-card/90 w-full rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          {translations?.monthlyStats || 'Monthly Stats'}
        </h2>
        <div className="text-muted-foreground flex h-64 w-full items-center justify-center">
          {translations?.noData || 'No data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-card/90 w-full rounded-lg bg-white p-4 shadow-sm">
      {/* TITRE */}
      <h2 className="mb-4 text-lg font-semibold">
        {translations?.monthlyStats || 'Monthly Stats'}
      </h2>

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
              name={translations?.revenue || 'Revenue'}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ff6b6b"
              name={translations?.expenses || 'Expenses'}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
