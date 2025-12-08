"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Agent {
  id: string;
  status: string;
  config: {
    name: string;
    description: string;
    target_url: string;
    port: number;
  };
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      const res = await fetch('http://localhost:8000/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = async (id: string, action: 'start' | 'stop') => {
    try {
      await fetch(`http://localhost:8000/agents/${id}/${action}`, { method: 'POST' });
      fetchAgents();
    } catch (error) {
      console.error(`Failed to ${action} agent`, error);
    }
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <Link href="/setup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Create New Agent
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-gray-400">Loading agents...</p>
        ) : agents.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="mt-2 text-sm font-semibold text-white">No agents</h3>
            <p className="mt-1 text-sm text-gray-400">Get started by creating a new crawling agent.</p>
          </div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-700">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-white">{agent.config.name}</h3>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agent.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {agent.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-300">
                  <p>{agent.config.description}</p>
                  <p className="mt-1 text-xs font-mono text-gray-500">Target: {agent.config.target_url}</p>
                  <p className="mt-1 text-xs text-gray-500">Port: {agent.config.port}</p>
                </div>
                <div className="mt-4">
                  {agent.status === 'running' ? (
                    <button
                      onClick={() => toggleAgent(agent.id, 'stop')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleAgent(agent.id, 'start')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
