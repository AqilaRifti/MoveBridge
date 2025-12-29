'use client'

import { useState } from 'react'
import {
    useMovement,
    useBalance,
    WalletModal,
    AddressDisplay,
} from '@movebridge/react'

export default function DashboardPage() {
    const { address, connected, wallets, wallet } = useMovement()
    const { balance, loading: balanceLoading, refetch } = useBalance()
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!connected ? (
                <WelcomeSection
                    wallets={wallets}
                    onConnect={() => setModalOpen(true)}
                />
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Account Overview */}
                    <AccountOverview
                        address={address!}
                        balance={balance}
                        balanceLoading={balanceLoading}
                        wallet={wallet}
                        onRefresh={refetch}
                    />

                    {/* Quick Actions */}
                    <QuickActions />

                    {/* SDK Features */}
                    <FeaturesShowcase />
                </div>
            )}

            <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    )
}

function WelcomeSection({
    wallets,
    onConnect
}: {
    wallets: string[]
    onConnect: () => void
}) {
    return (
        <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-3xl">M</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">
                Welcome to MoveBridge
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                The complete SDK for building on Movement Network.
                Connect your wallet to explore the demo.
            </p>

            <button
                onClick={onConnect}
                className="btn btn-primary text-lg px-8 py-3"
            >
                Connect Wallet
            </button>

            {/* Available Wallets */}
            <div className="mt-12">
                <p className="text-sm text-slate-500 mb-4">Supported Wallets (Movement Network)</p>
                <div className="flex justify-center gap-4 flex-wrap">
                    {[
                        { id: 'petra', name: 'Petra', url: 'https://petra.app/' },
                        { id: 'pontem', name: 'Pontem', url: 'https://pontem.network/pontem-wallet' },
                        { id: 'nightly', name: 'Nightly', url: 'https://nightly.app/' },
                    ].map((w) => (
                        <div
                            key={w.id}
                            className={`px-4 py-2 rounded-lg border ${wallets.includes(w.id as 'petra' | 'pontem' | 'nightly')
                                ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800'
                                }`}
                        >
                            <span>{w.name}</span>
                            {wallets.includes(w.id as 'petra' | 'pontem' | 'nightly') ? (
                                <span className="ml-2 text-xs">✓ Detected</span>
                            ) : (
                                <a
                                    href={w.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-xs text-blue-500 hover:underline"
                                >
                                    Install
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Preview */}
            <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                    { icon: '💰', title: 'Token Transfers', desc: 'Send and receive MOVE tokens' },
                    { icon: '📜', title: 'Smart Contracts', desc: 'Interact with Move modules' },
                    { icon: '📡', title: 'Real-time Events', desc: 'Subscribe to blockchain events' },
                ].map((feature) => (
                    <div key={feature.title} className="card p-6 text-left">
                        <div className="text-3xl mb-3">{feature.icon}</div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AccountOverview({
    address,
    balance,
    balanceLoading,
    wallet,
    onRefresh,
}: {
    address: string
    balance: string | null
    balanceLoading: boolean
    wallet: string | null
    onRefresh: () => void
}) {
    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Account Overview</h2>
                <span className="badge badge-success capitalize">{wallet}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Address */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-500">Address</label>
                    <div className="flex items-center gap-2">
                        <AddressDisplay address={address} truncate copyable />
                    </div>
                </div>

                {/* Balance */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-500">Balance</label>
                    <div className="flex items-center gap-3">
                        {balanceLoading ? (
                            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        ) : (
                            <span className="text-2xl font-bold">
                                {formatBalance(balance)} <span className="text-base font-normal text-slate-500">MOVE</span>
                            </span>
                        )}
                        <button
                            onClick={onRefresh}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Refresh balance"
                        >
                            <RefreshIcon className={balanceLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function QuickActions() {
    return (
        <div className="grid md:grid-cols-4 gap-4">
            {[
                { href: '/transfer', icon: '↗️', label: 'Send', desc: 'Transfer tokens' },
                { href: '/transfer', icon: '↙️', label: 'Receive', desc: 'Get your address' },
                { href: '/contract', icon: '📜', label: 'Contract', desc: 'Call functions' },
                { href: '/events', icon: '📡', label: 'Events', desc: 'Watch activity' },
            ].map((action) => (
                <a
                    key={action.label}
                    href={action.href}
                    className="card card-hover p-4 flex items-center gap-4"
                >
                    <div className="text-2xl">{action.icon}</div>
                    <div>
                        <div className="font-medium">{action.label}</div>
                        <div className="text-sm text-slate-500">{action.desc}</div>
                    </div>
                </a>
            ))}
        </div>
    )
}

function FeaturesShowcase() {
    return (
        <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6">SDK Features</h2>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Code Example */}
                <div>
                    <h3 className="font-medium mb-3">Quick Start</h3>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                        {`import { Movement } from '@movebridge/core'
import { MovementProvider, useBalance } 
  from '@movebridge/react'

// Initialize SDK
const movement = new Movement({ 
  network: 'testnet' 
})

// Get balance
const balance = await movement
  .getAccountBalance('0x1...')

// React hook
function App() {
  const { balance } = useBalance()
  return <div>{balance} MOVE</div>
}`}
                    </pre>
                </div>

                {/* Feature List */}
                <div>
                    <h3 className="font-medium mb-3">What&apos;s Included</h3>
                    <ul className="space-y-3">
                        {[
                            { icon: '✅', text: 'Multi-wallet support (Petra, Pontem, Nightly)' },
                            { icon: '✅', text: 'Type-safe transaction building' },
                            { icon: '✅', text: 'React hooks for all operations' },
                            { icon: '✅', text: 'Pre-built UI components' },
                            { icon: '✅', text: 'Real-time event subscriptions' },
                            { icon: '✅', text: 'Contract code generation' },
                            { icon: '✅', text: 'Comprehensive testing utilities' },
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                                <span>{item.icon}</span>
                                <span>{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

function RefreshIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    )
}

function formatBalance(balance: string | null): string {
    if (!balance) return '0.00'
    const num = parseFloat(balance) / 1e8
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}
