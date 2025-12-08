"use client";
import Link from 'next/link';

import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white";

    return (
        <nav className="bg-gray-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className="text-white font-bold text-xl">Bindu Dashboard</span>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link href="/" className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/')}`}>
                                    Home
                                </Link>
                                <Link href="/setup" className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/setup')}`}>
                                    Agent Setup
                                </Link>
                                <Link href="/chat" className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/chat')}`}>
                                    Chat
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
