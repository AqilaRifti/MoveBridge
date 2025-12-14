'use client'

import { MovementProvider } from '@movebridge/react'
import { useState } from 'react'
import type { NetworkType } from '@movebridge/core'

export function Providers({ children }: { children: React.ReactNode }) {
    const [network] = useState<NetworkType>('testnet')

    return (
        <MovementProvider
            network={network}
            autoConnect
            onError={(error) => console.error('Movement error:', error)}
        >
            {children}
        </MovementProvider>
    )
}
