/**
 * @movebridge/react - useBalance hook
 * Hook for fetching account balance
 */

import { useState, useEffect, useCallback } from 'react';
import { useMovementContext } from '../context';
import type { MovementError } from '@movebridge/core';

/**
 * Return type for useBalance hook
 */
export interface UseBalanceReturn {
    /** Account balance in smallest unit */
    balance: string | null;
    /** Whether balance is loading */
    loading: boolean;
    /** Error if fetch failed */
    error: MovementError | null;
    /** Refetch balance */
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching account balance
 *
 * @param address - Account address to fetch balance for (defaults to connected address)
 *
 * @example
 * ```tsx
 * function BalanceDisplay() {
 *   const { address } = useMovement();
 *   const { balance, loading, error, refetch } = useBalance(address);
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       Balance: {balance} octas
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBalance(address?: string | null): UseBalanceReturn {
    const { movement, address: connectedAddress, onError } = useMovementContext();
    const [balance, setBalance] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<MovementError | null>(null);

    const targetAddress = address ?? connectedAddress;

    const fetchBalance = useCallback(async () => {
        if (!movement || !targetAddress) {
            setBalance(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await movement.getAccountBalance(targetAddress);
            setBalance(result);
        } catch (err) {
            const movementError = err as MovementError;
            setError(movementError);
            setBalance(null);
            if (onError) {
                onError(movementError);
            }
        } finally {
            setLoading(false);
        }
    }, [movement, targetAddress, onError]);

    // Fetch balance when address changes
    useEffect(() => {
        let cancelled = false;

        const doFetch = async () => {
            if (!movement || !targetAddress) {
                setBalance(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const result = await movement.getAccountBalance(targetAddress);
                if (!cancelled) {
                    setBalance(result);
                }
            } catch (err) {
                if (!cancelled) {
                    const movementError = err as MovementError;
                    setError(movementError);
                    setBalance(null);
                    if (onError) {
                        onError(movementError);
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        doFetch();

        return () => {
            cancelled = true;
        };
    }, [movement, targetAddress, onError]);

    return {
        balance,
        loading,
        error,
        refetch: fetchBalance,
    };
}
