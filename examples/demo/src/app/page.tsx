'use client'

import { useState } from 'react'
import {
    useMovement,
    useBalance,
    useTransaction,
    WalletButton,
    WalletModal,
    AddressDisplay,
    NetworkSwitcher
} from '@movebridge/react'

export default function Home() {
    const { address, connected, wallets } = useMovement()
    const { balance, loading: balanceLoading, refetch } = useBalance()
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <main className="min-h-screen p-8 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-12">
                <h1 className="text-3xl font-bold">MoveBridge Demo</h1>
                <div className="flex items-center gap-4">
                    <NetworkSwitcher />
                    <WalletButton />
                </div>
            </header>

            {!connected ? (
                <WelcomeSection onConnect={() => setModalOpen(true)} />
            ) : (
                <DashboardSection
                    address={address!}
                    balance={balance}
                    balanceLoading={balanceLoading}
                    onRefresh={refetch}
                />
            )}

            <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </main>
    )
}

function WelcomeSection({ onConnect }: { onConnect: () => void }) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4">Welcome to MoveBridge</h2>
            <p className="text-gray-600 mb-8">
                Connect your wallet to interact with Movement Network
            </p>
            <button
                onClick={onConnect}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
                Connect Wallet
            </button>
        </div>
    )
}

function DashboardSection({
    address,
    balance,
    balanceLoading,
    onRefresh
}: {
    address: string
    balance: string | null
    balanceLoading: boolean
    onRefresh: () => void
}) {
    return (
        <div className="space-y-8">
            {/* Account Info */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Account</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Address</span>
                        <AddressDisplay address={address} truncate copyable />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Balance</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono">
                                {balanceLoading ? 'Loading...' : `${formatBalance(balance)} MOVE`}
                            </span>
                            <button
                                onClick={onRefresh}
                                className="text-indigo-600 hover:text-indigo-800"
                            >
                                ↻
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transfer Section */}
            <TransferSection />
        </div>
    )
}

function TransferSection() {
    const { send, loading, data, error, reset } = useTransaction()
    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')

    const handleTransfer = async () => {
        if (!recipient || !amount) return

        try {
            await send({
                function: '0x1::aptos_account::transfer',
                typeArguments: [],
                arguments: [recipient, (parseFloat(amount) * 1e8).toString()],
            })
        } catch (err) {
            console.error('Transfer failed:', err)
        }
    }

    return (
        <section className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Transfer</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Recipient</label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">Amount (MOVE)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                <button
                    onClick={handleTransfer}
                    disabled={loading || !recipient || !amount}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Sending...' : 'Send'}
                </button>

                {data && (
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-green-800 text-sm">
                            Transaction sent! Hash: {data.slice(0, 10)}...
                        </p>
                        <button
                            onClick={reset}
                            className="text-green-600 text-sm underline mt-2"
                        >
                            Reset
                        </button>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-red-800 text-sm">Error: {error.message}</p>
                    </div>
                )}
            </div>
        </section>
    )
}

function formatBalance(balance: string | null): string {
    if (!balance) return '0'
    const num = parseFloat(balance) / 1e8
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
}
