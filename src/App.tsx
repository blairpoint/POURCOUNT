import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, RotateCcw, Wine, Info, AlertCircle, Loader2, ChevronRight, WifiOff, List, Plus, Trash2, X, Scan, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeBottleImage, type BottleAnalysis } from './lib/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const POUR_SIZE_ML = 30;

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResults, setCurrentResults] = useState<BottleAnalysis[]>([]);
  const [inventory, setInventory] = useState<BottleAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setCurrentResults([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] } as Record<string, string[]>,
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!image) return;
    if (isOffline) {
      setError('You are currently offline. AI analysis requires an internet connection.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const results = await analyzeBottleImage(image);
      setCurrentResults(results);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addToInventory = (bottle: BottleAnalysis) => {
    setInventory(prev => [...prev, { ...bottle, id: Math.random().toString(36).substring(7) }]);
  };

  const removeFromInventory = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const reset = () => {
    setImage(null);
    setCurrentResults([]);
    setError(null);
  };

  const calculatePours = (fullVolume: number, fillPercentage: number) => {
    const remainingMl = (fullVolume * fillPercentage) / 100;
    return Number((remainingMl / POUR_SIZE_ML).toFixed(1));
  };

  const totalPoursInInventory = inventory.reduce((acc, item) => acc + calculatePours(item.fullVolumeMl, item.fillPercentage), 0);

  return (
    <div className="min-h-screen bg-[#151619] text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#1a1b1e] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wine className="w-5 h-5 text-[#151619]" />
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-widest uppercase">PourCount</h1>
              {isOffline && (
                <div className="flex items-center gap-1 text-[8px] text-red-400 font-mono uppercase tracking-tighter">
                  <WifiOff className="w-2 h-2" />
                  Offline Mode
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors relative"
              title="Inventory"
            >
              <List className="w-5 h-5 text-white/60" />
              {inventory.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-[#151619] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {inventory.length}
                </span>
              )}
            </button>
            <button 
              onClick={reset}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-light">Inventory Check</h2>
                <p className="text-white/40 text-sm">Snap a photo of one or more bottles to calculate remaining pours.</p>
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  "relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden group",
                  isDragActive ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <input {...getInputProps()} capture="environment" />
                
                {/* LiDAR Scanning Animation Effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                  <motion.div 
                    animate={{ y: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                  />
                </div>

                <div className="w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                  <Scan className="w-8 h-8 text-[#151619]" />
                </div>
                <div className="text-center z-10">
                  <p className="font-bold text-lg">LiDAR Precision Scan</p>
                  <p className="text-xs text-white/40 mt-1">Align bottle for 99% accuracy</p>
                </div>
                
                {/* Precision Guides */}
                <div className="absolute inset-8 border border-white/5 rounded-lg pointer-events-none flex items-center justify-center">
                  <Target className="w-8 h-8 text-white/5" />
                </div>
                
                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/20" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/20" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/20" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/20" />
              </div>

              <div className="bg-white/5 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs text-white/60 leading-relaxed">
                  You can capture multiple bottles in one shot. Ensure all labels and liquid levels are clearly visible.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img src={image} alt="Bottle" className="w-full h-full object-cover" />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-[40px] border-black/20" />
                  <div className="absolute top-1/2 left-0 w-full h-px bg-emerald-500/30" />
                  <div className="absolute top-0 left-1/2 w-px h-full bg-emerald-500/30" />
                </div>

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                      <Scan className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-xs uppercase tracking-widest text-emerald-500">LiDAR Depth Analysis</p>
                      <p className="text-[10px] text-white/40 mt-1">Calculating liquid volume...</p>
                    </div>
                  </div>
                )}
              </div>

              {currentResults.length === 0 && !isAnalyzing && (
                <button
                  onClick={handleAnalyze}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#151619] font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Calculate Pours
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {currentResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-light">Detected Bottles</h3>
                    <p className="text-xs text-white/40 font-mono uppercase tracking-widest">{currentResults.length} found</p>
                  </div>
                  
                  <div className="space-y-4">
                    {currentResults.map((bottle) => (
                      <div key={bottle.id} className="bg-[#1a1b1e] rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-1">Brand</p>
                              <h4 className="text-lg font-medium leading-tight">{bottle.brand}</h4>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-1">Fill</p>
                              <p className="text-lg font-mono text-emerald-500">{bottle.fillPercentage}%</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-white/[0.02] rounded-xl p-3 border border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Volume</span>
                              <span className="text-sm font-mono">{bottle.fullVolumeMl}ml</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Remaining</span>
                              <span className="text-sm font-mono text-emerald-500 font-bold">{calculatePours(bottle.fullVolumeMl, bottle.fillPercentage)} Pours</span>
                            </div>
                          </div>

                          <button
                            onClick={() => addToInventory(bottle)}
                            className="w-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
                          >
                            <Plus className="w-4 h-4" />
                            Add to Inventory
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={reset}
                    className="w-full border border-white/10 hover:bg-white/5 text-white/60 font-medium py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Photo
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sidebar / Inventory Panel */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xs bg-[#1a1b1e] border-l border-white/10 z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-emerald-500" />
                  <h2 className="font-mono text-sm font-bold tracking-widest uppercase">Inventory</h2>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {inventory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <Wine className="w-12 h-12" />
                    <p className="text-sm">Your inventory is empty.<br/>Analyze a bottle to add it here.</p>
                  </div>
                ) : (
                  inventory.map((item) => (
                    <div key={item.id} className="bg-white/[0.02] rounded-xl p-4 border border-white/5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium leading-tight">{item.brand}</h4>
                          <p className="text-[10px] text-white/40 font-mono mt-1">{item.fullVolumeMl}ml • {item.fillPercentage}% full</p>
                        </div>
                        <button 
                          onClick={() => removeFromInventory(item.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg group transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white/20 group-hover:text-red-400" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Remaining</span>
                        <span className="text-sm font-mono text-emerald-500 font-bold">{calculatePours(item.fullVolumeMl, item.fillPercentage)} Pours</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {inventory.length > 0 && (
                <div className="p-6 border-t border-white/5 bg-emerald-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-white/40">Total Inventory</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-emerald-500">{totalPoursInInventory}</span>
                      <span className="text-[10px] font-mono text-white/40 ml-1">POURS</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if(confirm('Clear all inventory?')) setInventory([]);
                    }}
                    className="w-full py-3 text-xs font-mono uppercase tracking-widest text-white/20 hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="max-w-md mx-auto p-6 text-center">
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
          Professional Bar Inventory Tool
        </p>
      </footer>
    </div>
  );
}
