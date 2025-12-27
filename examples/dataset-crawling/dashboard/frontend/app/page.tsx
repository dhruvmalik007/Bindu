"use client";

import { useState, useCallback, useEffect } from 'react';
import FlowEditor from '@/components/flow/FlowEditor';
import { TaskManager } from '@/components/task/TaskManager';
import { fetchAgents, AgentInfo } from '@/lib/api';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [agents, setAgents] = useState<AgentInfo[]>([]);

  const loadAgents = async () => {
    try {
      const data = await fetchAgents();
      setAgents(data);
    } catch (error) {
      console.error("Failed to load agents", error);
    }
  };

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card z-10">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
             B
           </div>
           <h1 className="font-bold text-lg">Bindu Orchestrator</h1>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* React Flow Canvas */}
        <div className="flex-1 relative border-r">
           <FlowEditor 
             onCreateAgent={() => {}} 
             key={refreshTrigger} 
           />
        </div>

        {/* Task Manager Sidebar */}
        <aside className="hidden md:flex w-[400px] flex-col bg-card h-full z-10 shadow-xl border-l">
           <TaskManager agents={agents} />
        </aside>
      </main>
    </div>
  );
}
