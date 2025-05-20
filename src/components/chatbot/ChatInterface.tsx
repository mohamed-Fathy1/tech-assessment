"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, RefreshCcw, User, Bot, Loader2 } from "lucide-react";
import { ChatbotDataDisplay } from "@/components/chatbot/ChatbotDataDisplay";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define the expected data type to match ChatbotDataDisplay props
interface ChatbotData {
  type: "tasks" | "project" | "employee-tasks" | "statistics";
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    project: string;
    assignedTo?: string;
  }>;
  project?: {
    id: string;
    name: string;
    description?: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    percentComplete: number;
  };
  employee?: {
    id: string;
    name: string;
  };
  statistics?: {
    projects: number;
    employees: number;
    tasks: {
      backlog: number;
      todo: number;
      inProgress: number;
      review: number;
      done: number;
      total: number;
    };
  };
}

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  data?: ChatbotData;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi there! How can I help you with your projects and tasks today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when loaded
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send to API
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add bot response to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.answer,
          data: data.data,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Sorry, I encountered an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
      // Focus input again after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "bot",
        content: "Hi there! How can I help you with your projects and tasks today?",
      },
    ]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full">
      <Card className="flex flex-col h-full overflow-hidden">
        <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            Blurr Assistant
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearChat}
                  aria-label="Clear conversation"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>

        {/* Chat messages area - scrollable */}
        <div
          className="flex-1 overflow-hidden"
          ref={scrollAreaRef}
        >
          <ScrollArea className="h-full px-4 py-4">
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "bot" && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.data && <ChatbotDataDisplay data={message.data} />}
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ml-2">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
                    <Bot className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input area - fixed at bottom */}
        <div className="p-4 border-t bg-background mt-auto">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Ask about your tasks or projects..."
              disabled={isLoading}
              className="flex-1"
              aria-label="Chat message input"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              size="icon"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
