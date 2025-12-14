/**
 * Property-based tests for network configuration
 * @module @movebridge/core
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { NETWORK_CONFIG, resolveConfig } from '../config';
import type { NetworkType, MovementConfig } from '../types';

describe('Network Configuration Properties', () => {
    /**
     * Feature: movebridge-sdk, Property 1: Network configuration consistency
     * For any Movement client created with a network parameter, the resulting
     * configuration SHALL contain the correct RPC URL and Chain ID for that network.
     * Validates: Requirements 1.1, 1.2
     */
    it('Property 1: Network configuration consistency', () => {
        const networkArb = fc.constantFrom<NetworkType>('mainnet', 'testnet');

        fc.assert(
            fc.property(networkArb, (network) => {
                const config: MovementConfig = { network };
                const resolved = resolveConfig(config);

                if (network === 'mainnet') {
                    expect(resolved.chainId).toBe(126);
                    expect(resolved.rpcUrl).toBe('https://full.mainnet.movementinfra.xyz/v1');
                } else {
                    expect(resolved.chainId).toBe(250);
                    expect(resolved.rpcUrl).toBe('https://testnet.movementnetwork.xyz/v1');
                }

                expect(resolved.network).toBe(network);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: movebridge-sdk, Property 2: Custom URL override
     * For any Movement client created with custom rpcUrl or indexerUrl options,
     * the resulting configuration SHALL use the provided URLs instead of defaults.
     * Validates: Requirements 1.3
     */
    it('Property 2: Custom URL override', () => {
        const networkArb = fc.constantFrom<NetworkType>('mainnet', 'testnet');
        const urlArb = fc.webUrl();

        fc.assert(
            fc.property(networkArb, urlArb, urlArb, (network, customRpcUrl, customIndexerUrl) => {
                // Test custom RPC URL
                const configWithRpc: MovementConfig = {
                    network,
                    rpcUrl: customRpcUrl,
                };
                const resolvedWithRpc = resolveConfig(configWithRpc);
                expect(resolvedWithRpc.rpcUrl).toBe(customRpcUrl);

                // Test custom indexer URL
                const configWithIndexer: MovementConfig = {
                    network,
                    indexerUrl: customIndexerUrl,
                };
                const resolvedWithIndexer = resolveConfig(configWithIndexer);
                expect(resolvedWithIndexer.indexerUrl).toBe(customIndexerUrl);

                // Test both custom URLs
                const configWithBoth: MovementConfig = {
                    network,
                    rpcUrl: customRpcUrl,
                    indexerUrl: customIndexerUrl,
                };
                const resolvedWithBoth = resolveConfig(configWithBoth);
                expect(resolvedWithBoth.rpcUrl).toBe(customRpcUrl);
                expect(resolvedWithBoth.indexerUrl).toBe(customIndexerUrl);

                // Chain ID should still be correct regardless of custom URLs
                expect(resolvedWithBoth.chainId).toBe(NETWORK_CONFIG[network].chainId);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Default values are used when custom URLs not provided
     */
    it('Property: Default URLs used when not overridden', () => {
        const networkArb = fc.constantFrom<NetworkType>('mainnet', 'testnet');

        fc.assert(
            fc.property(networkArb, (network) => {
                const config: MovementConfig = { network };
                const resolved = resolveConfig(config);

                expect(resolved.rpcUrl).toBe(NETWORK_CONFIG[network].rpcUrl);
                expect(resolved.indexerUrl).toBe(NETWORK_CONFIG[network].indexerUrl);
                expect(resolved.explorerUrl).toBe(NETWORK_CONFIG[network].explorerUrl);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: autoConnect defaults to false
     */
    it('Property: autoConnect defaults to false when not specified', () => {
        const networkArb = fc.constantFrom<NetworkType>('mainnet', 'testnet');

        fc.assert(
            fc.property(networkArb, (network) => {
                const config: MovementConfig = { network };
                const resolved = resolveConfig(config);

                expect(resolved.autoConnect).toBe(false);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: autoConnect is preserved when specified
     */
    it('Property: autoConnect is preserved when specified', () => {
        const networkArb = fc.constantFrom<NetworkType>('mainnet', 'testnet');
        const autoConnectArb = fc.boolean();

        fc.assert(
            fc.property(networkArb, autoConnectArb, (network, autoConnect) => {
                const config: MovementConfig = { network, autoConnect };
                const resolved = resolveConfig(config);

                expect(resolved.autoConnect).toBe(autoConnect);

                return true;
            }),
            { numRuns: 100 }
        );
    });
});
