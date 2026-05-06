import React from 'react';
import { motion } from 'motion/react';
import { VideoEntry } from '../types';
import { cn } from '../lib/utils';
import { User, Tv, Tag, Calendar } from 'lucide-react';

interface CardViewProps {
  entries: VideoEntry[];
}

export default function CardView({ entries }: CardViewProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'border-[#00ff9f] shadow-[#00ff9f]/5';
      case 'pending': return 'border-[#ffd93b] shadow-[#ffd93b]/5';
      case 'urgent': return 'border-[#ff3b3b] shadow-[#ff3b3b]/5';
      default: return 'border-zinc-700';
    }
  };

  const getBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-[#00ff9f] text-black';
      case 'pending': return 'bg-[#ffd93b] text-black';
      case 'urgent': return 'bg-[#ff3b3b] text-white';
      default: return 'bg-zinc-700 text-zinc-300';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {entries.map((entry, index) => (
        <motion.div
          key={`${entry.timestamp}-${index}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02 }}
          className={cn(
            "bg-[#151515]/60 backdrop-blur-lg border border-white/5 rounded-xl p-4 flex flex-col justify-between group hover:border-white/10 transition-all duration-300 shadow-xl",
          )}
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className={cn(
                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                entry.status.toLowerCase() === 'completed' ? "bg-green-900/30 text-brand-green border-green-500/20" :
                entry.status.toLowerCase() === 'urgent' ? "bg-red-900/30 text-brand-red border-red-500/20" :
                "bg-yellow-900/30 text-brand-yellow border-yellow-500/20"
              )}>
                {entry.status}
              </span>
              <span className="text-[9px] text-gray-600 font-mono">
                {entry.timestamp.toString().slice(-8)}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
               <Tv size={12} className="text-gray-500" />
               <span className="text-white text-xs font-bold leading-none">{entry.channel}</span>
            </div>

            <h4 className="text-gray-300 text-xs font-semibold leading-relaxed mb-4 group-hover:text-white transition-colors">
              {entry.subject}
            </h4>
          </div>

          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-gray-500">
                <User size={10} />
                <span>{entry.editors}</span>
              </div>
              <span className="px-1.5 py-0.5 bg-white/5 rounded text-gray-600 uppercase font-black tracking-tighter">
                {entry.category}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
