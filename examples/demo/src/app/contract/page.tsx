'use client'

import { useState } from 'react'
import { useMovement, useContract } from '@movebridge/react'

// Example contract interactions
const EXAMPLE_CONTRACTS = [
    {
        name: 'Coin Module',
        address: '0x1',
        module: 'coin',
        functions: [
            { name: 'balance', type: 'view', args: ['address'], desc: 'Get token balance' },
            { name: 'name', type: 'view', args: [], desc: 'Get coin name' },
            { name: 'symbol', type: 'view', args: [], desc: 'Get coin symbol' },
        ],
    },
    {
        name: 'Account Module',
        address: '0x1',
        module: 'account',
        functions: [
            { name: 'exists_at', type: 'view', args: ['address'], desc: 'Check if account exists' },
            { name: 'get_sequence_number', type: 'view', args: ['address'], desc: 'Get sequence number' },
        ],
    },
]

export default function ContractPage() {
    const { connected, address } = useMovement()
    const [selectedContract, setSelectedContract] = useState(EXAMPLE_CONTRACTS[0])
    const [customAddress, setCustomAddress] = useState('')
    const [customModule, setCustomModule] = useState('')
    const [functionName, setFunctionName] = useState('')
    const [args, setArgs] = useState<string[]>([])
    const [result, setResult] = useState<unknown>(null)

    const { read, write, loading, error } = useContract({
        address: customAddress || selectedContract.address,
        module: customModule || selectedContract.module,
    })

    const handleCall = async (fn: { name: string; type: string; args: string[] }) => {
        setResult(null)
        setFunctionName(fn.name)

        try {
            // Prepare arguments - replace 'address' placeholder with connected address
            const preparedArgs = fn.args.map((arg) =>
                arg === 'address' ? (address || '0x1') : ''
            )
            setArgs(preparedArgs)

            if (fn.type === 'view') {
                const res = await read(fn.name, preparedArgs)
                setResult(res)
            } else {
                const txHash = await write(fn.name, preparedArgs)
                setResult({ txHash })
            }
        } catch (err) {
            console.error('Contract call failed:', err)
        }
    }

    const handleCustomCall = async () => {
        if (!functionName) return
        setResult(null)

        try {
            const res = await read(functionName, args.filter(Boolean))
            setResult(res)
        } catch (err) {
            console.error('Contract call failed:', err)
        }
    }

    if (!connected) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Please connect your wallet to interact with contracts.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-2">Contract Interaction</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
                Call view functions and execute transactions on Move modules.
            </p>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Contract Selection */}
                <div className="space-y-6">
                    {/* Preset Contracts */}
                    <div className="card p-6">
                        <h2 className="font-medium mb-4">Example Contracts</h2>
                        <div className="space-y-2">
                            {EXAMPLE_CONTRACTS.map((contract) => (
                                <button
                                    key={`${contract.address}::${contract.module}`}
                                    onClick={() => {
                                        setSelectedContract(contract)
                                        setCustomAddress('')
                                        setCustomModule('')
                                    }}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedContract === contract && !customAddress
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="font-medium">{contract.name}</div>
                                    <code className="text-xs text-slate-500">
                                        {contract.address}::{contract.module}
                                    </code>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Contract */}
                    <div className="card p-6">
                        <h2 className="font-medium mb-4">Custom Contract</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={customAddress}
                                    onChange={(e) => setCustomAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="input font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    Module
                                </label>
                                <input
                                    type="text"
                                    value={customModule}
                                    onChange={(e) => setCustomModule(e.target.value)}
                                    placeholder="module_name"
                                    className="input font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    Function
                                </label>
                                <input
                                    type="text"
                                    value={functionName}
                                    onChange={(e) => setFunctionName(e.target.value)}
                                    placeholder="function_name"
                                    className="input font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    Arguments (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={args.join(', ')}
                                    onChange={(e) => setArgs(e.target.value.split(',').map(s => s.trim()))}
                                    placeholder="arg1, arg2, ..."
                                    className="input font-mono text-sm"
                                />
                            </div>
                            <button
                                onClick={handleCustomCall}
                                disabled={loading || !customAddress || !customModule || !functionName}
                                className="btn btn-primary w-full"
                            >
                                {loading ? 'Calling...' : 'Call Function'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Functions & Results */}
                <div className="space-y-6">
                    {/* Available Functions */}
                    {!customAddress && (
                        <div className="card p-6">
                            <h2 className="font-medium mb-4">
                                Functions - {selectedContract.name}
                            </h2>
                            <div className="space-y-2">
                                {selectedContract.functions.map((fn) => (
                                    <button
                                        key={fn.name}
                                        onClick={() => handleCall(fn)}
                                        disabled={loading}
                                        className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <code className="font-medium">{fn.name}</code>
                                            <span className={`badge ${fn.type === 'view' ? 'badge-info' : 'badge-warning'}`}>
                                                {fn.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">{fn.desc}</p>
                                        {fn.args.length > 0 && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Args: {fn.args.join(', ')}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Result Display */}
                    <div className="card p-6">
                        <h2 className="font-medium mb-4">Result</h2>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-red-600 dark:text-red-400 text-sm">
                                    {error.message}
                                </p>
                            </div>
                        ) : result !== null ? (
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        ) : (
                            <p className="text-slate-500 text-center py-8">
                                Select a function to call
                            </p>
                        )}
                    </div>

                    {/* Code Example */}
                    <div className="card p-6">
                        <h2 className="font-medium mb-4">Code Example</h2>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                            {`// Using useContract hook
const { read, write } = useContract({
  address: '${customAddress || selectedContract.address}',
  module: '${customModule || selectedContract.module}',
})

// View function
const result = await read('${functionName || 'function_name'}', [${args.map(a => `'${a}'`).join(', ')}])

// Entry function
const txHash = await write('transfer', [to, amount])`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}
