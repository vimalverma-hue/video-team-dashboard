import React from 'react';
import { motion } from 'motion/react';
import { CreativeEntry } from '../types';
import { cn } from '../lib/utils';
import { User } from 'lucide-react';

interface CreativeDataTableProps {
  entries: CreativeEntry[];
}

export default function CreativeDataTable({ entries }: CreativeDataTableProps) {
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('done')) return 'bg-[#00ff9f]/10 text-[#00ff9f] border-[#00ff9f]/20';
    if (s.includes('working') || s.includes('progress')) return 'bg-[#ffd93b]/10 text-[#ffd93b] border-[#ffd93b]/20';
    if (s.includes('rejected') || s.includes('failed')) return 'bg-[#ff3b3b]/10 text-[#ff3b3b] border-[#ff3b3b]/20';
    if (s.includes('hold')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#151515]/40 backdrop-blur-lg">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-[#1a1a1a] text-gray-500 uppercase text-[9px] border-b border-white/5 font-bold tracking-wider">
          <tr>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Mode</th>
            <th className="px-4 py-3">Vertical</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Count</th>
            <th className="px-4 py-3">Designer</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {entries.map((entry, index) => (
            <motion.tr 
              key={`${entry.timestamp}-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className="hover:bg-white/5 transition-colors group"
            >
              <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">
                {entry.timestamp.includes('T') && entry.timestamp.includes('Z') 
                  ? new Date(entry.timestamp).toLocaleString(undefined, { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })
                  : entry.timestamp.toString()}
              </td>
              <td className="px-4 py-3">
                <span className="text-white font-semibold">{entry.modeOfSession}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-brand-red font-bold uppercase text-[10px] tracking-tight">{entry.vertical}</span>
              </td>
              <td className="px-4 py-3">
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-500 text-[9px] uppercase font-bold border border-white/5">
                  {entry.creativeType}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="text-gray-400 line-clamp-1 max-w-[200px]" title={entry.mailSubjectLine}>
                  {entry.mailSubjectLine}
                </p>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-gray-400">{entry.creativesCount}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <User size={12} className="text-gray-600" />
                  <span className="font-medium">{entry.designer}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                  getStatusColor(entry.status)
                )}>
                  {entry.status}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
