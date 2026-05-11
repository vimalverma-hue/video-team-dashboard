import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'motion/react';
import { VideoEntry } from '../types';

interface ChartsSectionProps {
  data: any[];
  isCreative?: boolean;
}

export default function ChartsSection({ data, isCreative = false }: ChartsSectionProps) {
  // Filter and prioritize top 8 items, group others
  const pieData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const field = isCreative 
        ? (curr.vertical || 'Unknown') 
        : (curr.channel || 'Unknown');
      const label = field.trim() || 'Unknown';
      const count = isCreative ? (parseInt(curr.creativesCount, 10) || 0) : 1;
      acc[label] = (acc[label] || 0) + count;
      return acc;
    }, {} as Record<string, number>);

    let sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length > 8) {
      const top8 = sorted.slice(0, 8);
      const othersValue = sorted.slice(8).reduce((sum, item) => sum + item.value, 0);
      return [...top8, { name: 'Others', value: othersValue }];
    }
    return sorted;
  }, [data, isCreative]);

  // Aggregate monthly trend
  const trendData = useMemo(() => {
    const monthlyCounts = data.reduce((acc, curr) => {
      let monthKey = 'Unknown';
      try {
        const date = new Date(curr.timestamp);
        if (!isNaN(date.getTime())) {
          monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      } catch (e) {
        monthKey = 'Unknown';
      }
      const count = isCreative ? (parseInt(curr.creativesCount, 10) || 0) : 1;
      acc[monthKey] = (acc[monthKey] || 0) + count;
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

  // Aggregate data for Performers (Completed only)
  const performerData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const status = (curr.status || '').toLowerCase();
      if (!status.includes('completed') && !status.includes('done')) return acc;
      
      const performer = isCreative 
        ? (curr.designer || 'Others')
        : (curr.category || 'Others');
      
      const label = performer.trim() || 'Others';
      const count = isCreative ? (parseInt(curr.creativesCount, 10) || 0) : 1;
      acc[label] = (acc[label] || 0) + count;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [data, isCreative]);

  const CHART_COLORS = [
    '#00ff9f', '#3b82f6', '#ff3b3b', '#ffd93b', 
    '#a855f7', '#ec4899', '#06b6d4', '#f97316', 
    '#8b5cf6', '#10b981', '#71717a'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Productivity Trend */}
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

      {/* Distribution */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[#151515]/60 backdrop-blur-lg border border-white/5 p-4 rounded-2xl shadow-xl"
      >
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">
          {isCreative ? 'Verticals' : 'Channel'} Distribution
        </h3>
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

      {/* Performance Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 bg-[#151515]/60 backdrop-blur-lg border border-white/5 p-4 rounded-2xl shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
              {isCreative ? 'Designer Portfolio' : 'All Categories'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-medium">
              Completed {isCreative ? 'creative' : 'video'} counts
            </p>
          </div>
          <div className="bg-brand-red/10 px-2 py-1 rounded border border-brand-red/20">
            <span className="text-[10px] text-brand-red font-bold uppercase">Work Distribution</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {performerData.length > 0 ? performerData.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col justify-between group transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate pr-2" title={item.name}>
                  {item.name}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-red group-hover:shadow-[0_0_8px_rgba(255,59,59,0.8)]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white tracking-tighter">{item.value.toLocaleString()}</span>
                <span className="text-[9px] text-brand-green font-bold uppercase">
                  {isCreative ? 'Items' : 'Videos'}
                </span>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
              <span className="text-xs text-gray-500">No completed data found</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
