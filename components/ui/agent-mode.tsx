"use client";

import { useState } from "react";
import { Brain, CheckCircle2, Circle } from "lucide-react";

interface Task {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  result?: string;
}

export function AgentMode() {
  const [currentTask, setCurrentTask] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask.trim() || isProcessing) return;

    setIsProcessing(true);
    // Simulate task breakdown
    const newTasks: Task[] = [
      {
        id: "1",
        description: "Analyzing task requirements",
        status: "pending",
      },
      {
        id: "2",
        description: "Breaking down into subtasks",
        status: "pending",
      },
      {
        id: "3",
        description: "Executing subtasks",
        status: "pending",
      },
      {
        id: "4",
        description: "Synthesizing results",
        status: "pending",
      },
    ];

    setTasks(newTasks);
    setCurrentTask("");

    // Simulate task execution
    for (let i = 0; i < newTasks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setTasks((prev) =>
        prev.map((task) =>
          task.id === newTasks[i].id ? { ...task, status: "in_progress" } : task
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));
      setTasks((prev) =>
        prev.map((task) =>
          task.id === newTasks[i].id
            ? {
                ...task,
                status: "completed",
                result: `Completed ${task.description}`,
              }
            : task
        )
      );
    }

    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-[#222639] bg-[#11131d]/30 backdrop-blur-sm relative">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#99a3ff]/10 to-transparent" />
        <div className="w-[68px]" />
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#99a3ff]" />
          <h2 className="font-mono text-sm text-[#a4a9c3]">Agent Mode</h2>
        </div>
        <div className="w-[68px]" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                placeholder="Enter a task to break down..."
                className="flex-1 bg-[#1e2235] border border-[#222639] rounded-lg px-4 py-2 text-sm text-white placeholder:text-[#a4a9c3] focus:outline-none focus:border-[#99a3ff]"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!currentTask.trim() || isProcessing}
                className="px-4 py-2 bg-[#99a3ff] text-white rounded-lg text-sm font-mono hover:bg-[#99a3ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Start"}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-[#1e2235] border border-[#222639] rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  {task.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
                  ) : task.status === "in_progress" ? (
                    <Circle className="w-5 h-5 text-[#99a3ff] animate-pulse" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#a4a9c3]" />
                  )}
                  <span className="text-sm text-white">{task.description}</span>
                </div>
                {task.result && (
                  <div className="ml-8 text-sm text-[#a4a9c3]">
                    {task.result}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
