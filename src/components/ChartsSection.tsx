import React from 'react';
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
  // Aggregate data for Status distribution
  const statusCounts = data.reduce((acc, curr) => {
    // Filter out durations that might have leaked as status
    if (/^\d+:\d+/.test(curr.status)) return acc;
    
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter pie data to only main statuses + top others to prevent legend overflow
  const mainStatuses = ['Completed', 'Working on it', 'Video rejected', 'Hold by owner'];
  const pieData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const topPieData = pieData.filter(d => 
    mainStatuses.includes(d.name) || 
    (d.value > data.length * 0.03 && !/^\d+:\d+/.test(d.name))
  ).slice(0, 8);

  // Aggregate data for Editors performance
  const editorCounts = data.reduce((acc, curr) => {
    acc[curr.editors] = (acc[curr.editors] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const editorData = Object.entries(editorCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Aggregate daily/weekly trend
  const dailyCounts = data.reduce((acc, curr) => {
    let dateStr = 'Unknown';
    try {
      const date = new Date(curr.timestamp);
      if (!isNaN(date.getTime())) {
        // Use a more predictable date string for sorting
        dateStr = date.toISOString().split('T')[0];
      }
    } catch (e) {
      dateStr = 'Unknown';
    }
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let trendData = Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
    
  // If too many points, aggregate by week for smoother visualization
  if (trendData.length > 60) {
    const weeklyData: Record<string, number> = {};
    trendData.forEach(d => {
       const date = new Date(d.date);
       const week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
       weeklyData[week] = (weeklyData[week] || 0) + d.count;
    });
    trendData = Object.entries(weeklyData).map(([date, count]) => ({ 
      date: date.replace('-W', ' Week '), 
      count 
    })).slice(-26); // show last 6 months Approx
  } else {
    // Format dates for display
    trendData = trendData.map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
  }

  const COLORS = {
    'Completed': '#00ff9f',
    'Working on it': '#ffd93b',
    'Video rejected': '#ff3b3b',
    'Hold by owner': '#3b82f6',
    'Other': '#71717a'
  };

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
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151515', border: '1px solid #333', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="count" stroke="#ff3b3b" strokeWidth={2} dot={trendData.length < 30} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Status Distribution */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[#151515]/60 backdrop-blur-lg border border-white/5 p-4 rounded-2xl shadow-xl"
      >
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Status Distribution</h3>
        <div className="h-[250px] w-full flex items-center justify-between">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {topPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || COLORS.Other} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151515', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 pr-4 overflow-y-auto max-h-[220px]">
             {topPieData.map((entry, idx) => (
               <div key={idx} className="flex items-center gap-2 max-w-[150px]">
                 <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: (COLORS as any)[entry.name] || COLORS.Other }} />
                 <span className="text-[10px] text-gray-500 font-bold uppercase truncate">{entry.name}</span>
               </div>
             ))}
             {pieData.length > topPieData.length && (
               <span className="text-[9px] text-gray-700 italic">+{pieData.length - topPieData.length} more...</span>
             )}
          </div>
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
