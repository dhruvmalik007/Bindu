import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AgentInfo, fetchAgents, startAgent, stopAgent } from '@/lib/api';
import AgentNode from './AgentNode';
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";

// Define node types
const nodeTypes = {
  agent: AgentNode,
};

interface FlowEditorProps {
  onCreateAgent: () => void;
}

const FlowEditor: React.FC<FlowEditorProps> = ({ onCreateAgent }) => {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  // Function to refresh agents and update nodes
  const refreshAgents = useCallback(async () => {
    setLoading(true);
    try {
      const agents = await fetchAgents();
      
      // Map agents to nodes
      // Simple layout logic: Grid layout
      const newNodes: Node[] = agents.map((agent, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        
        return {
          id: agent.id,
          type: 'agent',
          position: { x: col * 350 + 50, y: row * 300 + 50 },
          data: { 
            agent,
            onStart: async (id: string) => {
                await startAgent(id);
                refreshAgents();
            },
            onStop: async (id: string) => {
                await stopAgent(id);
                refreshAgents();
            }
          },
        };
      });

      // Maintain existing positions if node already exists?
      // For now, just reset positions to keep it simple, or merge.
      // Merging would be better to prevent jumping.
      setNodes((nds) => {
          return newNodes.map((n) => {
             const existing = nds.find((ex) => ex.id === n.id);
             if (existing) {
                 return { ...n, position: existing.position };
             }
             return n;
          });
      });

    } catch (error) {
      console.error("Failed to fetch agents", error);
    } finally {
      setLoading(false);
    }
  }, [setNodes]);

  // Initial fetch
  useEffect(() => {
    refreshAgents();
    // Optional: Poll every 5 seconds
    const interval = setInterval(refreshAgents, 5000);
    return () => clearInterval(interval);
  }, [refreshAgents]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-[800px] border rounded-lg bg-background relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-right" className="flex gap-2">
            <Button onClick={refreshAgents} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            <Button onClick={onCreateAgent} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
            </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default FlowEditor;
