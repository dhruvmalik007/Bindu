"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        target_url: '',
        instructions: '',
        port: 8000,
        observability: {
            enabled: true,
            otlp_endpoint: '',
            service_name: ''
        },
        storage: {
            type: 'memory',
            connection_string: ''
        },
        auth: {
            enabled: false,
            provider: 'auth0',
            domain: '',
            audience: ''
        },
        payment: {
            enabled: false,
            amount: '0.01',
            token: 'USDC',
            network: 'base-sepolia',
            pay_to_address: ''
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8000/agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/');
            } else {
                alert('Failed to create agent');
            }
        } catch (error) {
            console.error('Error creating agent:', error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <h1 className="text-2xl font-bold text-white mb-6">Create New Agent</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg border border-gray-700">

                {/* Basic Info */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-200">Basic Information</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Description</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Target URL</label>
                        <input
                            type="url"
                            required
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            value={formData.target_url}
                            onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Port</label>
                        <input
                            type="number"
                            required
                            min="1024"
                            max="65535"
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            value={formData.port}
                            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Instructions</label>
                        <textarea
                            required
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            value={formData.instructions}
                            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        />
                    </div>
                </div>

                <hr className="border-gray-700" />

                {/* Observability */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-200 mb-2">Observability</h2>
                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="observability"
                            checked={formData.observability.enabled}
                            onChange={(e) => setFormData({ ...formData, observability: { ...formData.observability, enabled: e.target.checked } })}
                            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="observability" className="ml-2 block text-sm text-gray-300">
                            Enable OpenTelemetry Tracing
                        </label>
                    </div>
                    {formData.observability.enabled && (
                        <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-700">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">OTLP Endpoint (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="http://localhost:6006/v1/traces"
                                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                    value={formData.observability.otlp_endpoint}
                                    onChange={(e) => setFormData({ ...formData, observability: { ...formData.observability, otlp_endpoint: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Service Name (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="crawler-agent"
                                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                    value={formData.observability.service_name}
                                    onChange={(e) => setFormData({ ...formData, observability: { ...formData.observability, service_name: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-gray-700" />

                {/* Storage */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-200 mb-2">Storage & Memory</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Storage Backend</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                value={formData.storage.type}
                                onChange={(e) => setFormData({ ...formData, storage: { ...formData.storage, type: e.target.value } })}
                            >
                                <option value="memory">In-Memory (Non-persistent)</option>
                                <option value="postgres">PostgreSQL</option>
                            </select>
                        </div>
                        {formData.storage.type === 'postgres' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Connection String</label>
                                <input
                                    type="text"
                                    placeholder="postgresql+asyncpg://user:pass@localhost:5432/db"
                                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                    value={formData.storage.connection_string}
                                    onChange={(e) => setFormData({ ...formData, storage: { ...formData.storage, connection_string: e.target.value } })}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <hr className="border-gray-700" />

                {/* Authentication */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-200">Authentication</h2>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="auth_enabled"
                                checked={formData.auth.enabled}
                                onChange={(e) => setFormData({ ...formData, auth: { ...formData.auth, enabled: e.target.checked } })}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="auth_enabled" className="ml-2 block text-sm text-gray-300">
                                Enable Auth
                            </label>
                        </div>
                    </div>

                    {formData.auth.enabled && (
                        <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-700">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Provider</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                    value={formData.auth.provider}
                                    onChange={(e) => setFormData({ ...formData, auth: { ...formData.auth, provider: e.target.value } })}
                                >
                                    <option value="auth0">Auth0</option>
                                    <option value="cognito">Cognito</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Domain</label>
                                <input
                                    type="text"
                                    placeholder="dev-xyz.us.auth0.com"
                                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                    value={formData.auth.domain || ''}
                                    onChange={(e) => setFormData({ ...formData, auth: { ...formData.auth, domain: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Audience</label>
                                <input
                                    type="text"
                                    placeholder="https://api.example.com"
                                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                    value={formData.auth.audience || ''}
                                    onChange={(e) => setFormData({ ...formData, auth: { ...formData.auth, audience: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-gray-700" />

                {/* Payment */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-200">Execution Cost (Payments)</h2>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="payment_enabled"
                                checked={formData.payment.enabled}
                                onChange={(e) => setFormData({ ...formData, payment: { ...formData.payment, enabled: e.target.checked } })}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="payment_enabled" className="ml-2 block text-sm text-gray-300">
                                Enable Payments
                            </label>
                        </div>
                    </div>

                    {formData.payment.enabled && (
                        <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-700">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Amount</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                        value={formData.payment.amount}
                                        onChange={(e) => setFormData({ ...formData, payment: { ...formData.payment, amount: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Token</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                        value={formData.payment.token}
                                        onChange={(e) => setFormData({ ...formData, payment: { ...formData.payment, token: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Wallet Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                    value={formData.payment.pay_to_address || ''}
                                    onChange={(e) => setFormData({ ...formData, payment: { ...formData.payment, pay_to_address: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Create Agent
                    </button>
                </div>
            </form>
        </div>
    );
}
