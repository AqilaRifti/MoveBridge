'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMovement, WalletButton, NetworkSwitcher } from '@movebridge/react'
import { useNetworkSwitch } from '../providers'

const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/transfer', label: 'Transfer' },
    { href: '/contract', label: 'Contract' },
    { href: '/events', label: 'Events' },
]

export function Navigation() {
    const pathname = usePathname()
    const { connected } = useMovement()
    const { setNetwork } = useNetworkSwitch()

    return (
        <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo & Nav Links */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">M</span>
                            </div>
                            <span className="font-semibold text-lg">MoveBridge</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === item.href
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {/* Network Switcher - using SDK component */}
                        <NetworkSwitcher
                            onNetworkChange={setNetwork}
                            className="network-switcher"
                        />

                        {/* Connection Status */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-400'}`} />
                            <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:inline">
                                {connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>

                        {/* Wallet Button - using SDK component */}
                        <WalletButton className="wallet-btn" />
                    </div>
                </div>
            </div>
        </nav>
    )
}
