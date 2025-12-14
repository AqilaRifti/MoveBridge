/**
 * @movebridge/react - WalletButton component
 * Drop-in wallet connect button
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
 * Truncates an address for display
 */
function truncateAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * WalletButton component
 * Shows connect button when disconnected, address when connected
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

    const baseStyles = {
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
    };

    const connectedStyles = {
        ...baseStyles,
        backgroundColor: '#f0f0f0',
        color: '#333',
    };

    const disconnectedStyles = {
        ...baseStyles,
        backgroundColor: '#6366f1',
        color: 'white',
    };

    if (connected && address) {
        return (
            <button
                className={className}
                style={connectedStyles}
                onClick={disconnect}
                title="Click to disconnect"
            >
                {truncateAddress(address)}
            </button>
        );
    }

    return (
        <>
            <button
                className={className}
                style={disconnectedStyles}
                onClick={() => setModalOpen(true)}
                disabled={connecting}
            >
                {connecting ? 'Connecting...' : connectText}
            </button>
            <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
}
