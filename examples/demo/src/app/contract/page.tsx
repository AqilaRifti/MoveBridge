'use client'

import { useState } from 'react'
import { useMovement, useContract } from '@movebridge/react'

interface ContractFunction {
    name: string
    type: 'view' | 'entry'
    args: { name: string; placeholder: string }[]
    typeArgs: string[]
    desc: string
}

interface ExampleContract {
    name: string
    address: string
    module: string
    functions: ContractFunction[]
}

const EXAMPLE_CONTRACTS: ExampleContract[] = [
    {
        name: 'Account Module',
        address: '0x1',
        module: 'account',
        functions: [
            {
                name: 'exists_at',
                type: 'view',
                args: [{ name: 'address', placeholder: 'Account address (0x...)' }],
                typeArgs: [],
                desc: 'Check if an account exists at the given address'
            },
            {
                name: 'get_sequence_number',
                type: 'view',
                args: [{ name: 'address', placeholder: 'Account address (0x...)' }],
                typeArgs: [],
                desc: 'Get the sequence number for an account'
            },
        ],
    },
    {
        name: 'Coin Module',
        address: '0x1',
        module: 'coin',
        functions: [
            {
                name: 'balance',
                type: 'view',
                args: [{ name: 'address', placeholder: 'Account address (0x...)' }],
                typeArgs: ['0x1::aptos_coin::AptosCoin'],
                desc: 'Get MOVE token balance for an account'
            },
            {
                name: 'name',
                type: 'view',
                args: [],
                typeArgs: ['0x1::aptos_coin::AptosCoin'],
                desc: 'Get the name of the MOVE token'
            },
            {
                name: 'symbol',
                type: 'view',
                args: [],
                typeArgs: ['0x1::aptos_coin::AptosCoin'],
                desc: 'Get the symbol of the MOVE token'
            },
            {
                name: 'decimals',
                type: 'view',
                args: [],
                typeArgs: ['0x1::aptos_coin::AptosCoin'],
                desc: 'Get the decimal places for MOVE token'
            },
        ],
    },
    {
        name: 'String Utils',
        address: '0x1',
        module: 'string_utils',
        functions: [
            {
                name: 'to_string',
                type: 'view',
                args: [{ name: 'value', placeholder: 'Number to convert' }],
                typeArgs: ['u64'],
                desc: 'Convert a number to string'
            },
        ],
    },
]

export default function ContractPage() {
    const { connected, address } = useMovement()
    const [selectedContract, setSelectedContract] = useState<ExampleContract>(EXAMPLE_CONTRACTS[0])
    const [selectedFunction, setSelectedFunction] = useState<ContractFunction | null>(null)
    const [args, setArgs] = useState<string[]>([])
    const [result, setResult] = useState<unknown>(null)
    const [customMode, setCustomMode] = useState(false)

    // Custom contract state
    const [customAddress, setCustomAddress] = useState('')
    const [customModule, setCustomModule] = useState('')
    const [customFunction, setCustomFunction] = useState('')
    const [customArgs, setCustomArgs] = useState('')
    const [customTypeArgs, setCustomTypeArgs] = useState('')

    const { read, write, loading, error } = useContract({
        address: customMode ? customAddress : selectedContract.address,
        module: customMode ? customModule : selectedContract.module,
    })

    const handleSelectFunction = (fn: ContractFunction) => {
        setSelectedFunction(fn)
        setResult(null)
        // Pre-fill address argument with connected wallet
        const initialArgs = fn.args.map(arg =>
            arg.name === 'address' ? (address || '') : ''
        )
        setArgs(initialArgs)
    }

    const handleCall = async () => {
        if (!selectedFunction) return
        setResult(null)

        try {
            if (selectedFunction.type === 'view') {
                const res = await read(
                    selectedFunction.name,
                    args.filter(Boolean),
                    selectedFunction.typeArgs
                )
                setResult(res)
            } else {
                const txHash = await write(
                    selectedFunction.name,
                    args.filter(Boolean),
                    selectedFunction.typeArgs
                )
                setResult({ transactionHash: txHash, status: 'submitted' })
            }
        } catch (err) {
            console.error('Contract call failed:', err)
        }
    }

    const handleCustomCall = async () => {
        if (!customFunction) return
        setResult(null)

        try {
            const parsedArgs = customArgs ? customArgs.split(',').map(s => s.trim()).filter(Boolean) : []
            const parsedTypeArgs = customTypeArgs ? customTypeArgs.split(',').map(s => s.trim()).filter(Boolean) : []

            const res = await read(customFunction, parsedArgs, parsedTypeArgs)
            setResult(res)
        } catch (err) {
            console.error('Contract call failed:', err)
        }
    }

    if (!connected) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <div className="text-5xl mb-4">📜</div>
                <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Connect your wallet to interact with smart contracts.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Contract Interaction</h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Call view functions and execute transactions on Move modules.
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setCustomMode(false)}
                    className={`btn ${!customMode ? 'btn-primary' : 'btn-secondary'}`}
                >
                    Example Contracts
                </button>
                <button
                    onClick={() => setCustomMode(true)}
                    className={`btn ${customMode ? 'btn-primary' : 'btn-secondary'}`}
                >
                    Custom Contract
                </button>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Left Panel - Contract Selection */}
                <div className="lg:col-span-2 space-y-4">
                    {!customMode ? (
                        <>
                            {/* Contract List */}
                            <div className="card p-4">
                                <h2 className="font-medium mb-3 text-sm text-slate-500 uppercase tracking-wide">
                                    Select Contract
                                </h2>
                                <div className="space-y-2">
                                    {EXAMPLE_CONTRACTS.map((contract) => (
                                        <button
                                            key={`${contract.address}::${contract.module}`}
                                            onClick={() => {
                                                setSelectedContract(contract)
                                                setSelectedFunction(null)
                                                setResult(null)
                                            }}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedContract === contract
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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

                            {/* Function List */}
                            <div className="card p-4">
                                <h2 className="font-medium mb-3 text-sm text-slate-500 uppercase tracking-wide">
                                    Functions
                                </h2>
                                <div className="space-y-2">
                                    {selectedContract.functions.map((fn) => (
                                        <button
                                            key={fn.name}
                                            onClick={() => handleSelectFunction(fn)}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedFunction?.name === fn.name
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <code className="font-medium text-sm">{fn.name}</code>
                                                <span className={`badge text-xs ${fn.type === 'view' ? 'badge-info' : 'badge-warning'
                                                    }`}>
                                                    {fn.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">{fn.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Custom Contract Form */
                        <div className="card p-4 space-y-4">
                            <h2 className="font-medium mb-2">Custom Contract</h2>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    Contract Address
                                </label>
                                <input
                                    type="text"
                                    value={customAddress}
                                    onChange={(e) => setCustomAddress(e.target.value)}
                                    placeholder="0x1"
                                    className="input font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    Module Name
                                </label>
                                <input
                                    type="text"
                                    value={customModule}
                                    onChange={(e) => setCustomModule(e.target.value)}
                                    placeholder="coin"
                                    className="input font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    Function Name
                                </label>
                                <input
                                    type="text"
                                    value={customFunction}
                                    onChange={(e) => setCustomFunction(e.target.value)}
                                    placeholder="balance"
                                    className="input font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    Type Arguments (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={customTypeArgs}
                                    onChange={(e) => setCustomTypeArgs(e.target.value)}
                                    placeholder="0x1::aptos_coin::AptosCoin"
                                    className="input font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    Arguments (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={customArgs}
                                    onChange={(e) => setCustomArgs(e.target.value)}
                                    placeholder={address || '0x1'}
                                    className="input font-mono text-sm"
                                />
                            </div>
                            <button
                                onClick={handleCustomCall}
                                disabled={loading || !customAddress || !customModule || !customFunction}
                                className="btn btn-primary w-full"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <LoadingSpinner />
                                        Calling...
                                    </span>
                                ) : (
                                    'Call Function'
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel - Call & Result */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Function Call Form */}
                    {!customMode && selectedFunction && (
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-medium">
                                    <code>{selectedFunction.name}</code>
                                </h2>
                                <span className={`badge ${selectedFunction.type === 'view' ? 'badge-info' : 'badge-warning'
                                    }`}>
                                    {selectedFunction.type}
                                </span>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                {selectedFunction.desc}
                            </p>

                            {/* Type Arguments Display */}
                            {selectedFunction.typeArgs.length > 0 && (
                                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <label className="block text-xs text-slate-500 mb-1">Type Arguments</label>
                                    <code className="text-sm text-indigo-600 dark:text-indigo-400">
                                        {selectedFunction.typeArgs.join(', ')}
                                    </code>
                                </div>
                            )}

                            {/* Arguments */}
                            {selectedFunction.args.length > 0 && (
                                <div className="space-y-3 mb-4">
                                    {selectedFunction.args.map((arg, i) => (
                                        <div key={arg.name}>
                                            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                                {arg.name}
                                            </label>
                                            <input
                                                type="text"
                                                value={args[i] || ''}
                                                onChange={(e) => {
                                                    const newArgs = [...args]
                                                    newArgs[i] = e.target.value
                                                    setArgs(newArgs)
                                                }}
                                                placeholder={arg.placeholder}
                                                className="input font-mono text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleCall}
                                disabled={loading}
                                className="btn btn-primary w-full"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <LoadingSpinner />
                                        {selectedFunction.type === 'view' ? 'Reading...' : 'Submitting...'}
                                    </span>
                                ) : (
                                    selectedFunction.type === 'view' ? 'Read' : 'Execute'
                                )}
                            </button>
                        </div>
                    )}

                    {/* Result Display */}
                    <div className="card p-4">
                        <h2 className="font-medium mb-4">Result</h2>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">Executing...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-start gap-3">
                                    <span className="text-red-500 text-xl">⚠️</span>
                                    <div>
                                        <h3 className="font-medium text-red-800 dark:text-red-400">Error</h3>
                                        <p className="text-sm text-red-600 dark:text-red-300 mt-1 font-mono">
                                            {error.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : result !== null ? (
                            <div className="animate-fade-in">
                                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <div className="text-4xl mb-3">📋</div>
                                <p>Select a function and click Read/Execute to see results</p>
                            </div>
                        )}
                    </div>

                    {/* Code Example */}
                    {!customMode && selectedFunction && (
                        <div className="card p-4">
                            <h2 className="font-medium mb-3">Code Example</h2>
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                                {`import { useContract } from '@movebridge/react'

const { ${selectedFunction.type === 'view' ? 'read' : 'write'} } = useContract({
  address: '${selectedContract.address}',
  module: '${selectedContract.module}',
})

// Call the function
const result = await ${selectedFunction.type === 'view' ? 'read' : 'write'}(
  '${selectedFunction.name}',
  [${args.filter(Boolean).map(a => `'${a}'`).join(', ')}]${selectedFunction.typeArgs.length > 0 ? `,
  [${selectedFunction.typeArgs.map(t => `'${t}'`).join(', ')}]` : ''}
)`}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function LoadingSpinner() {
    return (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}
