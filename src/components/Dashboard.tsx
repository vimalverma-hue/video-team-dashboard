import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, RefreshCw, Download, LayoutGrid, List, 
  Moon, Sun, Calendar as CalendarIcon, ChevronDown, X
} from 'lucide-react';
import { fetchSheetData } from '../services/sheetsService';
import { VideoEntry, DashboardStats } from '../types';
import StatsGrid from './StatsGrid';
import ChartsSection from './ChartsSection';
import DataTable from './DataTable';
import CardView from './CardView';
import { cn } from '../lib/utils';
import { format, isToday, isTomorrow, parseISO, isWithinInterval } from 'date-fns';

export default function Dashboard() {
  const [data, setData] = useState<VideoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Filtering & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Advanced filters
  const [filters, setFilters] = useState({
    editor: 'All',
    channel: 'All',
    status: 'All',
    category: 'All',
    type: 'All',
    timeRange: 'All' // All, Today, Tomorrow, Custom
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchSheetData();
      // Sort data descending by timestamp (newest first)
      const sortedData = [...result].sort((a, b) => {
        return b.timestamp.toString().localeCompare(a.timestamp.toString());
      });
      setData(sortedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const uniqueOptions = useMemo(() => {
    const editors = Array.from(new Set(data.map(d => d.editors.trim()))).filter(Boolean).sort();
    const channels = Array.from(new Set(data.map(d => d.channel.trim()))).filter(Boolean).sort();
    const statuses = Array.from(new Set(data.map(d => d.status.trim()))).filter(Boolean).sort();
    const categories = Array.from(new Set(data.map(d => d.category.trim()))).filter(Boolean).sort();
    const types = Array.from(new Set(data.map(d => d.type.trim()))).filter(Boolean).sort();
    
    return { editors, channels, statuses, categories, types };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(entry => {
      // Search logic
      const matchesSearch = Object.values(entry).some(val => 
        val.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Filter logic
      const matchesEditor = filters.editor === 'All' || entry.editors === filters.editor;
      const matchesChannel = filters.channel === 'All' || entry.channel === filters.channel;
      const matchesStatus = filters.status === 'All' || entry.status === filters.status;
      const matchesCategory = filters.category === 'All' || entry.category === filters.category;
      const matchesType = filters.type === 'All' || entry.type === filters.type;
      
      // Time Range Logic
      let matchesTime = true;
      if (filters.timeRange === 'Today') {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        matchesTime = entry.timestamp.toString().includes(todayStr);
      } else if (filters.timeRange === 'Yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        matchesTime = entry.timestamp.toString().includes(yesterdayStr);
      }

      return matchesSearch && matchesEditor && matchesChannel && matchesStatus && matchesCategory && matchesType && matchesTime;
    });
  }, [data, searchQuery, filters]);

  const stats = useMemo<DashboardStats>(() => {
    // Optimization: avoid filtering the whole array multiple times for each stat
    let completed = 0;
    let working = 0;
    let rejected = 0;
    let hold = 0;

    for (let i = 0; i < filteredData.length; i++) {
       const s = filteredData[i].status.toLowerCase();
       if (s.includes('completed')) completed++;
       else if (s.includes('working') || s.includes('progress')) working++;
       else if (s.includes('rejected')) rejected++;
       else if (s.includes('hold')) hold++;
    }

    return {
      totalVideos: filteredData.length,
      completedCount: completed,
      workingCount: working,
      rejectedCount: rejected,
      onHoldCount: hold,
      editorsCount: new Set(filteredData.map(d => d.editors)).size,
      channelsCount: new Set(filteredData.map(d => d.channel)).size,
    };
  }, [filteredData]);

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Email', 'Channel', 'Subject', 'Category', 'Type', 'Editors', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(entry => 
        Object.values(entry).map(val => `"${val.toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dashboard_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-[#00ff9f]"
        >
          <RefreshCw size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 selection:bg-brand-red/30",
      isDarkMode ? "bg-[#0a0a0a] text-gray-200" : "bg-slate-50 text-slate-900"
    )}>
      {/* Sticky Header */}
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-xl border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4 transition-all duration-300",
        isDarkMode ? "bg-[#151515]/80 border-white/5 shadow-2xl" : "bg-white/80 border-slate-200 shadow-lg"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-red to-[#ff7d7d] rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
            <LayoutGrid className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Post Production <span className="text-brand-red font-light italic">Analytics</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Video Workflow Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-grow max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search across global fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-all",
                isDarkMode 
                  ? "bg-[#202020] border-none text-gray-200 placeholder-gray-600 focus:ring-1 focus:ring-brand-red"
                  : "bg-slate-100 border-none text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-blue-500 shadow-inner"
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-[#202020] hover:bg-[#252525] border border-white border-opacity-5 text-gray-400 transition-colors"
          >
            {isDarkMode ? <Sun size={18} className="text-brand-yellow" /> : <Moon size={18} className="text-slate-600" />}
          </button>
          <button 
            onClick={loadData}
            className="p-2 rounded-lg bg-[#202020] hover:bg-[#252525] border border-white border-opacity-5 text-gray-400 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
          <button 
            onClick={exportToCSV}
            className="bg-brand-green text-black px-4 py-2 rounded-lg font-bold text-sm tracking-tight shadow-lg shadow-green-900/20 hover:brightness-105 transition-all"
          >
            EXPORT CSV
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 flex flex-col gap-4">
        {/* Filter Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-[#151515]/40 p-3 rounded-xl border border-white/5 backdrop-blur-md">
          <div className="flex flex-col gap-1">
             <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">Editors</label>
             <select 
              value={filters.editor}
              onChange={(e) => setFilters(f => ({ ...f, editor: e.target.value }))}
              className="input-field"
            >
              <option value="All">All Editors</option>
              {uniqueOptions.editors.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
             <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">Channel</label>
             <select 
              value={filters.channel}
              onChange={(e) => setFilters(f => ({ ...f, channel: e.target.value }))}
              className="input-field"
            >
              <option value="All">All Channels</option>
              {uniqueOptions.channels.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
             <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">Status</label>
             <select 
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="input-field"
            >
              <option value="All">All Status</option>
              {uniqueOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
             <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">Category</label>
             <select 
              value={filters.category}
              onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
              className="input-field"
            >
              <option value="All">All Categories</option>
              {uniqueOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
             <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">Date Range</label>
             <select 
              value={filters.timeRange}
              onChange={(e) => setFilters(f => ({ ...f, timeRange: e.target.value }))}
              className="input-field"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
            </select>
          </div>

          <div className="flex items-end pb-0.5 px-2">
            <button 
              onClick={() => setFilters({ editor: 'All', channel: 'All', status: 'All', category: 'All', type: 'All', timeRange: 'All' })}
              className="text-[9px] font-black tracking-widest text-brand-red/60 hover:text-brand-red transition-colors uppercase w-full text-right"
            >
              RESET FILTERS
            </button>
          </div>
        </div>

        <StatsGrid stats={stats} />

        <div className="flex items-center justify-between mt-2 mb-2 px-1">
          <div className="flex items-center gap-3">
             <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Activity & Analytics</h3>
             <div className="h-4 w-px bg-white/10" />
             <div className="flex bg-[#1a1a1a] rounded-lg p-0.5 border border-white/5">
                <button 
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'table' ? "bg-white/10 text-brand-green" : "text-gray-500 hover:text-white"
                  )}
                >
                  <List size={14} />
                </button>
                <button 
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'cards' ? "bg-white/10 text-brand-green" : "text-gray-500 hover:text-white"
                  )}
                >
                  <LayoutGrid size={14} />
                </button>
             </div>
          </div>
          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-tighter">
            Last Sync: {format(lastUpdated, 'HH:mm:ss')}
          </span>
        </div>

        <ChartsSection data={filteredData} />

        <section className="min-h-0 flex-grow pb-12">
          {filteredData.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-gray-700 bg-white/5 rounded-2xl border border-white/5 border-dashed"
            >
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Search size={24} />
               </div>
               <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No matching results found</p>
               <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Try adjusting your search or filters</p>
               <button 
                 onClick={() => {
                   setFilters({ editor: 'All', channel: 'All', status: 'All', category: 'All', type: 'All', timeRange: 'All' });
                   setSearchQuery('');
                 }}
                 className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-brand-red text-[10px] font-black uppercase transition-all tracking-widest"
               >
                 RESET ALL FILTERS
               </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                   Recent {Math.min(filteredData.length, 100)} Entries out of {filteredData.length}
                 </h4>
              </div>
              <AnimatePresence mode="wait">
                {viewMode === 'table' ? (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <DataTable entries={filteredData.slice(0, 100)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="cards"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CardView entries={filteredData.slice(0, 100)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      <footer className="px-6 py-4 flex justify-between items-center text-[10px] text-gray-600 font-mono tracking-tighter uppercase border-t border-white/5 bg-[#0a0a0a]">
        <div className="flex gap-4">
          <span>System Status: <span className="text-brand-green">Operational</span></span>
          <span className="opacity-30">•</span>
          <span>Last sync: {format(lastUpdated, 'MMMM dd, yyyy - HH:mm:ss')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>v2.4.0 High-Density Edition</span>
        </div>
      </footer>
    </div>
  );
}
