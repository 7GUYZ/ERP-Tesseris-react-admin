import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const DashboardModal = ({ isOpen, onClose, title, data, chartType = 'bar' }) => {
  if (!isOpen) return null;

  // 차트 색상 배열
  const chartColors = [
    '#3b7ddd', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'
  ];

  const formatValue = (value) => {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K';
    return value.toLocaleString();
  };

  const renderChart = () => {
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${formatValue(value)}`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatValue(value)} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barCategoryGap={20}
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 14, fill: '#3b7ddd', fontWeight: 700 }}
            axisLine={{ stroke: '#e5eaf2' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#222e3c', fontWeight: 600 }}
            axisLine={{ stroke: '#e5eaf2' }}
            tickLine={false}
            tickFormatter={formatValue}
          />
          <Tooltip
            contentStyle={{ 
              background: '#fff', 
              border: '1px solid #e5eaf2', 
              borderRadius: 8, 
              fontSize: 13, 
              color: '#222e3c' 
            }}
            formatter={(value) => formatValue(value)}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="rect"
            wrapperStyle={{ fontSize: 13, color: '#3b7ddd', fontWeight: 600 }}
          />
          <Bar
            dataKey="value"
            fill={chartColors[0]}
            radius={[8, 8, 0, 0]}
            label={{ position: 'top', fill: '#222e3c', fontWeight: 700, fontSize: 12 }}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div className="dashboard-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-modal-header">
          <h2 className="dashboard-modal-title">{title}</h2>
          <button className="dashboard-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="dashboard-modal-body">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default DashboardModal; 