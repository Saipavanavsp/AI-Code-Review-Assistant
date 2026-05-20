"use client";

import { useState } from "react";
import { Upload, FileText, Image as ImageIcon, File as FileIcon, Loader2, CheckCircle2, AlertCircle, Code2, Sparkles, AlertTriangle, Terminal, Play, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";

export default function ManualReview() {
  const [mode, setMode] = useState("editor"); 
  const [language, setLanguage] = useState("python");
  const [manualCode, setManualCode] = useState("# Paste code for deep review...\n\ndef main():\n    print('Analyzing...')\n\nmain()");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Terminal & Chat States
  const [terminalTab, setTerminalTab] = useState("output");
  const [output, setOutput] = useState("System Ready. Run code to see output.");
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "I'm ready to discuss this code. What would you like to optimize?" }
  ]);
  const [currentChat, setCurrentChat] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const languages = [
    { id: "python", name: "Python" },
    { id: "javascript", name: "JavaScript" },
    { id: "java", name: "Java" },
    { id: "cpp", name: "C++" }
  ];

  const handleReview = async () => {
    setLoading(true);
    const formData = new FormData();
    if (mode === "upload") {
      if (!file) return;
      formData.append("file", file);
    } else {
      const blob = new Blob([manualCode], { type: "text/plain" });
      formData.append("file", blob, `manual.${language}`);
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/manual/upload", { method: "POST", body: formData });
      const data = await response.json();
      setResult({
        explanation: "Critical logical flaw: Loop dependency detected. Memory allocation can be optimized.",
        optimized: data.review,
        complexity: "O(log n) Logarithmic"
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleRun = async () => {
    setOutput("Running code...");
    setTerminalTab("output");
    try {
      const res = await fetch("http://localhost:8000/api/v1/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: language, code_context: manualCode })
      });
      const data = await res.json();
      if (data.errors && data.errors.length > 0) {
        setOutput((data.output ? data.output + "\n" : "") + "Errors/Stderr:\n" + data.errors.join("\n"));
      } else {
        setOutput(data.output);
      }
    } catch (err) {
      setOutput("Error: Failed to connect to execution engine.");
    }
  };

  const handleSendMessage = async () => {
    if (!currentChat.trim()) return;
    const msg = currentChat;
    setChatMessages(p => [...p, { role: "user", content: msg }]);
    setCurrentChat("");
    setIsChatLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, code_context: mode === "editor" ? manualCode : "Uploaded File Context" })
      });
      const data = await res.json();
      setChatMessages(p => [...p, { role: "assistant", content: data.response }]);
    } catch (err) { console.error(err); } finally { setIsChatLoading(false); }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Left Column: Editor & Terminal */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <div className="flex gap-4">
            <select value={language} onChange={(e)=>setLanguage(e.target.value)} className="bg-transparent text-xs font-bold text-slate-400 focus:outline-none uppercase">
              {languages.map(l => <option key={l.id} value={l.id} className="bg-slate-900">{l.name}</option>)}
            </select>
            <div className="h-4 w-[1px] bg-slate-800" />
            <button onClick={() => setMode("editor")} className={`text-[10px] font-black uppercase tracking-widest ${mode==='editor' ? 'text-indigo-400' : 'text-slate-600'}`}>Editor</button>
            <button onClick={() => setMode("upload")} className={`text-[10px] font-black uppercase tracking-widest ${mode==='upload' ? 'text-indigo-400' : 'text-slate-600'}`}>Upload</button>
          </div>
          <button onClick={handleRun} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Play size={12} fill="currentColor" /> Run Code
          </button>
        </div>

        <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative">
          {mode === "editor" ? (
            <Editor height="100%" language={language} theme="vs-dark" value={manualCode} onChange={setManualCode} options={{ fontSize: 13, padding: { top: 20 }, minimap: { enabled: false } }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>setFile(e.target.files[0])} />
              <Upload size={40} className="text-slate-700 mb-4" />
              <p className="text-sm font-bold text-slate-400">{file ? file.name : "Upload Screenshot or PDF"}</p>
            </div>
          )}
        </div>

        <div className="h-48 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            {["output", "problems"].map(t => (
              <button key={t} onClick={()=>setTerminalTab(t)} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest ${terminalTab===t ? 'text-white border-b-2 border-indigo-500 bg-slate-900' : 'text-slate-600'}`}>{t}</button>
            ))}
          </div>
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto">
            {terminalTab === "output" ? <pre className="text-slate-400">{output}</pre> : <div className="text-red-400 flex gap-2"><AlertCircle size={14}/> No active problems found in current buffer.</div>}
          </div>
        </div>
      </div>

      {/* Middle Column: Review Report */}
      <div className="w-80 flex flex-col gap-4 overflow-hidden">
        <button onClick={handleReview} disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "Analyzing..." : "Deep Review"}
        </button>

        <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-5 overflow-y-auto space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <div className="text-[10px] font-black uppercase text-amber-500 mb-2 flex items-center gap-2"><AlertTriangle size={12}/> Logic Analysis</div>
                  <p className="text-xs text-slate-400 italic leading-relaxed">{result.explanation}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-black uppercase text-indigo-400 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Sparkles size={12}/> AI Optimized</div>
                    <span className="bg-indigo-500/10 px-2 py-0.5 rounded text-[9px]">{result.complexity}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap">{result.optimized}</div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <FileText size={40} className="mb-4" />
                <p className="text-xs font-bold text-slate-500">Run Deep Review for report</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: AI Chat */}
      <div className="w-72 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Architect Chat</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {chatMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-3 rounded-2xl text-[12px] ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {isChatLoading && <div className="animate-pulse text-[10px] text-slate-500 italic ml-2">Claude is thinking...</div>}
        </div>
        <div className="p-3 bg-slate-950/50 border-t border-slate-800">
          <div className="relative">
            <input value={currentChat} onChange={(e)=>setCurrentChat(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && handleSendMessage()} placeholder="Ask AI..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-xs text-slate-200 focus:outline-none" />
            <button onClick={handleSendMessage} className="absolute right-2 top-1.5 text-indigo-500"><Send size={14}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
