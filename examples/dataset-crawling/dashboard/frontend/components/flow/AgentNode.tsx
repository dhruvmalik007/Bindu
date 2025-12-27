import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Activity, Globe } from "lucide-react";
import { AgentInfo } from "@/lib/api";

// Mock Badge component since I haven't created it yet, or I can just use a span with classes
const StatusBadge = ({ status }: { status: string }) => {
  const color = status === 'running' ? 'bg-green-500' : status === 'failed' ? 'bg-red-500' : 'bg-gray-500';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${color}`}>
      {status}
    </span>
  );
};

interface AgentNodeProps {
  data: {
    agent: AgentInfo;
    onStart: (id: string) => void;
    onStop: (id: string) => void;
  };
}

const AgentNode = ({ data }: AgentNodeProps) => {
  const { agent, onStart, onStop } = data;
  const isRunning = agent.status === 'running';

  return (
    <div className="min-w-[300px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      
      <Card className={`border-2 ${isRunning ? 'border-green-500/50 shadow-green-500/20' : 'border-border'} shadow-lg transition-all`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {agent.config.name}
              </CardTitle>
              <CardDescription className="text-xs mt-1">{agent.config.type}</CardDescription>
            </div>
            <StatusBadge status={agent.status} />
          </div>
        </CardHeader>
        
        <CardContent className="text-sm space-y-3">
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {agent.config.description || "No description provided."}
          </p>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
             <div className="flex items-center gap-2">
                <Globe className="w-3 h-3" />
                <span>{agent.config.target_url || "No target URL"}</span>
             </div>
             <div className="flex items-center gap-2">
                <Activity className="w-3 h-3" />
                <span>Port: {agent.config.port}</span>
             </div>
          </div>

          <div className="flex gap-2 pt-2">
            {isRunning ? (
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full h-8"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent drag
                    onStop(agent.id);
                }}
              >
                <Square className="w-3 h-3 mr-2" /> Stop
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                className="w-full h-8"
                onClick={(e) => {
                    e.stopPropagation();
                    onStart(agent.id);
                }}
              >
                <Play className="w-3 h-3 mr-2" /> Start
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-muted-foreground" />
    </div>
  );
};

export default memo(AgentNode);
