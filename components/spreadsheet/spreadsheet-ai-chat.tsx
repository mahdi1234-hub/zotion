"use client";

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
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

export const SpreadsheetAiChat = forwardRef<SpreadsheetAiChatRef>(function SpreadsheetAiChat(_props, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-[#1a73e8] to-[#4285f4] px-5 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-medium">AI Assistant</span>
      </button>
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
    <div className="fixed bottom-6 right-6 z-50 flex w-[400px] flex-col rounded-2xl border border-[#dadce0] bg-white/95 backdrop-blur-xl shadow-2xl" style={{ height: "520px" }}>
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
              I can analyze data, suggest charts, write formulas, auto-fill cells, and build dashboards
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

      {/* Input */}
      <div className="border-t border-[#e8eaed] px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]/30 transition-all">
          <Sparkles className="h-4 w-4 text-[#1a73e8] shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-[13px] text-[#202124] placeholder-[#80868b] outline-none"
            placeholder="Ask anything about your data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={cn(
              "rounded-full p-1.5 transition-all shrink-0",
              input.trim()
                ? "bg-[#1a73e8] text-white hover:bg-[#1557b0] scale-100"
                : "text-[#80868b] scale-90"
            )}
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex shrink-0 items-center gap-1 rounded-full border border-[#dadce0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5f6368] transition-colors hover:bg-[#e8eaed] hover:border-[#1a73e8]/30"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
