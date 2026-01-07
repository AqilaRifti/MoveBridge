/**
 * @movebridge/react - Components Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MovementContext, type MovementContextValue } from '../context';
import { WalletButton } from '../components/WalletButton';
import { WalletModal } from '../components/WalletModal';
import { AddressDisplay } from '../components/AddressDisplay';
import { NetworkSwitcher } from '../components/NetworkSwitcher';

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
    },
});

// Test wrapper with context
function createWrapper(contextValue: Partial<MovementContextValue>) {
    const defaultValue: MovementContextValue = {
        movement: null,
        network: 'testnet',
        address: null,
        connected: false,
        connecting: false,
        wallets: ['razor', 'nightly', 'okx'],
        wallet: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
    };

    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <MovementContext.Provider value={{ ...defaultValue, ...contextValue }}>
                {children}
            </MovementContext.Provider>
        );
    };
}

describe('WalletButton', () => {
    it('should render connect button when disconnected', () => {
        const Wrapper = createWrapper({ connected: false });
        render(
            <Wrapper>
                <WalletButton />
            </Wrapper>
        );

        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should render custom connect text', () => {
        const Wrapper = createWrapper({ connected: false });
        render(
            <Wrapper>
                <WalletButton connectText="Link Wallet" />
            </Wrapper>
        );

        expect(screen.getByText('Link Wallet')).toBeInTheDocument();
    });

    it('should render truncated address when connected', () => {
        const Wrapper = createWrapper({
            connected: true,
            address: '0x1234567890abcdef1234567890abcdef12345678',
        });
        render(
            <Wrapper>
                <WalletButton />
            </Wrapper>
        );

        // Should show truncated address
        expect(screen.getByText(/0x1234/)).toBeInTheDocument();
        expect(screen.getByText(/5678/)).toBeInTheDocument();
    });

    it('should render connecting state', () => {
        const Wrapper = createWrapper({ connecting: true });
        render(
            <Wrapper>
                <WalletButton />
            </Wrapper>
        );

        expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        const Wrapper = createWrapper({ connected: false });
        render(
            <Wrapper>
                <WalletButton className="custom-class" />
            </Wrapper>
        );

        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
    });
});

describe('WalletModal', () => {
    it('should render available wallets', () => {
        const Wrapper = createWrapper({
            wallets: ['razor', 'nightly', 'okx'],
        });
        render(
            <Wrapper>
                <WalletModal open={true} onClose={vi.fn()} />
            </Wrapper>
        );

        expect(screen.getByText('Razor Wallet')).toBeInTheDocument();
        expect(screen.getByText('Nightly')).toBeInTheDocument();
        expect(screen.getByText('OKX Wallet')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        const Wrapper = createWrapper({
            wallets: ['razor'],
        });
        render(
            <Wrapper>
                <WalletModal open={false} onClose={vi.fn()} />
            </Wrapper>
        );

        expect(screen.queryByText('Razor Wallet')).not.toBeInTheDocument();
    });

    it('should call connect when wallet is clicked', async () => {
        const mockConnect = vi.fn().mockResolvedValue(undefined);
        const mockOnClose = vi.fn();
        const Wrapper = createWrapper({
            wallets: ['razor'],
            connect: mockConnect,
        });

        render(
            <Wrapper>
                <WalletModal open={true} onClose={mockOnClose} />
            </Wrapper>
        );

        const razorButton = screen.getByText('Razor Wallet');
        fireEvent.click(razorButton);

        expect(mockConnect).toHaveBeenCalledWith('razor');
    });

    it('should show no wallets message when none available', () => {
        const Wrapper = createWrapper({
            wallets: [],
        });

        render(
            <Wrapper>
                <WalletModal open={true} onClose={vi.fn()} />
            </Wrapper>
        );

        expect(screen.getByText(/no wallets/i)).toBeInTheDocument();
    });
});

describe('AddressDisplay', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render truncated address by default', () => {
        render(<AddressDisplay address="0x1234567890abcdef1234567890abcdef12345678" />);

        // Default is truncate=true
        expect(screen.getByText(/0x1234/)).toBeInTheDocument();
    });

    it('should render full address when truncate is false', () => {
        render(<AddressDisplay address="0x1234567890abcdef" truncate={false} />);

        expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument();
    });

    it('should copy address to clipboard when copy button clicked', async () => {
        render(<AddressDisplay address="0x123456" copyable />);

        // Find and click the copy button
        const copyButton = screen.getByTitle(/copy/i);
        fireEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x123456');
    });

    it('should not show copy button when copyable is false', () => {
        render(<AddressDisplay address="0x123456" copyable={false} />);

        expect(screen.queryByTitle(/copy/i)).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
        const { container } = render(<AddressDisplay address="0x123" className="custom-address" />);

        const element = container.querySelector('.custom-address');
        expect(element).toBeInTheDocument();
    });
});

describe('NetworkSwitcher', () => {
    it('should display current network', () => {
        const Wrapper = createWrapper({ network: 'testnet' });
        render(
            <Wrapper>
                <NetworkSwitcher />
            </Wrapper>
        );

        expect(screen.getByText(/testnet/i)).toBeInTheDocument();
    });

    it('should show select with network options when onNetworkChange provided', () => {
        const Wrapper = createWrapper({ network: 'testnet' });
        render(
            <Wrapper>
                <NetworkSwitcher onNetworkChange={vi.fn()} />
            </Wrapper>
        );

        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        expect(screen.getByText('Mainnet')).toBeInTheDocument();
        expect(screen.getByText('Testnet')).toBeInTheDocument();
    });

    it('should call onNetworkChange when network is selected', () => {
        const mockOnChange = vi.fn();
        const Wrapper = createWrapper({ network: 'testnet' });
        render(
            <Wrapper>
                <NetworkSwitcher onNetworkChange={mockOnChange} />
            </Wrapper>
        );

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'mainnet' } });

        expect(mockOnChange).toHaveBeenCalledWith('mainnet');
    });

    it('should apply custom className', () => {
        const Wrapper = createWrapper({ network: 'testnet' });
        const { container } = render(
            <Wrapper>
                <NetworkSwitcher className="custom-switcher" />
            </Wrapper>
        );

        const element = container.querySelector('.custom-switcher');
        expect(element).toBeInTheDocument();
    });
});
