'use client'

import { useState } from 'react'
import {
    useMovement,
    useBalance,
    useTransaction,
    useWaitForTransaction,
    AddressDisplay,
} from '@movebridge/react'

export default function TransferPage() {
    const { address, connected } = useMovement()
    const { balance, refetch: refetchBalance } = useBalance()
    const { send, loading, data: txHash, error, reset } = useTransaction()
    const { data: txResponse, loading: waitLoading } = useWaitForTransaction(txHash ?? undefined)

    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')

    const handleTransfer = async () => {
        if (!recipient || !amount) return

        try {
            // Convert MOVE to octas (1 MOVE = 10^8 octas)
            const amountInOctas = (parseFloat(amount) * 1e8).toString()

            await send({
                function: '0x1::aptos_account::transfer',
                typeArguments: [],
                arguments: [recipient, amountInOctas],
            })
        } catch (err) {
            console.error('Transfer failed:', err)
        }
    }

    const handleReset = () => {
        reset()
        setRecipient('')
        setAmount('')
        refetchBalance()
    }

    if (!connected) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Please connect your wallet to make transfers.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8">Transfer MOVE</h1>

            <div className="space-y-6">
                {/* From Account */}
                <div className="card p-6">
                    <h2 className="font-medium mb-4">From</h2>
                    <div className="flex items-center justify-between">
                        <AddressDisplay address={address!} truncate />
                        <span className="text-slate-600 dark:text-slate-400">
                            Balance: {formatBalance(balance)} MOVE
                        </span>
                    </div>
                </div>

                {/* Transfer Form */}
                <div className="card p-6 space-y-4">
                    <h2 className="font-medium">Transfer Details</h2>

                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                            Recipient Address
                        </label>
                        <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="0x..."
                            className="input font-mono text-sm"
                            disabled={loading || !!txHash}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                            Amount (MOVE)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.0001"
                                min="0"
                                className="input pr-20"
                                disabled={loading || !!txHash}
                            />
                            <button
                                onClick={() => setAmount(formatBalance(balance))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-indigo-600 hover:text-indigo-800"
                                disabled={loading || !!txHash}
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    {/* Quick Amounts */}
                    <div className="flex gap-2">
                        {['0.1', '1', '10', '100'].map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setAmount(amt)}
                                className="btn btn-secondary text-sm flex-1"
                                disabled={loading || !!txHash}
                            >
                                {amt} MOVE
                            </button>
                        ))}
                    </div>

                    {/* Submit Button */}
                    {!txHash ? (
                        <button
                            onClick={handleTransfer}
                            disabled={loading || !recipient || !amount || parseFloat(amount) <= 0}
                            className="btn btn-primary w-full py-3"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <LoadingSpinner />
                                    Sending...
                                </span>
                            ) : (
                                'Send Transfer'
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleReset}
                            className="btn btn-secondary w-full py-3"
                        >
                            New Transfer
                        </button>
                    )}
                </div>

                {/* Transaction Status */}
                {txHash && (
                    <TransactionStatus
                        hash={txHash}
                        txResponse={txResponse}
                        loading={waitLoading}
                        error={error}
                    />
                )}

                {/* Error Display */}
                {error && !txHash && (
                    <div className="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-3">
                            <span className="text-red-500">⚠️</span>
                            <div>
                                <h3 className="font-medium text-red-800 dark:text-red-400">
                                    Transaction Failed
                                </h3>
                                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                    {error.message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function TransactionStatus({
    hash,
    txResponse,
    loading,
    error,
}: {
    hash: string
    txResponse: { success: boolean; vmStatus: string } | null
    loading: boolean
    error: Error | null
}) {
    return (
        <div className="card p-6 animate-fade-in">
            <h2 className="font-medium mb-4">Transaction Status</h2>

            <div className="space-y-4">
                {/* Hash */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Hash</span>
                    <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {hash.slice(0, 10)}...{hash.slice(-8)}
                    </code>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                    {loading ? (
                        <span className="badge badge-warning flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            Confirming...
                        </span>
                    ) : txResponse?.success ? (
                        <span className="badge badge-success">✓ Confirmed</span>
                    ) : error ? (
                        <span className="badge badge-error">✗ Failed</span>
                    ) : (
                        <span className="badge badge-info">Pending</span>
                    )}
                </div>

                {/* VM Status */}
                {txResponse && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">VM Status</span>
                        <span className="text-sm">{txResponse.vmStatus}</span>
                    </div>
                )}

                {/* Explorer Link */}
                <a
                    href={`https://explorer.movementlabs.xyz/txn/${hash}?network=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full text-center"
                >
                    View on Explorer ↗
                </a>
            </div>
        </div>
    )
}

function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    return (
        <svg className={`${sizeClass} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}

function formatBalance(balance: string | null): string {
    if (!balance) return '0.00'
    const num = parseFloat(balance) / 1e8
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}
