/**
 * @movebridge/react - WalletButton component
 * Drop-in wallet connect button with improved UX
 */

import { useState } from 'react';
import { useMovement } from '../hooks/useMovement';
import { WalletModal } from './WalletModal';

/**
 * Props for WalletButton component
 */
export interface WalletButtonProps {
    /** Additional CSS class */
    className?: string;
    /** Text to show when disconnected */
    connectText?: string;
}

/**
 * Truncates an address for display (first 6 and last 4 characters)
 */
function truncateAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * WalletButton component
 * Shows connect button when disconnected, address when connected
 * Supports Razor, Nightly, and OKX wallets
 *
 * @example
 * ```tsx
 * <WalletButton />
 * <WalletButton connectText="Connect" className="my-button" />
 * ```
 */
export function WalletButton({ className = '', connectText = 'Connect Wallet' }: WalletButtonProps) {
    const { address, connected, connecting, disconnect } = useMovement();
    const [modalOpen, setModalOpen] = useState(false);

    const baseStyles: React.CSSProperties = {
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    };

    const connectedStyles: React.CSSProperties = {
        ...baseStyles,
        backgroundColor: '#f0f0f0',
        color: '#333',
    };

    const disconnectedStyles: React.CSSProperties = {
        ...baseStyles,
        backgroundColor: '#6366f1',
        color: 'white',
    };

    const connectingStyles: React.CSSProperties = {
        ...baseStyles,
        backgroundColor: '#818cf8',
        color: 'white',
        cursor: 'wait',
    };

    // Connected state - show truncated address, click to disconnect
    if (connected && address) {
        return (
            <button
                className={className}
                style={connectedStyles}
                onClick={disconnect}
                title="Click to disconnect"
                aria-label={`Connected as ${truncateAddress(address)}. Click to disconnect.`}
            >
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    display: 'inline-block'
                }} aria-hidden="true" />
                {truncateAddress(address)}
            </button>
        );
    }

    // Connecting state - show loading indicator
    if (connecting) {
        return (
            <button
                className={className}
                style={connectingStyles}
                disabled
                aria-label="Connecting to wallet"
            >
                <span style={{
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite',
                }} aria-hidden="true">⏳</span>
                Connecting...
            </button>
        );
    }

    // Disconnected state - show connect button
    return (
        <>
            <button
                className={className}
                style={disconnectedStyles}
                onClick={() => setModalOpen(true)}
                aria-label={connectText}
            >
                {connectText}
            </button>
            <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
}
