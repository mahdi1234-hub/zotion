"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Bot,
  MessageSquare,
  Send,
  X,
  Minimize2,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAiChat, ChatMessage } from "@/hooks/useAiChat";
import { useSettings } from "@/hooks/useSettings";
import { useSearch } from "@/hooks/useSearch";
import { parseUserMessage, getNotebookContent } from "@/lib/ai-agent";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export const AiChatWidget = () => {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const settings = useSettings();
  const search = useSearch();

  const {
    isOpen,
    messages,
    isProcessing,
    onToggle,
    onClose,
    addMessage,
    setProcessing,
    clearMessages,
  } = useAiChat();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const documents = useQuery(api.documents.getSearch);
  const createDocument = useMutation(api.documents.create);
  const updateDocument = useMutation(api.documents.update);
  const archiveDocument = useMutation(api.documents.archive);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const addAgentMessage = (content: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      role: "agent",
      content,
      timestamp: Date.now(),
    };
    addMessage(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInput("");

    // Handle clear command
    if (trimmed.toLowerCase() === "clear" || trimmed.toLowerCase() === "clear chat") {
      clearMessages();
      addAgentMessage("Chat cleared! How can I help you?");
      return;
    }

    setProcessing(true);

    try {
      const docs = (documents ?? []).map((d) => ({
        _id: d._id,
        title: d.title,
        icon: d.icon,
        isArchived: d.isArchived,
      }));

      const action = parseUserMessage(trimmed, docs);

      switch (action.type) {
        case "set_theme": {
          setTheme(action.theme);
          addAgentMessage(
            `Theme switched to **${action.theme}** mode! ${action.theme === "dark" ? "\ud83c\udf19" : action.theme === "light" ? "\u2600\ufe0f" : "\ud83d\udcbb"}`,
          );
          break;
        }

        case "open_settings": {
          settings.onOpen();
          addAgentMessage("Settings panel opened! \u2699\ufe0f");
          break;
        }

        case "open_search": {
          search.onOpen();
          addAgentMessage("Search panel opened! \ud83d\udd0d");
          break;
        }

        case "search_documents": {
          const matches = docs.filter(
            (d) =>
              !d.isArchived &&
              d.title.toLowerCase().includes(action.query.toLowerCase()),
          );
          if (matches.length === 0) {
            addAgentMessage(
              `No documents found matching "${action.query}". Try a different search term or create a new document!`,
            );
          } else {
            const list = matches
              .map((d) => `\u2022 ${d.icon || "\ud83d\udcc4"} **${d.title}**`)
              .join("\n");
            addAgentMessage(
              `Found ${matches.length} document(s) matching "${action.query}":\n\n${list}\n\nSay "open [name]" to navigate to one!`,
            );
          }
          break;
        }

        case "list_documents": {
          const activeDocs = docs.filter((d) => !d.isArchived);
          if (activeDocs.length === 0) {
            addAgentMessage(
              "Your workspace is empty! Say \"create a notebook about [subject]\" to get started.",
            );
          } else {
            const list = activeDocs
              .map((d) => `\u2022 ${d.icon || "\ud83d\udcc4"} **${d.title}**`)
              .join("\n");
            addAgentMessage(
              `Here are your documents (${activeDocs.length}):\n\n${list}\n\nSay "open [name]" to navigate to any document!`,
            );
          }
          break;
        }

        case "navigate_document": {
          const doc = docs.find((d) => d._id === action.documentId);
          router.push(`/documents/${action.documentId}`);
          addAgentMessage(
            `Navigating to **${doc?.title || "document"}**! \ud83d\ude80`,
          );
          break;
        }

        case "create_document": {
          const docId = await createDocument({ title: action.title });
          router.push(`/documents/${docId}`);
          addAgentMessage(
            `Created new page "**${action.title}**"! \ud83d\udcdd You've been navigated to it.`,
          );
          toast.success(`Page "${action.title}" created!`);
          break;
        }

        case "create_notebook": {
          const content = getNotebookContent(action.subject);
          const nbId = await createDocument({ title: action.title });
          await updateDocument({
            id: nbId as Id<"documents">,
            content,
            icon: action.icon,
          });
          router.push(`/documents/${nbId}`);
          addAgentMessage(
            `Created notebook "${action.icon || ""} **${action.title}**" with styled content! \ud83c\udf89\n\nThe notebook includes colorful headers and organized sections. Feel free to customize it!`,
          );
          toast.success(`Notebook "${action.title}" created!`);
          break;
        }

        case "archive_document": {
          const docToArchive = docs.find((d) => d._id === action.documentId);
          await archiveDocument({
            id: action.documentId as Id<"documents">,
          });
          addAgentMessage(
            `Document "**${docToArchive?.title || "document"}**" moved to trash! \ud83d\uddd1\ufe0f\n\nYou can restore it from the trash if needed.`,
          );
          toast.success("Document moved to trash.");
          break;
        }

        case "update_document": {
          const updateArgs: {
            id: Id<"documents">;
            title?: string;
            icon?: string;
          } = {
            id: action.documentId as Id<"documents">,
          };
          if (action.title) updateArgs.title = action.title;
          if (action.icon) updateArgs.icon = action.icon;
          await updateDocument(updateArgs);
          addAgentMessage(`Document updated successfully! \u2728`);
          toast.success("Document updated!");
          break;
        }

        case "reply": {
          addAgentMessage(action.message);
          break;
        }

        default: {
          addAgentMessage("I'm not sure how to handle that. Type **help** to see what I can do!");
        }
      }
    } catch (error) {
      console.error("AI Agent error:", error);
      addAgentMessage(
        "Oops! Something went wrong while processing your request. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content.split("\n").map((line, i) => {
      // Bold
      const formatted = line.replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="font-semibold">$1</strong>',
      );
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {i < content.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed right-6 bottom-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110",
          "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
          isOpen && "rotate-0 scale-0 opacity-0",
        )}
        aria-label="Open AI Chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed right-6 bottom-6 z-[9999] flex w-[380px] flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ease-in-out",
          "border border-border",
          resolvedTheme === "dark"
            ? "bg-[#1f1f1f] text-white"
            : "bg-white text-gray-900",
          isOpen
            ? "h-[520px] scale-100 opacity-100"
            : "pointer-events-none h-0 scale-95 opacity-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-semibold">Zotion AI Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => clearMessages()}
              className="rounded-lg p-1.5 transition-colors hover:bg-white/20"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors hover:bg-white/20"
              aria-label="Minimize chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20">
                <Bot className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Hi! I&apos;m your Zotion AI</p>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    resolvedTheme === "dark"
                      ? "text-gray-400"
                      : "text-gray-500",
                  )}
                >
                  I can create notebooks, manage your workspace, switch themes,
                  and more!
                </p>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {[
                  "Create a notebook about science",
                  "Switch to dark mode",
                  "Browse workspace",
                  "Help",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      setTimeout(() => {
                        const form = document.getElementById("ai-chat-form");
                        if (form)
                          form.dispatchEvent(
                            new Event("submit", {
                              bubbles: true,
                              cancelable: true,
                            }),
                          );
                      }, 50);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs transition-colors",
                      resolvedTheme === "dark"
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : resolvedTheme === "dark"
                      ? "bg-gray-700/70 text-gray-200"
                      : "bg-gray-100 text-gray-800",
                )}
              >
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm",
                  resolvedTheme === "dark"
                    ? "bg-gray-700/70 text-gray-300"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0ms]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:150ms]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          id="ai-chat-form"
          onSubmit={handleSubmit}
          className={cn(
            "flex items-center gap-2 border-t p-3",
            resolvedTheme === "dark" ? "border-gray-700" : "border-gray-200",
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isProcessing}
            className={cn(
              "flex-1 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors",
              resolvedTheme === "dark"
                ? "border-gray-600 bg-gray-700/50 text-white placeholder:text-gray-400 focus:border-blue-500"
                : "border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-blue-500",
            )}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
              input.trim()
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg"
                : resolvedTheme === "dark"
                  ? "bg-gray-700 text-gray-500"
                  : "bg-gray-100 text-gray-400",
            )}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
};
