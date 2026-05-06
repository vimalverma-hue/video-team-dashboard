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
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Aggregate data for Editors performance
  const editorCounts = data.reduce((acc, curr) => {
    acc[curr.editors] = (acc[curr.editors] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const editorData = Object.entries(editorCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Aggregate daily trend
  const dailyCounts = data.reduce((acc, curr) => {
    // Extract date from timestamp (assuming it's a date string like "Date(2023,10,24)")
    // or standard ISO. The Visualization API often returns "Date(Y, M, D)"
    let dateStr = 'Unknown';
    if (typeof curr.timestamp === 'string' && curr.timestamp.includes('Date')) {
      const parts = curr.timestamp.match(/\d+/g);
      if (parts) dateStr = `${parts[1]}/${parts[2]}`; // Month/Day
    } else {
      dateStr = new Date(curr.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lineData = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  const COLORS = {
    Completed: '#00ff9f',
    Pending: '#ffd93b',
    Urgent: '#ff3b3b',
    Other: '#3b82f6'
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
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Weekly Upload Trend</h3>
          <span className="text-[10px] text-brand-green font-bold">+12% vs last week</span>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151515', border: '1px solid #333', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="count" stroke="#ff3b3b" strokeWidth={3} dot={{ fill: '#ff3b3b', r: 4 }} activeDot={{ r: 6 }} />
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
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
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
          <div className="flex flex-col gap-3 pr-4">
             {pieData.map((entry, idx) => (
               <div key={idx} className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (COLORS as any)[entry.name] || COLORS.Other }} />
                 <span className="text-[10px] text-gray-500 font-bold uppercase">{entry.name}</span>
               </div>
             ))}
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
