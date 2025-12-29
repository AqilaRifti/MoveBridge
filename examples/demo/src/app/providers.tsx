'use client'

import { MovementProvider } from '@movebridge/react'
import { useState, useCallback, createContext, useContext } from 'react'
import type { NetworkType, MovementError } from '@movebridge/core'

// Context for network switching (requires provider remount)
interface NetworkContextValue {
    network: NetworkType
    setNetwork: (network: NetworkType) => void
}

const NetworkContext = createContext<NetworkContextValue>({
    network: 'testnet',
    setNetwork: () => { },
})

export const useNetworkSwitch = () => useContext(NetworkContext)

export function Providers({ children }: { children: React.ReactNode }) {
    const [network, setNetwork] = useState<NetworkType>('testnet')
    const [lastError, setLastError] = useState<MovementError | null>(null)

    const handleError = useCallback((error: MovementError) => {
        console.error('Movement SDK Error:', error)
        setLastError(error)

        // Auto-clear error after 5 seconds
        setTimeout(() => setLastError(null), 5000)
    }, [])

    return (
        <NetworkContext.Provider value={{ network, setNetwork }}>
            <MovementProvider
                key={network} // Remount provider when network changes
                network={network}
                autoConnect
                onError={handleError}
            >
                {children}

                {/* Global Error Toast */}
                {lastError && (
                    <div className="fixed bottom-4 right-4 max-w-md animate-fade-in z-50">
                        <div className="bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-red-500 text-xl">⚠️</span>
                                <div className="flex-1">
                                    <h4 className="font-medium text-red-800 dark:text-red-200">
                                        {lastError.code}
                                    </h4>
                                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                        {lastError.message}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setLastError(null)}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </MovementProvider>
        </NetworkContext.Provider>
    )
}
