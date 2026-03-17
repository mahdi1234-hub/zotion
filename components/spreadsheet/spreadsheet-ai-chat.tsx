"use client";

import React, { useState, useRef, useEffect } from "react";
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
}

export function SpreadsheetAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { getAllData, getHeaders, addChart, setShowDashboard } = useSpreadsheetStore();

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

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Sorry, I couldn't process that request.",
        chartSuggestion: data.chartSuggestion,
      };

      setMessages((prev) => [...prev, assistantMessage]);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a73e8] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1557b0]"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[380px] flex-col rounded-xl border border-[#dadce0] bg-white shadow-2xl" style={{ height: "500px" }}>
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl bg-gradient-to-r from-[#1a73e8] to-[#4285f4] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-white" />
          <span className="text-sm font-semibold text-white">Zotion AI Assistant</span>
        </div>
        <button
          className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex gap-1.5 border-b border-[#e8eaed] px-3 py-2">
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-3 h-10 w-10 text-[#1a73e8]/30" />
            <p className="text-sm font-medium text-[#5f6368]">Ask me anything about your data</p>
            <p className="mt-1 text-xs text-[#80868b]">
              I can analyze data, suggest charts, write formulas, and more
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "mb-3 max-w-[90%] rounded-lg px-3 py-2 text-[13px] leading-relaxed",
              msg.role === "user"
                ? "ml-auto bg-[#1a73e8] text-white"
                : "bg-[#f1f3f4] text-[#202124]"
            )}
          >
            <div className="whitespace-pre-wrap">{msg.content.replace(/```chart[\s\S]*?```/g, "").trim()}</div>
            {msg.chartSuggestion && (
              <button
                className="mt-2 flex items-center gap-1 rounded-md bg-[#1a73e8] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#1557b0]"
                onClick={() => handleAddChart(msg.chartSuggestion)}
              >
                <BarChart3 className="h-3 w-3" />
                Add {msg.chartSuggestion.type} chart to dashboard
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
      <div className="border-t border-[#e8eaed] px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-[#dadce0] bg-[#f8f9fa] px-3 py-1.5">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-[13px] text-[#202124] placeholder-[#80868b] outline-none"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={cn(
              "rounded-full p-1.5 transition-colors",
              input.trim()
                ? "bg-[#1a73e8] text-white hover:bg-[#1557b0]"
                : "text-[#80868b]"
            )}
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1 text-center text-[10px] text-[#80868b]">
          Powered by Cerebras AI
        </p>
      </div>
    </div>
  );
}

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
      className="flex items-center gap-1 rounded-full border border-[#dadce0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5f6368] transition-colors hover:bg-[#e8eaed]"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
