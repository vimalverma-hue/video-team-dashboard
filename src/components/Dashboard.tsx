import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, RefreshCw, Download, LayoutGrid, List, 
  Moon, Sun, Calendar as CalendarIcon, ChevronDown, X
} from 'lucide-react';
import { fetchSheetData, SheetSource } from '../services/sheetsService';
import { VideoEntry, CreativeEntry, DashboardStats } from '../types';
import StatsGrid from './StatsGrid';
import ChartsSection from './ChartsSection';
import DataTable from './DataTable';
import CreativeDataTable from './CreativeDataTable';
import CardView from './CardView';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function Dashboard() {
  const [data, setData] = useState<VideoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeSource, setActiveSource] = useState<SheetSource>('NATIONALS');
  const [activeCreativeSource, setActiveCreativeSource] = useState<SheetSource>('CREATIVE_BRP');
  const [masterTab, setMasterTab] = useState<'VIDEO_PRODUCTION' | 'CREATIVE_PRODUCTION'>('VIDEO_PRODUCTION');
  
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
    timeRange: 'All', // All, Today, Yesterday, Custom
    startDate: '', // for Custom range
    endDate: ''   // for Custom range
  });

  const [creativeFilters, setCreativeFilters] = useState({
    modeOfSession: 'All',
    creativeType: 'All',
    designer: 'All',
    status: 'All',
    timeRange: 'All',
    startDate: '',
    endDate: ''
  });

  const currentSource = masterTab === 'VIDEO_PRODUCTION' ? activeSource : activeCreativeSource;

  const loadData = async (source: SheetSource = currentSource) => {
    setLoading(true);
    try {
      const result = await fetchSheetData(source);
      // Sort data descending by timestamp (newest first)
      const sortedData = [...result].sort((a, b) => {
        return b.timestamp.toString().localeCompare(a.timestamp.toString());
      });
      setData(sortedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentSource);
  }, [currentSource]);

  const handleSourceChange = (source: SheetSource) => {
    if (masterTab === 'VIDEO_PRODUCTION') {
      setActiveSource(source);
      setFilters({
        editor: 'All',
        channel: 'All',
        status: 'All',
        category: 'All',
        type: 'All',
        timeRange: 'All',
        startDate: '',
        endDate: ''
      });
    } else {
      setActiveCreativeSource(source);
      setCreativeFilters({
        modeOfSession: 'All',
        creativeType: 'All',
        designer: 'All',
        status: 'All',
        timeRange: 'All',
        startDate: '',
        endDate: ''
      });
    }
  };

  const uniqueOptions = useMemo(() => {
    if (masterTab === 'VIDEO_PRODUCTION') {
      const editors = Array.from(new Set(data.map(d => (d as VideoEntry).editors?.trim()))).filter(Boolean).sort();
      const channels = Array.from(new Set(data.map(d => (d as VideoEntry).channel?.trim()))).filter(Boolean).sort();
      const statuses = Array.from(new Set(data.map(d => d.status?.trim()))).filter(Boolean).sort();
      const categories = Array.from(new Set(data.map(d => (d as VideoEntry).category?.trim()))).filter(Boolean).sort();
      const types = Array.from(new Set(data.map(d => (d as VideoEntry).type?.trim()))).filter(Boolean).sort();
      return { editors, channels, statuses, categories, types };
    } else {
      const modes = Array.from(new Set(data.map(d => (d as any).modeOfSession?.trim()))).filter(Boolean).sort();
      const types = Array.from(new Set(data.map(d => (d as any).creativeType?.trim()))).filter(Boolean).sort();
      const designers = Array.from(new Set(data.map(d => (d as any).designer?.trim()))).filter(Boolean).sort();
      const statuses = Array.from(new Set(data.map(d => d.status?.trim()))).filter(Boolean).sort();
      return { modes, types, designers, statuses };
    }
  }, [data, masterTab]);

  const filteredData = useMemo(() => {
    return data.filter(entry => {
      // Search logic
      const matchesSearch = Object.values(entry).some(val => 
        val?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const currentFilters = masterTab === 'VIDEO_PRODUCTION' ? filters : creativeFilters;

      // Filter logic
      let matchesFields = true;
      if (masterTab === 'VIDEO_PRODUCTION') {
        const vEntry = entry as VideoEntry;
        matchesFields = (filters.editor === 'All' || vEntry.editors === filters.editor) &&
                        (filters.channel === 'All' || vEntry.channel === filters.channel) &&
                        (filters.status === 'All' || vEntry.status === filters.status) &&
                        (filters.category === 'All' || vEntry.category === filters.category) &&
                        (filters.type === 'All' || vEntry.type === filters.type);
      } else {
        const cEntry = entry as any;
        matchesFields = (creativeFilters.modeOfSession === 'All' || cEntry.modeOfSession === creativeFilters.modeOfSession) &&
                        (creativeFilters.creativeType === 'All' || cEntry.creativeType === creativeFilters.creativeType) &&
                        (creativeFilters.designer === 'All' || cEntry.designer === creativeFilters.designer) &&
                        (creativeFilters.status === 'All' || cEntry.status === creativeFilters.status);
      }
      
      // Time Range Logic
      let matchesTime = true;
      const timeRange = currentFilters.timeRange;
      const startDate = currentFilters.startDate;
      const endDate = currentFilters.endDate;

      if (timeRange === 'Today') {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        matchesTime = entry.timestamp?.toString().includes(todayStr);
      } else if (timeRange === 'Yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        matchesTime = entry.timestamp?.toString().includes(yesterdayStr);
      } else if (timeRange === 'Custom' && startDate && endDate) {
        try {
          const entryDate = new Date(entry.timestamp);
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          matchesTime = entryDate >= start && entryDate <= end;
        } catch (e) {
          matchesTime = true;
        }
      }

      return matchesSearch && matchesFields && matchesTime;
    });
  }, [data, searchQuery, filters, creativeFilters, masterTab]);

  const stats = useMemo<DashboardStats>(() => {
    let completed = 0;
    let working = 0;
    let rejected = 0;
    let hold = 0;

    for (let i = 0; i < filteredData.length; i++) {
       const s = filteredData[i].status?.toLowerCase() || '';
       if (s.includes('completed') || s.includes('done')) completed++;
       else if (s.includes('working') || s.includes('progress')) working++;
       else if (s.includes('rejected') || s.includes('failed')) rejected++;
       else if (s.includes('hold')) hold++;
    }

    if (masterTab === 'VIDEO_PRODUCTION') {
      const vData = filteredData as VideoEntry[];
      return {
        totalVideos: filteredData.length,
        completedCount: completed,
        workingCount: working,
        rejectedCount: rejected,
        onHoldCount: hold,
        editorsCount: new Set(vData.map(d => d.editors)).size,
        channelsCount: new Set(vData.map(d => d.channel)).size,
      };
    } else {
      const cData = filteredData as CreativeEntry[];
      const totalCreatives = cData.reduce((acc, curr) => {
        const count = parseInt(curr.creativesCount || '0', 10);
        return acc + (isNaN(count) ? 0 : count);
      }, 0);

      return {
        totalVideos: totalCreatives,
        completedCount: completed,
        workingCount: working,
        rejectedCount: rejected,
        onHoldCount: hold,
        editorsCount: new Set(cData.map(d => d.designer)).size,
        channelsCount: new Set(cData.map(d => d.modeOfSession)).size,
      };
    }
  }, [filteredData, masterTab]);

  const exportToCSV = () => {
    const isCreative = masterTab === 'CREATIVE_PRODUCTION';
    const headers = isCreative 
      ? ['Timestamp', 'Mode of Session', 'Creative Type', 'Mail Subject Line', 'Creatives count', 'Designer', 'Status']
      : ['Timestamp', 'Email', 'Channel', 'Subject', 'Category', 'Type', 'Editors', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(entry => 
        Object.values(entry).map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',')
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
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Live Data Archive Since Jan 2023</p>
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
            onClick={() => loadData()}
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
        {/* Master Navigation Tabs */}
        <div className="flex border-b border-white/5 mb-2">
          <button 
            onClick={() => setMasterTab('VIDEO_PRODUCTION')}
            className={cn(
              "px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative",
              masterTab === 'VIDEO_PRODUCTION' ? "text-brand-red" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Video Production
            {masterTab === 'VIDEO_PRODUCTION' && (
              <motion.div layoutId="masterUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red" />
            )}
          </button>
          <button 
            onClick={() => setMasterTab('CREATIVE_PRODUCTION')}
            className={cn(
              "px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative",
              masterTab === 'CREATIVE_PRODUCTION' ? "text-brand-red" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Creative Production
            {masterTab === 'CREATIVE_PRODUCTION' && (
              <motion.div layoutId="masterUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red" />
            )}
          </button>
        </div>

        {masterTab === 'VIDEO_PRODUCTION' ? (
          <>
            {/* Source Tab Switcher */}
            <div className="flex items-center justify-center -mt-2">
              <div className="bg-[#151515] p-1 rounded-xl border border-white/5 flex gap-1 shadow-2xl">
                {[
                  { id: 'TESTPREP', label: 'TESTPREP' },
                  { id: 'NATIONALS', label: 'NATIONALS' },
                  { id: 'VERNAC', label: 'VERNAC' }
                ].map(source => (
                  <button
                    key={source.id}
                    onClick={() => handleSourceChange(source.id as SheetSource)}
                    className={cn(
                      "px-8 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 tracking-widest flex items-center gap-2",
                      activeSource === source.id 
                        ? "bg-brand-red text-white shadow-lg shadow-red-900/40" 
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", activeSource === source.id ? "bg-white animate-pulse" : "bg-gray-700")} />
                    {source.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-brand-red/10 border border-brand-red/20 text-brand-red px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X size={16} />
                  <span>{error}</span>
                </div>
                <button onClick={() => loadData(activeSource)} className="underline uppercase tracking-widest">Retry</button>
              </div>
            )}

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
                  <option value="Custom">Custom Range</option>
                </select>
              </div>

              <AnimatePresence>
                {filters.timeRange === 'Custom' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="col-span-2 grid grid-cols-2 gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">From</label>
                      <input 
                        type="date" 
                        value={filters.startDate}
                        onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                        className="input-field [color-scheme:dark]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">To</label>
                      <input 
                        type="date" 
                        value={filters.endDate}
                        onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                        className="input-field [color-scheme:dark]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end pb-0.5 px-2">
                <button 
                  onClick={() => setFilters({ editor: 'All', channel: 'All', status: 'All', category: 'All', type: 'All', timeRange: 'All', startDate: '', endDate: '' })}
                  className="text-[9px] font-black tracking-widest text-brand-red/60 hover:text-brand-red transition-colors uppercase w-full text-right"
                >
                  RESET FILTERS
                </button>
              </div>
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-4"
          >
             {/* Creative Source Tab Switcher */}
            <div className="flex items-center justify-center -mt-2">
              <div className="bg-[#151515] p-1 rounded-xl border border-white/5 flex gap-1 shadow-2xl overflow-x-auto no-scrollbar">
                {[
                  { id: 'CREATIVE_TESTPREP', label: 'TESTPREP' },
                  { id: 'CREATIVE_BRP', label: 'BRP' },
                  { id: 'CREATIVE_SRA', label: 'SRA' },
                  { id: 'CREATIVE_TUC', label: 'TUC' },
                  { id: 'CREATIVE_ENB', label: 'ENB' },
                  { id: 'CREATIVE_VERNAC', label: 'VERNAC' }
                ].map(source => (
                  <button
                    key={source.id}
                    onClick={() => handleSourceChange(source.id as SheetSource)}
                    className={cn(
                      "px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 tracking-widest flex items-center gap-2 whitespace-nowrap",
                      activeCreativeSource === source.id 
                        ? "bg-brand-red text-white shadow-lg shadow-red-900/40" 
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", activeCreativeSource === source.id ? "bg-white animate-pulse" : "bg-gray-700")} />
                    {source.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-brand-red/10 border border-brand-red/20 text-brand-red px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X size={16} />
                  <span>{error}</span>
                </div>
                <button onClick={() => loadData(currentSource)} className="underline uppercase tracking-widest">Retry</button>
              </div>
            )}

            {/* Creative Filter Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 bg-[#151515]/40 p-3 rounded-xl border border-white/5 backdrop-blur-md">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">Mode</label>
                 <select 
                  value={creativeFilters.modeOfSession}
                  onChange={(e) => setCreativeFilters(f => ({ ...f, modeOfSession: e.target.value }))}
                  className="input-field"
                >
                  <option value="All">All Modes</option>
                  {(uniqueOptions as any).modes?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">Type</label>
                 <select 
                  value={creativeFilters.creativeType}
                  onChange={(e) => setCreativeFilters(f => ({ ...f, creativeType: e.target.value }))}
                  className="input-field"
                >
                  <option value="All">All Types</option>
                  {(uniqueOptions as any).types?.map((t: string) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">Designer</label>
                 <select 
                  value={creativeFilters.designer}
                  onChange={(e) => setCreativeFilters(f => ({ ...f, designer: e.target.value }))}
                  className="input-field"
                >
                  <option value="All">All Designers</option>
                  {(uniqueOptions as any).designers?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">Date Range</label>
                 <select 
                  value={creativeFilters.timeRange}
                  onChange={(e) => setCreativeFilters(f => ({ ...f, timeRange: e.target.value }))}
                  className="input-field"
                >
                  <option value="All">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Custom">Custom Range</option>
                </select>
              </div>
              <AnimatePresence>
                {creativeFilters.timeRange === 'Custom' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="col-span-2 grid grid-cols-2 gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">From</label>
                      <input 
                        type="date" 
                        value={creativeFilters.startDate}
                        onChange={(e) => setCreativeFilters(f => ({ ...f, startDate: e.target.value }))}
                        className="input-field [color-scheme:dark]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-gray-500 ml-1 font-bold">To</label>
                      <input 
                        type="date" 
                        value={creativeFilters.endDate}
                        onChange={(e) => setCreativeFilters(f => ({ ...f, endDate: e.target.value }))}
                        className="input-field [color-scheme:dark]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-end pb-0.5 px-2">
                <button 
                  onClick={() => setCreativeFilters({ modeOfSession: 'All', creativeType: 'All', designer: 'All', status: 'All', timeRange: 'All', startDate: '', endDate: '' })}
                  className="text-[9px] font-black tracking-widest text-brand-red/60 hover:text-brand-red transition-colors uppercase w-full text-right"
                >
                  RESET FILTERS
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <StatsGrid stats={stats} isCreative={masterTab === 'CREATIVE_PRODUCTION'} />

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

        <ChartsSection data={filteredData} isCreative={masterTab === 'CREATIVE_PRODUCTION'} />

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
                   if (masterTab === 'VIDEO_PRODUCTION') {
                    setFilters({ editor: 'All', channel: 'All', status: 'All', category: 'All', type: 'All', timeRange: 'All', startDate: '', endDate: '' });
                   } else {
                    setCreativeFilters({ modeOfSession: 'All', creativeType: 'All', designer: 'All', status: 'All', timeRange: 'All', startDate: '', endDate: '' });
                   }
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
                   Recent {Math.min(filteredData.length, masterTab === 'CREATIVE_PRODUCTION' ? 50 : 100)} Entries out of {filteredData.length}
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
                    {masterTab === 'VIDEO_PRODUCTION' ? (
                      <DataTable entries={filteredData.slice(0, 100)} />
                    ) : (
                      <CreativeDataTable entries={filteredData.slice(0, 50)} />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="cards"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CardView 
                      entries={filteredData.slice(0, masterTab === 'CREATIVE_PRODUCTION' ? 50 : 100)} 
                      isCreative={masterTab === 'CREATIVE_PRODUCTION'}
                    />
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
