"use client";

import { useState } from "react";
import SelectionCards from "@/components/SelectionCards";
import ReviewArena from "@/components/ReviewArena";
import MetricsDashboard from "@/components/MetricsDashboard";
import ManualReview from "@/components/ManualReview";
import { Code2, BarChart3, Activity, Upload } from "lucide-react";

export default function Home() {
  const [view, setView] = useState("selection"); // selection, face1, face2, metrics

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navigation Header */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setView("selection")}
          >
            <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Code2 size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              ReviewAI
            </span>
          </div>
          
          <div className="flex gap-6 items-center">
            <button 
              onClick={() => setView("metrics")}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'metrics' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
            >
              <BarChart3 size={18} />
              Metrics
            </button>
            <button 
              onClick={() => setView("selection")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              New Review
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {view === "selection" && <SelectionCards setView={setView} />}
        {view === "face2" && <ReviewArena />}
        {view === "metrics" && <MetricsDashboard />}
        {view === "face1" && <ManualReview />}
      </div>
    </main>
  );
}
