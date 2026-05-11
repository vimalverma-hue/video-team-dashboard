import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { VideoEntry } from '../types';
import { cn } from '../lib/utils';
import { User, Tv, Tag, Calendar } from 'lucide-react';

interface CardViewProps {
  entries: any[];
  isCreative?: boolean;
}

export default function CardView({ entries, isCreative = false }: CardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {entries.map((entry, index) => {
        const status = (entry.status || '').toLowerCase();
        const label1 = isCreative ? entry.modeOfSession : entry.channel;
        const mainTitle = isCreative ? entry.mailSubjectLine : entry.subject;
        const subTitle1 = isCreative ? entry.designer : entry.editors;
        const subTitle2 = isCreative ? entry.creativeType : entry.category;

        return (
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
                  status.includes('completed') || status.includes('done') ? "bg-green-900/30 text-brand-green border-green-500/20" :
                  status.includes('working') || status.includes('progress') ? "bg-yellow-900/30 text-brand-yellow border-yellow-500/20" :
                  status.includes('rejected') || status.includes('failed') ? "bg-red-900/30 text-brand-red border-red-500/20" :
                  "bg-blue-900/30 text-blue-400 border-blue-500/20"
                )}>
                  {entry.status}
                </span>
                <span className="text-[9px] text-gray-600 font-mono">
                  {entry.timestamp?.includes('T') ? format(new Date(entry.timestamp), 'HH:mm:ss') : entry.timestamp?.toString().slice(-8)}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                 <Tv size={12} className="text-gray-500" />
                 <span className="text-white text-xs font-bold leading-none">{label1}</span>
              </div>

              <h4 className="text-gray-300 text-xs font-semibold leading-relaxed mb-4 group-hover:text-white transition-colors line-clamp-2">
                {mainTitle}
              </h4>
            </div>

            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <User size={10} />
                  <span>{subTitle1}</span>
                </div>
                <span className="px-1.5 py-0.5 bg-white/5 rounded text-gray-600 uppercase font-black tracking-tighter">
                  {subTitle2}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
