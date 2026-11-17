import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowLeft, Bot, Check, Copy, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/agents/$agentId")({
  component: AgentDetailPage,
});

interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  systemPrompt: string;
  tools: string[];
  model: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

function AgentDetailPage() {
  const { agentId } = useParams({ from: "/agents/$agentId" });
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/agents/${agentId}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        const agentData = data as Agent;
        if (agentData && agentData.id) {
          setAgent(agentData);
        }
      })
      .catch(console.error);
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !agent) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          message: userMessage,
          agent,
          messages: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantMessage += decoder.decode(value);
          setMessages((prev) => {
            const newMessages = [...prev];
            const last = newMessages[newMessages.length - 1];
            if (last?.role === "assistant") {
              last.content = assistantMessage;
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{agent.name}</h1>
            <p className="text-sm text-zinc-400">
              {agent.type.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-lg font-medium">
                Start a conversation with {agent.name}
              </p>
              <p className="text-sm mt-2">Ask me anything!</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  msg.role === "user" ? "bg-violet-600" : "bg-zinc-800"
                }`}
              >
                {msg.role === "user" ? (
                  <span className="text-white text-sm font-medium">U</span>
                ) : (
                  <Bot className="w-4 h-4 text-violet-400" />
                )}
              </div>
              <div
                className={`max-w-[70%] rounded-xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-900 text-zinc-100"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.role === "assistant" && msg.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(msg.content, i)}
                    className="mt-2 text-zinc-400 hover:text-white"
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check className="w-3 h-3 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
              <div className="bg-zinc-900 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>

      {agent.tools && agent.tools.length > 0 && (
        <div>
          <h3 className="font-medium text-white mb-3">Available Tools</h3>
          <div className="flex flex-wrap gap-2">
            {agent.tools.map((tool) => (
              <span
                key={tool}
                className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-sm"
              >
                {tool.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
