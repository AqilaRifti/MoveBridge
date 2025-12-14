/**
 * @movebridge/react - useWaitForTransaction hook
 * Hook for waiting for transaction confirmation
 */

import { useState, useEffect } from 'react';
import { useMovementContext } from '../context';
import type { MovementError, TransactionResponse } from '@movebridge/core';

/**
 * Return type for useWaitForTransaction hook
 */
export interface UseWaitForTransactionReturn {
    /** Transaction response */
    data: TransactionResponse | null;
    /** Whether waiting for confirmation */
    loading: boolean;
    /** Error if confirmation failed */
    error: MovementError | null;
}

/**
 * Options for useWaitForTransaction hook
 */
export interface UseWaitForTransactionOptions {
    /** Timeout in milliseconds */
    timeoutMs?: number;
    /** Check interval in milliseconds */
    checkIntervalMs?: number;
}

/**
 * Hook for waiting for transaction confirmation
 *
 * @param hash - Transaction hash to wait for
 * @param options - Wait options
 *
 * @example
 * ```tsx
 * function TransactionStatus({ hash }: { hash: string }) {
 *   const { data, loading, error } = useWaitForTransaction(hash);
 *
 *   if (loading) return <div>Waiting for confirmation...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return null;
 *
 *   return (
 *     <div>
 *       <p>Status: {data.success ? 'Success' : 'Failed'}</p>
 *       <p>Gas used: {data.gasUsed}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWaitForTransaction(
    hash: string | null | undefined,
    options?: UseWaitForTransactionOptions
): UseWaitForTransactionReturn {
    const { movement, onError } = useMovementContext();
    const [data, setData] = useState<TransactionResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<MovementError | null>(null);

    useEffect(() => {
        if (!hash || !movement) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;

        const waitForTx = async () => {
            setLoading(true);
            setError(null);

            try {
                const waitOptions: { timeoutMs?: number; checkIntervalMs?: number } = {};
                if (options?.timeoutMs !== undefined) {
                    waitOptions.timeoutMs = options.timeoutMs;
                }
                if (options?.checkIntervalMs !== undefined) {
                    waitOptions.checkIntervalMs = options.checkIntervalMs;
                }
                const response = await movement.waitForTransaction(hash, waitOptions);

                if (!cancelled) {
                    setData(response);
                }
            } catch (err) {
                if (!cancelled) {
                    const movementError = err as MovementError;
                    setError(movementError);
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

        waitForTx();

        return () => {
            cancelled = true;
        };
    }, [hash, movement, options?.timeoutMs, options?.checkIntervalMs, onError]);

    return {
        data,
        loading,
        error,
    };
}
