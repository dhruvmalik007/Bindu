"use client";

import { useState } from 'react';

export default function ChatPage() {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; agent?: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = { role: 'user' as const, content: query };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: userMsg.content }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.response, agent: data.agent }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Error communicating with server." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Network error." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)]">
            <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4 mb-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">Start a conversation with your agent cluster.</div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                {msg.agent && <div className="text-xs text-indigo-300 mb-1 font-mono">Agent: {msg.agent}</div>}
                                <div>{msg.content}</div>
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 text-gray-200 rounded-lg p-3">...</div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                    placeholder="Ask something..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
