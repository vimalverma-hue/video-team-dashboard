import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'motion/react';
import { VideoEntry } from '../types';

interface ChartsSectionProps {
  data: VideoEntry[];
}

export default function ChartsSection({ data }: ChartsSectionProps) {
  // Filter and prioritize top 8 channels, group others
  const pieData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const channel = (curr.channel || 'Unknown').trim() || 'Unknown';
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length > 8) {
      const top8 = sorted.slice(0, 8);
      const othersValue = sorted.slice(8).reduce((sum, item) => sum + item.value, 0);
      return [...top8, { name: 'Others', value: othersValue }];
    }
    return sorted;
  }, [data]);

  // Aggregate monthly trend
  const trendData = useMemo(() => {
    const monthlyCounts = data.reduce((acc, curr) => {
      let monthKey = 'Unknown';
      try {
        const date = new Date(curr.timestamp);
        if (!isNaN(date.getTime())) {
          // Key format: YYYY-MM for sorting
          monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      } catch (e) {
        monthKey = 'Unknown';
      }
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyCounts)
      .filter(([key]) => key !== 'Unknown')
      .map(([monthKey, count]) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          monthKey,
          date: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
          count
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [data]);

  // Aggregate data for Editors performance
  const editorData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const editor = (curr.editors || 'Unknown').trim() || 'Unknown';
      acc[editor] = (acc[editor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data]);

  const CHART_COLORS = [
    '#00ff9f', '#3b82f6', '#ff3b3b', '#ffd93b', 
    '#a855f7', '#ec4899', '#06b6d4', '#f97316', 
    '#8b5cf6', '#10b981', '#71717a'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Daily Upload Trend */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[#151515]/60 backdrop-blur-lg border border-white/5 p-4 rounded-2xl shadow-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Productivity Trend</h3>
          <span className="text-[10px] text-brand-green font-bold">Trend Analysis</span>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#151515', border: '1px solid #333', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '11px' }}
              />
              <Bar dataKey="count" fill="#ff3b3b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Channel Distribution */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[#151515]/60 backdrop-blur-lg border border-white/5 p-4 rounded-2xl shadow-xl"
      >
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Channel distribution</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="40%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#151515', border: '1px solid #333', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '11px' }}
              />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                iconType="circle"
                formatter={(value) => <span className="text-[10px] text-gray-400 uppercase font-bold">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Editors */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 bg-[#151515]/60 backdrop-blur-lg border border-white/5 p-4 rounded-2xl shadow-xl"
      >
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Top Editors Performance</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={editorData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                width={80}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#151515', border: '1px solid #333', borderRadius: '12px' }}
              />
              <Bar dataKey="value" fill="#ff3b3b" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
