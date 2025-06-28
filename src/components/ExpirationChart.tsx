
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatutoryParameter } from '@/pages/Index';

interface ExpirationChartProps {
  parameters: StatutoryParameter[];
}

export const ExpirationChart = ({ parameters }: ExpirationChartProps) => {
  // Group parameters by status for the chart
  const chartData = [
    {
      name: 'Valid',
      count: parameters.filter(p => p.status === 'valid').length,
      color: '#10B981'
    },
    {
      name: 'Expiring Soon',
      count: parameters.filter(p => p.status === 'warning').length,
      color: '#F59E0B'
    },
    {
      name: 'Expired',
      count: parameters.filter(p => p.status === 'expired').length,
      color: '#EF4444'
    }
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
