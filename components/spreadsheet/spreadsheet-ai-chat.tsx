"use client";

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { useSpreadsheetStore } from "@/lib/spreadsheet-store";
import {
  Send,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  X,
  Loader2,
  Minimize2,
  Maximize2,
  Plus,
  Zap,
  Globe,
  Clock,
  Mic,
  MicOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  chartSuggestion?: {
    type: "bar" | "line" | "area" | "radial";
    title: string;
    labelKey: string;
    dataKeys: string[];
    description: string;
  } | null;
  fillData?: { cell: string; value: string }[] | null;
}

export interface SpreadsheetAiChatRef {
  openWithMessage: (message: string) => void;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export const SpreadsheetAiChat = forwardRef<SpreadsheetAiChatRef>(function SpreadsheetAiChat(_props, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const { getAllData, getHeaders, addChart, setShowDashboard, setCellValue } = useSpreadsheetStore();

  useImperativeHandle(ref, () => ({
    openWithMessage: (message: string) => {
      setIsOpen(true);
      setIsMinimized(false);
      setInput(message);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback((): SpeechRecognitionInstance | null => {
    if (typeof window === "undefined") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition: SpeechRecognitionInstance = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      if (finalTranscript) {
        setInput((prev) => prev + finalTranscript);
      }
    };

    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { setIsListening(false); };

    return recognition;
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      }
    }
  }, [isListening, initSpeechRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const sendMessage = async (message: string, action?: string) => {
    if (!message.trim() && !action) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message || (action === "analyze" ? "Analyze my spreadsheet data" : action === "suggest-chart" ? "Suggest charts for my data" : message),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    try {
      const response = await fetch("/api/ai-spreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          spreadsheetData: getAllData(),
          headers: getHeaders(),
          action: action || "chat",
        }),
      });

      const data = await response.json();
      const aiContent = data.message || "Sorry, I couldn't process that request.";

      // Parse fill data from AI response
      let fillData: { cell: string; value: string }[] | null = null;
      const fillMatch = aiContent.match(/```fill\n([\s\S]*?)\n```/);
      if (fillMatch) {
        try {
          fillData = JSON.parse(fillMatch[1]);
        } catch {
          // ignore parse errors
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        chartSuggestion: data.chartSuggestion,
        fillData,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-fill cells if fill data is present
      if (fillData && fillData.length > 0) {
        fillData.forEach(({ cell, value }) => {
          if (cell && value !== undefined) {
            setCellValue(cell.toUpperCase(), String(value));
          }
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, there was an error connecting to the AI service. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChart = (suggestion: ChatMessage["chartSuggestion"]) => {
    if (!suggestion) return;
    addChart({
      type: suggestion.type,
      title: suggestion.title,
      dataRange: `${suggestion.labelKey}:${suggestion.dataKeys.join(",")}`,
      x: 0,
      y: 0,
      width: 400,
      height: 300,
    });
    setShowDashboard(true);
  };

  const handleApplyFill = (fd: { cell: string; value: string }[] | null | undefined) => {
    if (!fd) return;
    fd.forEach(({ cell, value }) => {
      if (cell && value !== undefined) {
        setCellValue(cell.toUpperCase(), String(value));
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Bottom chat bar (always visible when not expanded) - matches attachment design
  if (!isOpen) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="border-t border-[#e5e5e5] bg-white/95 px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] backdrop-blur-md">
          <div className="mx-auto max-w-4xl">
            <div
              className="flex cursor-text items-center rounded-xl border border-[#e0e0e0] bg-[#f9f9f9] px-4 py-3 transition-all hover:border-[#c0c0c0] hover:bg-white focus-within:border-[#1a73e8] focus-within:bg-white focus-within:shadow-sm"
              onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
            >
              <span className="flex-1 select-none text-[15px] text-[#9aa0a6]">Ask anything</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4]" onClick={(e) => { e.stopPropagation(); setShowQuickActions(!showQuickActions); }} title="Quick actions"><Plus className="h-4 w-4" /></button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4]" onClick={(e) => { e.stopPropagation(); setIsOpen(true); setTimeout(() => sendMessage("Analyze my spreadsheet data and provide key insights", "analyze"), 100); }} title="Quick analyze"><Zap className="h-4 w-4" /></button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4]" onClick={(e) => { e.stopPropagation(); setIsOpen(true); setTimeout(() => sendMessage("Suggest the best charts for my data", "suggest-chart"), 100); }} title="Browse charts"><Globe className="h-4 w-4" /></button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4]" onClick={(e) => { e.stopPropagation(); setIsOpen(true); setTimeout(() => sendMessage("Give me a summary of recent changes and data patterns", "analyze"), 100); }} title="History"><Clock className="h-4 w-4" /></button>
              </div>
              <button
                className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-all", isListening ? "animate-pulse bg-red-500 text-white" : "text-[#5f6368] hover:bg-[#f1f3f4]")}
                onClick={(e) => { e.stopPropagation(); toggleVoiceInput(); }}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            {showQuickActions && (
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#e0e0e0] bg-white p-3 shadow-lg">
                <QuickActionCard icon={<BarChart3 className="h-4 w-4 text-blue-500" />} label="Analyze Data" description="Get insights from your spreadsheet" onClick={() => { setShowQuickActions(false); setIsOpen(true); setTimeout(() => sendMessage("Analyze my spreadsheet data and provide key insights", "analyze"), 100); }} />
                <QuickActionCard icon={<LineChart className="h-4 w-4 text-green-500" />} label="Create Charts" description="Generate charts from your data" onClick={() => { setShowQuickActions(false); setIsOpen(true); setTimeout(() => sendMessage("Suggest the best charts for my data", "suggest-chart"), 100); }} />
                <QuickActionCard icon={<PieChart className="h-4 w-4 text-purple-500" />} label="Auto Fill" description="Populate spreadsheet with data" onClick={() => { setShowQuickActions(false); setIsOpen(true); setTimeout(() => sendMessage("Fill the spreadsheet with sample business data", "chat"), 100); }} />
                <QuickActionCard icon={<AreaChart className="h-4 w-4 text-orange-500" />} label="Formulas" description="Get formula suggestions" onClick={() => { setShowQuickActions(false); setIsOpen(true); setTimeout(() => sendMessage("Suggest useful formulas for my data", "formula"), 100); }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 flex h-12 cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#1a73e8] to-[#4285f4] px-4 text-white shadow-lg transition-all hover:scale-105"
        onClick={() => setIsMinimized(false)}
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Zotion AI</span>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        <Maximize2 className="h-3.5 w-3.5 ml-1 opacity-70" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[420px] flex-col rounded-2xl border border-[#dadce0] bg-white/95 shadow-2xl backdrop-blur-xl" style={{ height: "560px" }}>
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#1a73e8] to-[#4285f4] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">Zotion AI Assistant</span>
            <p className="text-[10px] text-white/70">Powered by Cerebras</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-1.5 border-b border-[#e8eaed] px-3 py-2 overflow-x-auto">
        <QuickAction
          icon={<BarChart3 className="h-3 w-3" />}
          label="Analyze"
          onClick={() => sendMessage("Analyze my spreadsheet data and provide key insights", "analyze")}
        />
        <QuickAction
          icon={<LineChart className="h-3 w-3" />}
          label="Charts"
          onClick={() => sendMessage("Suggest the best charts for my data", "suggest-chart")}
        />
        <QuickAction
          icon={<PieChart className="h-3 w-3" />}
          label="Summary"
          onClick={() => sendMessage("Give me a summary of all data in the spreadsheet", "analyze")}
        />
        <QuickAction
          icon={<AreaChart className="h-3 w-3" />}
          label="Formulas"
          onClick={() => sendMessage("Suggest useful formulas for my data", "formula")}
        />
        <QuickAction
          icon={<Sparkles className="h-3 w-3" />}
          label="Auto Fill"
          onClick={() => sendMessage("Fill the spreadsheet with sample business data. Respond with a JSON block: ```fill\n[{\"cell\":\"A1\",\"value\":\"Month\"},{\"cell\":\"B1\",\"value\":\"Revenue\"}]\n```", "chat")}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a73e8]/10 to-[#4285f4]/10">
              <Sparkles className="h-8 w-8 text-[#1a73e8]" />
            </div>
            <p className="text-sm font-medium text-[#202124]">How can I help with your data?</p>
            <p className="mt-1 max-w-[260px] text-xs text-[#80868b]">
              I can analyze data, suggest charts, write formulas, auto-fill cells, and build dashboards. Use the mic button for voice commands!
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "mb-3 max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
              msg.role === "user"
                ? "ml-auto bg-gradient-to-r from-[#1a73e8] to-[#4285f4] text-white"
                : "bg-[#f1f3f4] text-[#202124]"
            )}
          >
            <div className="whitespace-pre-wrap">{msg.content.replace(/```chart[\s\S]*?```/g, "").replace(/```fill[\s\S]*?```/g, "").trim()}</div>
            {msg.chartSuggestion && (
              <button
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#1557b0] transition-colors"
                onClick={() => handleAddChart(msg.chartSuggestion)}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Add {msg.chartSuggestion.type} chart to dashboard
              </button>
            )}
            {msg.fillData && msg.fillData.length > 0 && (
              <button
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 transition-colors"
                onClick={() => handleApplyFill(msg.fillData)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Apply data to spreadsheet ({msg.fillData.length} cells)
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#f1f3f4] px-3 py-2 text-[13px] text-[#5f6368]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area with voice */}
      <div className="border-t border-[#e8eaed] px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 transition-all focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]/30">
          <Sparkles className="h-4 w-4 shrink-0 text-[#1a73e8]" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-[13px] text-[#202124] placeholder-[#80868b] outline-none"
            placeholder={isListening ? "Listening... speak now" : "Ask anything about your data..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={cn("shrink-0 rounded-full p-1.5 transition-all", isListening ? "animate-pulse bg-red-500 text-white" : "text-[#80868b] hover:bg-[#e8eaed] hover:text-[#5f6368]")}
            onClick={toggleVoiceInput}
            title={isListening ? "Stop voice input" : "Start voice input"}
            type="button"
          >
            {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>
          <button
            className={cn("shrink-0 rounded-full p-1.5 transition-all", input.trim() ? "scale-100 bg-[#1a73e8] text-white hover:bg-[#1557b0]" : "scale-90 text-[#80868b]")}
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        {isListening && (
          <div className="mt-1.5 flex items-center gap-1.5 px-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-[10px] font-medium text-red-500">Recording - speak your command...</span>
          </div>
        )}
      </div>
    </div>
  );
});

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex shrink-0 items-center gap-1 rounded-full border border-[#dadce0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5f6368] transition-colors hover:border-[#1a73e8]/30 hover:bg-[#e8eaed]"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function QuickActionCard({ icon, label, description, onClick }: { icon: React.ReactNode; label: string; description: string; onClick: () => void }) {
  return (
    <button
      className="flex items-start gap-3 rounded-lg border border-[#e0e0e0] bg-white p-3 text-left transition-all hover:border-[#1a73e8]/30 hover:bg-[#f8f9ff] hover:shadow-sm"
      onClick={onClick}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f4]">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-[#202124]">{label}</p>
        <p className="mt-0.5 text-[10px] text-[#80868b]">{description}</p>
      </div>
    </button>
  );
}
