/**
 * @movebridge/react - Hooks Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MovementProvider, MovementContext, type MovementContextValue } from '../context';
import { useMovement } from '../hooks/useMovement';
import { useBalance } from '../hooks/useBalance';
import { useContract } from '../hooks/useContract';
import { useTransaction } from '../hooks/useTransaction';
import { useWaitForTransaction } from '../hooks/useWaitForTransaction';

// Mock @movebridge/core
vi.mock('@movebridge/core', () => ({
    Movement: vi.fn().mockImplementation(() => ({
        wallet: {
            detectWallets: vi.fn().mockReturnValue(['razor', 'nightly']),
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn().mockResolvedValue(undefined),
            getState: vi.fn().mockReturnValue({ connected: false, address: null, publicKey: null }),
            getWallet: vi.fn().mockReturnValue(null),
            on: vi.fn(),
            off: vi.fn(),
        },
        events: {
            unsubscribeAll: vi.fn(),
        },
        getAccountBalance: vi.fn().mockResolvedValue('1000000'),
        contract: vi.fn().mockReturnValue({
            view: vi.fn().mockResolvedValue('100'),
            call: vi.fn().mockResolvedValue('0x123abc'),
        }),
        transaction: {
            transfer: vi.fn().mockReturnValue({
                sign: vi.fn().mockResolvedValue({ signature: '0xsig' }),
                submit: vi.fn().mockResolvedValue('0xtxhash'),
            }),
        },
        waitForTransaction: vi.fn().mockResolvedValue({ success: true }),
    })),
    MovementError: class MovementError extends Error {
        code: string;
        constructor(code: string, message: string) {
            super(message);
            this.code = code;
        }
    },
}));

// Test wrapper with provider
function createWrapper(contextValue?: Partial<MovementContextValue>) {
    return function Wrapper({ children }: { children: ReactNode }) {
        if (contextValue) {
            return (
                <MovementContext.Provider value={contextValue as MovementContextValue}>
                    {children}
                </MovementContext.Provider>
            );
        }
        return <MovementProvider network="testnet">{children}</MovementProvider>;
    };
}

describe('useMovement', () => {
    it('should return wallet connection state', () => {
        const { result } = renderHook(() => useMovement(), {
            wrapper: createWrapper({
                movement: null,
                network: 'testnet',
                address: null,
                connected: false,
                connecting: false,
                wallets: ['razor', 'nightly'],
                wallet: null,
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        expect(result.current.address).toBeNull();
        expect(result.current.connected).toBe(false);
        expect(result.current.connecting).toBe(false);
        expect(result.current.wallets).toEqual(['razor', 'nightly']);
        expect(result.current.wallet).toBeNull();
    });

    it('should return connected state when wallet is connected', () => {
        const { result } = renderHook(() => useMovement(), {
            wrapper: createWrapper({
                movement: null,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: ['razor'],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        expect(result.current.address).toBe('0x123');
        expect(result.current.connected).toBe(true);
        expect(result.current.wallet).toBe('razor');
    });

    it('should provide connect function', () => {
        const mockConnect = vi.fn();
        const { result } = renderHook(() => useMovement(), {
            wrapper: createWrapper({
                movement: null,
                network: 'testnet',
                address: null,
                connected: false,
                connecting: false,
                wallets: ['razor'],
                wallet: null,
                connect: mockConnect,
                disconnect: vi.fn(),
            }),
        });

        expect(typeof result.current.connect).toBe('function');
    });

    it('should provide disconnect function', () => {
        const mockDisconnect = vi.fn();
        const { result } = renderHook(() => useMovement(), {
            wrapper: createWrapper({
                movement: null,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: ['razor'],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: mockDisconnect,
            }),
        });

        expect(typeof result.current.disconnect).toBe('function');
    });

    it('should throw error when used outside provider', () => {
        expect(() => {
            renderHook(() => useMovement());
        }).toThrow('useMovementContext must be used within a MovementProvider');
    });
});

describe('useBalance', () => {
    it('should return balance state', () => {
        const mockMovement = {
            getAccountBalance: vi.fn().mockResolvedValue('1000000'),
        };

        const { result } = renderHook(() => useBalance('0x123'), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        expect(result.current.balance).toBeNull(); // Initially null before fetch
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.refetch).toBe('function');
    });

    it('should fetch balance on mount', async () => {
        const mockGetBalance = vi.fn().mockResolvedValue('5000000');
        const mockMovement = {
            getAccountBalance: mockGetBalance,
        };

        const { result } = renderHook(() => useBalance('0x456'), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x456',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetBalance).toHaveBeenCalledWith('0x456');
        expect(result.current.balance).toBe('5000000');
    });

    it('should use connected address when no address provided', async () => {
        const mockGetBalance = vi.fn().mockResolvedValue('1000');
        const mockMovement = {
            getAccountBalance: mockGetBalance,
        };

        const { result } = renderHook(() => useBalance(), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0xconnected',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetBalance).toHaveBeenCalledWith('0xconnected');
    });

    it('should handle fetch errors', async () => {
        const mockError = new Error('Network error');
        const mockGetBalance = vi.fn().mockRejectedValue(mockError);
        const mockMovement = {
            getAccountBalance: mockGetBalance,
        };

        const { result } = renderHook(() => useBalance('0x123'), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBeTruthy();
        expect(result.current.balance).toBeNull();
    });
});

describe('useContract', () => {
    it('should return contract state', () => {
        const mockContract = {
            view: vi.fn().mockResolvedValue('100'),
            call: vi.fn().mockResolvedValue('0xhash'),
        };
        const mockMovement = {
            contract: vi.fn().mockReturnValue(mockContract),
        };

        const { result } = renderHook(() => useContract('0x1', 'coin'), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.read).toBe('function');
        expect(typeof result.current.write).toBe('function');
    });

    it('should call view function with read', async () => {
        const mockView = vi.fn().mockResolvedValue('42');
        const mockContract = {
            view: mockView,
            call: vi.fn(),
        };
        const mockMovement = {
            contract: vi.fn().mockReturnValue(mockContract),
        };

        const { result } = renderHook(() => useContract('0x1', 'counter'), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        await act(async () => {
            await result.current.read('get_count', []);
        });

        expect(mockView).toHaveBeenCalledWith('get_count', [], []);
    });

    it('should call entry function with write', async () => {
        const mockCall = vi.fn().mockResolvedValue('0xtxhash');
        const mockContract = {
            view: vi.fn(),
            call: mockCall,
        };
        const mockMovement = {
            contract: vi.fn().mockReturnValue(mockContract),
        };

        const { result } = renderHook(() => useContract('0x1', 'counter'), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        await act(async () => {
            await result.current.write('increment', []);
        });

        expect(mockCall).toHaveBeenCalledWith('increment', [], []);
    });
});

describe('useTransaction', () => {
    it('should return transaction state', () => {
        const mockMovement = {
            transaction: {
                build: vi.fn(),
                signAndSubmit: vi.fn(),
            },
        };

        const { result } = renderHook(() => useTransaction(), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.send).toBe('function');
        expect(typeof result.current.reset).toBe('function');
    });

    it('should reset state', async () => {
        const mockMovement = {
            transaction: {
                build: vi.fn().mockResolvedValue({ payload: 'test' }),
                signAndSubmit: vi.fn().mockResolvedValue('0xhash'),
            },
        };

        const { result } = renderHook(() => useTransaction(), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        // Send a transaction first
        await act(async () => {
            await result.current.send({
                function: '0x1::coin::transfer',
                typeArguments: [],
                arguments: ['0xrecipient', '1000'],
            });
        });

        expect(result.current.data).toBe('0xhash');

        // Reset
        act(() => {
            result.current.reset();
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
    });
});

describe('useWaitForTransaction', () => {
    it('should return waiting state', () => {
        const mockMovement = {
            waitForTransaction: vi.fn().mockResolvedValue({ success: true }),
        };

        const { result } = renderHook(() => useWaitForTransaction(null), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should wait for transaction when hash provided', async () => {
        const mockWait = vi.fn().mockResolvedValue({ success: true, hash: '0xhash' });
        const mockMovement = {
            waitForTransaction: mockWait,
        };

        const { result } = renderHook(() => useWaitForTransaction('0xhash'), {
            wrapper: createWrapper({
                movement: mockMovement as any,
                network: 'testnet',
                address: '0x123',
                connected: true,
                connecting: false,
                wallets: [],
                wallet: 'razor',
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // waitForTransaction is called with hash and options object
        expect(mockWait).toHaveBeenCalledWith('0xhash', expect.any(Object));
        expect(result.current.data).toEqual({ success: true, hash: '0xhash' });
    });
});
