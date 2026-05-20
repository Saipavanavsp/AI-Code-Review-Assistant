"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Zap, Info, Terminal, Play, MessageSquare, Send, X, AlertCircle, Loader2 } from "lucide-react";

export default function ReviewArena() {
  const defaultCodes = {
    python: "def calculate(a, b):\n    return a + b\n\nprint(calculate(5, 3))",
    javascript: "function calculate(a, b) {\n  return a + b;\n}\n\nconsole.log(calculate(5, 3));",
    java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}",
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello World\" << endl;\n    return 0;\n}",
    c: "#include <stdio.h>\n\nint main() {\n    printf(\"Hello World\\n\");\n    return 0;\n}",
    csharp: "using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine(\"Hello World\");\n    }\n}"
  };

  const getFileExtension = (lang) => {
    switch (lang) {
      case "python": return "py";
      case "javascript": return "js";
      case "java": return "java";
      case "cpp": return "cpp";
      case "c": return "c";
      case "csharp": return "cs";
      default: return "txt";
    }
  };

  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(defaultCodes.python);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("disconnected");
  
  // Terminal States
  const [terminalTab, setTerminalTab] = useState("output");
  const [output, setOutput] = useState("Welcome to the ReviewAI Terminal. Click 'Run Code' to execute.");
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hello! I'm your AI Architect. How can I help you with your code today?" }
  ]);
  const [currentChat, setCurrentChat] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const socketRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//localhost:8000/ws/live-review`;
    
    const connect = () => {
      setStatus("connecting");
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => setStatus("connected");
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setFeedback(data.feedback);
        setScore(data.score);
      };
      socket.onclose = () => {
        setStatus("disconnected");
        setTimeout(connect, 3000);
      };
    };

    connect();
    return () => { if (socketRef.current) socketRef.current.close(); };
  }, []);

  const handleEditorChange = (value) => {
    setCode(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ code: value, filename: `main.${getFileExtension(language)}`, language: language }));
      }
    }, 1000);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(defaultCodes[newLang]);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ code: defaultCodes[newLang], filename: `main.${getFileExtension(newLang)}`, language: newLang }));
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("Running code...");
    setTerminalTab("output");
    try {
      const response = await fetch("http://localhost:8000/api/v1/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: language, code_context: code, stdin: input })
      });
      const data = await response.json();
      setOutput(data.output);
      const errList = data.errors || [];
      setErrors(errList);
      if (errList.length > 0) {
        setTerminalTab("errors");
      } else {
        setTerminalTab("output");
      }
    } catch (err) {
      setOutput("Error: Failed to connect to execution engine.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentChat.trim()) return;
    const userMsg = currentChat;
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setCurrentChat("");
    setIsChatLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, code_context: code })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting to Claude right now." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] overflow-hidden">
      {/* Main Coding Area */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <select value={language} onChange={handleLanguageChange} className="bg-transparent text-xs font-bold text-slate-400 focus:outline-none uppercase">
              <option value="python" className="bg-slate-900">Python</option>
              <option value="javascript" className="bg-slate-900">JavaScript</option>
              <option value="java" className="bg-slate-900">Java</option>
              <option value="cpp" className="bg-slate-900">C++</option>
              <option value="c" className="bg-slate-900">C</option>
              <option value="csharp" className="bg-slate-900">C#</option>
            </select>
          </div>
          <button 
            onClick={handleRunCode}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            {isRunning ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
            Run Code
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 20 }, fontFamily: "'JetBrains Mono', monospace" }}
          />
        </div>

        {/* Terminal Area */}
        <div className="h-64 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            {["output", "input", "errors"].map(tab => (
              <button
                key={tab}
                onClick={() => setTerminalTab(tab)}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  terminalTab === tab ? 'text-white border-b-2 border-indigo-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto">
            {terminalTab === "output" && <pre className="text-slate-300 whitespace-pre-wrap">{output}</pre>}
            {terminalTab === "input" && (
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter mock input values here (one per line)..."
                className="w-full min-h-[120px] bg-transparent border-none focus:outline-none text-indigo-400 resize-none font-mono text-xs"
              />
            )}
            {terminalTab === "errors" && (
              <div className="space-y-2">
                {errors.length > 0 ? (
                  <pre className="text-red-400 whitespace-pre-wrap">{errors.join("\n")}</pre>
                ) : (
                  <span className="text-slate-600 italic">No syntax errors detected.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Panels: Review + AI Chat */}
      <div className="w-80 flex flex-col gap-4 overflow-hidden">
        {/* Health Score Panel */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Health Index</span>
            <span className={`text-xl font-black ${score > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{score}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${score}%` }} className="bg-indigo-500 h-full" />
          </div>
        </div>

        {/* AI Architect Chat Panel */}
        <div className="flex-1 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">AI Architect (Claude)</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl text-[13px] ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 animate-pulse">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-900/50">
            <div className="relative">
              <input 
                value={currentChat}
                onChange={(e) => setCurrentChat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Claude to optimize..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-4 pr-10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <button 
                onClick={handleSendMessage}
                className="absolute right-2 top-1.5 p-1 text-indigo-500 hover:text-indigo-400"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
