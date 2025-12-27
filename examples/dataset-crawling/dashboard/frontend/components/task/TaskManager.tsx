import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, CheckCircle, AlertCircle, Clock, FileText } from "lucide-react";
import { Context, Task, createTask, createContext, getTask, payTask, fetchSkills } from '@/lib/api';

interface TaskManagerProps {
  agents: any[];
}

export function TaskManager({ agents }: TaskManagerProps) {
  const [activeContext, setActiveContext] = useState<Context | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const handleStartSession = async () => {
    try {
        const context = await createContext("New Session", "User initiated session");
        setActiveContext(context);
    } catch (e) {
        console.error("Failed to create context", e);
    }
  };

  const handleCreateTask = async () => {
    if (!activeContext || !selectedAgentId || !newTaskContent) return;
    setLoading(true);
    try {
        const task = await createTask(activeContext.context_id, selectedAgentId, newTaskContent);
        setTasks(prev => [...prev, task]);
        setNewTaskContent('');
        
        // Poll for updates (simple implementation)
        pollTask(task.id);
    } catch (e) {
        console.error("Failed to create task", e);
    } finally {
        setLoading(false);
    }
  };

  const pollTask = async (taskId: string) => {
      const interval = setInterval(async () => {
          try {
              const updatedTask = await getTask(taskId);
              setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
              
              if (['completed', 'failed', 'canceled', 'payment-required'].includes(updatedTask.status.state)) {
                  clearInterval(interval);
              }
          } catch (e) {
              clearInterval(interval);
          }
      }, 2000);
  };

  const handlePayNow = async (taskId: string) => {
    try {
      const updated = await payTask(taskId);
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      pollTask(taskId);
    } catch (e) {
      console.error('Payment failed', e);
    }
  };

  useEffect(() => {
    if (!activeContext) return;
    let cancelled = false;
    (async () => {
      setSkillsLoading(true);
      try {
        const list = await fetchSkills();
        if (!cancelled) setSkills(list);
      } catch (e) {
        console.error('Failed to load skills', e);
      } finally {
        if (!cancelled) setSkillsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeContext]);

  if (!activeContext) {
      return (
          <div className="h-full flex items-center justify-center p-6">
              <Button onClick={handleStartSession} size="lg">
                  <Play className="w-4 h-4 mr-2" /> Start New Session
              </Button>
          </div>
      );
  }

  const runningAgents = agents.filter(a => a.status === 'running');

  return (
    <div className="flex flex-col h-full bg-background border-l w-[400px]">
        <div className="p-4 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2">
                Task Manager
                <Badge variant="outline" className="text-xs font-normal">
                    {activeContext.status}
                </Badge>
            </h2>
            <p className="text-xs text-muted-foreground truncate">{activeContext.context_id}</p>
        </div>

        <ScrollArea className="flex-1 p-4 space-y-4">
            <Card className="mb-4">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Skills</CardTitle>
                  <Badge variant="outline" className="text-xs font-normal">
                    {skillsLoading ? 'loading' : `${skills.length}`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {skillsLoading ? (
                  <div className="text-xs text-muted-foreground">Loading skills…</div>
                ) : skills.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No skills found.</div>
                ) : (
                  <div className="space-y-2">
                    {skills.slice(0, 8).map((s: any) => (
                      <div key={s.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{s.name || s.id}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{s.description}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                          {s.version || 'v1'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {tasks.map(task => (
                <Card key={task.id} className="mb-4">
                    <CardHeader className="p-3 pb-0">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-muted-foreground">{task.id.slice(0, 8)}...</span>
                            <StatusBadge state={task.status.state} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                        <div className="text-sm">
                            {task.history.find(m => m.role === 'user')?.parts[0].text}
                        </div>
                        
                        {task.status.message && (
                            <div className="bg-muted p-2 rounded text-xs mt-2">
                                {task.status.message.parts[0].text}
                            </div>
                        )}

                        {task.status.state === 'payment-required' && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handlePayNow(task.id)}
                          >
                            Pay Now
                          </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </ScrollArea>

        <div className="p-4 border-t space-y-3 bg-card">
            <div className="space-y-1">
                <label className="text-xs font-medium">Select Agent</label>
                <select 
                    className="w-full p-2 text-sm border rounded bg-background"
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                >
                    <option value="">Choose an agent...</option>
                    {runningAgents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                            {agent.config.name} ({agent.config.type})
                        </option>
                    ))}
                </select>
            </div>
            
            <div className="space-y-1">
                <label className="text-xs font-medium">Task Instructions</label>
                <Input 
                    value={newTaskContent}
                    onChange={(e) => setNewTaskContent(e.target.value)}
                    placeholder="Describe task..."
                    disabled={loading}
                />
            </div>

            <Button 
                className="w-full" 
                onClick={handleCreateTask}
                disabled={!selectedAgentId || !newTaskContent || loading}
            >
                {loading ? 'Submitting...' : 'Create Task'}
            </Button>
        </div>
    </div>
  );
}

function StatusBadge({ state }: { state: string }) {
    const styles: Record<string, string> = {
        'submitted': 'bg-blue-100 text-blue-800',
        'working': 'bg-yellow-100 text-yellow-800 animate-pulse',
        'completed': 'bg-green-100 text-green-800',
        'failed': 'bg-red-100 text-red-800',
    };
    
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${styles[state] || 'bg-gray-100 text-gray-800'}`}>
            {state}
        </span>
    );
}
