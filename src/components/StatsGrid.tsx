import React from 'react';
import { motion } from 'motion/react';
import { Video, CheckCircle2, XCircle, Pause, Layout, Users, Tv } from 'lucide-react';
import { DashboardStats } from '../types';
import { cn } from '../lib/utils';

interface StatsGridProps {
  stats: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const cards = [
    { label: 'Total Videos', value: stats.totalVideos, icon: Video, color: 'text-white' },
    { label: 'Completed', value: stats.completedCount, icon: CheckCircle2, color: 'text-[#00ff9f]' },
    { label: 'In Progress', value: stats.workingCount, icon: Layout, color: 'text-[#ffd93b]' },
    { label: 'Rejected', value: stats.rejectedCount, icon: XCircle, color: 'text-[#ff3b3b]' },
    { label: 'On Hold', value: stats.onHoldCount, icon: Pause, color: 'text-blue-400' },
    { label: 'Channels', value: stats.channelsCount, icon: Tv, color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#111] p-4 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between h-24 group hover:border-white/10 transition-colors shadow-lg"
        >
          <div className="flex justify-between items-start">
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{card.label}</p>
            <card.icon size={14} className={cn("opacity-50 group-hover:opacity-100 transition-opacity", card.color)} />
          </div>
          <h3 className={cn("text-2xl font-bold tracking-tight", card.color)}>{card.value}</h3>
          <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
        </motion.div>
      ))}
    </div>
  );
}
