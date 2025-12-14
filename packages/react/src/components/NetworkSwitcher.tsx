/**
 * @movebridge/react - NetworkSwitcher component
 * Component for displaying and switching networks
 */

import { useMovementContext } from '../context';
import type { NetworkType } from '@movebridge/core';

/**
 * Props for NetworkSwitcher component
 */
export interface NetworkSwitcherProps {
    /** Additional CSS class */
    className?: string;
    /** Callback when network change is requested */
    onNetworkChange?: (network: NetworkType) => void;
}

/**
 * Network display info
 */
const NETWORK_INFO: Record<NetworkType, { name: string; color: string }> = {
    mainnet: { name: 'Mainnet', color: '#10b981' },
    testnet: { name: 'Testnet', color: '#f59e0b' },
};

/**
 * NetworkSwitcher component
 * Displays current network with option to switch
 *
 * Note: Switching networks requires re-initializing the provider.
 * This component shows the current network and can trigger a callback
 * for the parent to handle network switching.
 *
 * @example
 * ```tsx
 * <NetworkSwitcher onNetworkChange={(network) => setNetwork(network)} />
 * ```
 */
export function NetworkSwitcher({ className = '', onNetworkChange }: NetworkSwitcherProps) {
    const { network } = useMovementContext();

    const containerStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
    };

    const indicatorStyles: React.CSSProperties = {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: NETWORK_INFO[network].color,
    };

    const selectStyles: React.CSSProperties = {
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        fontSize: '14px',
        cursor: onNetworkChange ? 'pointer' : 'default',
    };

    if (!onNetworkChange) {
        // Display only mode
        return (
            <span className={className} style={containerStyles}>
                <span style={indicatorStyles} />
                <span>{NETWORK_INFO[network].name}</span>
            </span>
        );
    }

    return (
        <span className={className} style={containerStyles}>
            <span style={indicatorStyles} />
            <select
                style={selectStyles}
                value={network}
                onChange={(e) => onNetworkChange(e.target.value as NetworkType)}
            >
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
            </select>
        </span>
    );
}
