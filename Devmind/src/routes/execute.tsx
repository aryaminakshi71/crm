import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";

export const Route = createFileRoute("/execute")({
  component: ExecutePage,
});

const autonomousAgents = [
  {
    id: "workflow-automator",
    name: "Workflow Automator",
    description: "Automates complex multi-step workflows and business processes",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=workflow",
    systemPrompt: "You are an automation expert. Break down complex tasks into steps, execute them efficiently, and report progress.",
  },
  {
    id: "research-assistant",
    name: "Research Assistant",
    description: "Conducts research, gathers information, and summarizes findings",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=research",
    systemPrompt: "You are a research assistant. Gather information from reliable sources, organize findings, and provide comprehensive summaries.",
  },
];

function ExecutePage() {
  const [selectedAgent, setSelectedAgent] = useState(autonomousAgents[0]);
  const [task, setTask] = useState("");
  const [logs, setLogs] = useState<{ type: string; message: string; timestamp: Date }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (type: string, message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const handleExecute = async () => {
    if (!task.trim() || isRunning) return;

    setIsRunning(true);
    setLogs([]);
    setResult("");

    addLog("info", `Starting ${selectedAgent.name}...`);
    addLog("info", `Task: ${task}`);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          input: { task },
          agent: selectedAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to execute task");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResult = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.status === 'started') {
                addLog("success", "Agent initialized successfully");
              } else if (data.status === 'completed') {
                addLog("success", "Task completed!");
                setResult(data.result || fullResult);
              } else if (data.result) {
                fullResult += data.result;
                setResult(fullResult);
              }
            } catch {
              fullResult += line;
              setResult(fullResult);
            }
          }
        }
      }
    } catch (error) {
      addLog("error", `Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Execute Autonomous Task</h1>
          <a href="/agents" className="text-purple-600 hover:text-purple-700">
            View All Agents
          </a>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold mb-4">Select Agent</h2>
              <div className="space-y-3">
                {autonomousAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedAgent.id === agent.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={agent.avatarUrl} alt={agent.name} className="w-10 h-10 rounded-lg" />
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-gray-500">{agent.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold mb-2">{selectedAgent.name}</h2>
              <p className="text-sm text-gray-600 mb-4">{selectedAgent.description}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Input</label>
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Describe the task you want the agent to perform..."
                  rows={6}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  disabled={isRunning}
                />
              </div>
              <button
                onClick={handleExecute}
                disabled={isRunning || !task.trim()}
                className="w-full mt-4 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Executing...
                  </span>
                ) : (
                  "Execute Task"
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border h-[600px] flex flex-col">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold">Execution Log</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 font-mono text-sm">
                {logs.length === 0 && !result && (
                  <div className="text-gray-400 text-center py-12">
                    Execute a task to see the logs here
                  </div>
                )}
                
                {logs.map((log, i) => (
                  <div key={i} className="mb-2">
                    <span className="text-gray-400">[{log.timestamp.toLocaleTimeString()}]</span>{" "}
                    <span className={
                      log.type === "error" ? "text-red-500" :
                      log.type === "success" ? "text-green-500" :
                      log.type === "warning" ? "text-yellow-500" :
                      "text-blue-500"
                    }>{log.message}</span>
                  </div>
                ))}
                
                {result && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-gray-500 mb-2">Result:</div>
                    <div className="whitespace-pre-wrap text-gray-800">{result}</div>
                  </div>
                )}
                
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
