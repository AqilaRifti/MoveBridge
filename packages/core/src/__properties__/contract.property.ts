/**
 * Property-based tests for Contract Interface
 * @module @movebridge/core
 * 
 * Feature: sdk-rework
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ContractInterface } from '../contract';
import { WalletManager } from '../wallet';

// Mock Aptos client
const createMockAptosClient = (viewResult: unknown[] = []) => ({
    view: vi.fn().mockResolvedValue(viewResult),
    getAccountResource: vi.fn(),
} as unknown as Parameters<typeof ContractInterface>[0]);

describe('Contract Interface Properties', () => {
    let walletManager: WalletManager;

    beforeEach(() => {
        vi.clearAllMocks();
        walletManager = new WalletManager();
    });

    /**
     * Feature: sdk-rework, Property 3: View Function Response Handling
     * For any view function response from the Aptos SDK:
     * - If the response array has exactly one element, return that element directly
     * - If the response array has zero or more than one element, return the array as-is
     * 
     * **Validates: Requirements 2.2, 2.3**
     */
    it('Property 3: View Function Response Handling', async () => {
        // Test single element response - should unwrap
        await fc.assert(
            fc.asyncProperty(
                fc.jsonValue(),
                async (value) => {
                    const mockClient = createMockAptosClient([value]);
                    const contract = new ContractInterface(mockClient, walletManager, {
                        address: '0x1',
                        module: 'test',
                    });

                    const result = await contract.view('test_func');

                    // Single element should be unwrapped
                    expect(result).toEqual(value);
                    return true;
                }
            ),
            { numRuns: 100 }
        );

        // Test empty array response - should return empty array
        await fc.assert(
            fc.asyncProperty(fc.constant(null), async () => {
                const mockClient = createMockAptosClient([]);
                const contract = new ContractInterface(mockClient, walletManager, {
                    address: '0x1',
                    module: 'test',
                });

                const result = await contract.view('test_func');

                // Empty array should be returned as-is
                expect(result).toEqual([]);
                return true;
            }),
            { numRuns: 10 }
        );

        // Test multiple element response - should return array as-is
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.jsonValue(), { minLength: 2, maxLength: 5 }),
                async (values) => {
                    const mockClient = createMockAptosClient(values);
                    const contract = new ContractInterface(mockClient, walletManager, {
                        address: '0x1',
                        module: 'test',
                    });

                    const result = await contract.view('test_func');

                    // Multiple elements should be returned as array
                    expect(result).toEqual(values);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: sdk-rework, Property 4: View Function Type Arguments
     * For any view function call with type arguments, the payload sent to the Aptos SDK
     * SHALL include those type arguments in the typeArguments field.
     * 
     * **Validates: Requirements 2.6**
     */
    it('Property 4: View Function Type Arguments', async () => {
        // Generate valid type argument strings
        const typeArgArb = fc.tuple(
            fc.hexaString({ minLength: 1, maxLength: 64 }).map(h => `0x${h}`),
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
        ).map(([addr, mod, type]) => `${addr}::${mod}::${type}`);

        await fc.assert(
            fc.asyncProperty(
                fc.array(typeArgArb, { minLength: 1, maxLength: 3 }),
                async (typeArgs) => {
                    const mockClient = createMockAptosClient(['result']);
                    const contract = new ContractInterface(mockClient, walletManager, {
                        address: '0x1',
                        module: 'coin',
                    });

                    await contract.view('balance', ['0x123'], typeArgs);

                    // Verify the view was called with correct type arguments
                    expect(mockClient.view).toHaveBeenCalledWith({
                        payload: {
                            function: '0x1::coin::balance',
                            typeArguments: typeArgs,
                            functionArguments: ['0x123'],
                        },
                    });

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: sdk-rework, Property 5: Entry Function Type Arguments
     * For any entry function call with type arguments, the transaction payload
     * sent to the wallet adapter SHALL include those type arguments in the typeArguments field.
     * 
     * **Validates: Requirements 3.5**
     */
    it('Property 5: Entry Function Type Arguments', async () => {
        // Generate valid type argument strings
        const typeArgArb = fc.tuple(
            fc.hexaString({ minLength: 1, maxLength: 64 }).map(h => `0x${h}`),
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
        ).map(([addr, mod, type]) => `${addr}::${mod}::${type}`);

        await fc.assert(
            fc.asyncProperty(
                fc.array(typeArgArb, { minLength: 1, maxLength: 3 }),
                async (typeArgs) => {
                    const mockClient = createMockAptosClient();

                    // Create a mock adapter
                    const mockAdapter = {
                        signAndSubmitTransaction: vi.fn().mockResolvedValue({ hash: '0x123' }),
                    };

                    // Create wallet manager with mocked adapter
                    const mockWalletManager = {
                        getAdapter: () => mockAdapter,
                        getState: () => ({ connected: true, address: '0x1', publicKey: '0x2' }),
                    } as unknown as WalletManager;

                    const contract = new ContractInterface(mockClient, mockWalletManager, {
                        address: '0x1',
                        module: 'coin',
                    });

                    await contract.call('transfer', ['0x456', '1000'], typeArgs);

                    // Verify the wallet adapter was called with correct type arguments
                    expect(mockAdapter.signAndSubmitTransaction).toHaveBeenCalledWith({
                        payload: {
                            function: '0x1::coin::transfer',
                            typeArguments: typeArgs,
                            functionArguments: ['0x456', '1000'],
                        },
                    });

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Full function name construction
     */
    it('Property: Full function name is correctly constructed', () => {
        fc.assert(
            fc.property(
                fc.hexaString({ minLength: 1, maxLength: 64 }).map(h => `0x${h}`),
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
                (address, module, functionName) => {
                    const mockClient = createMockAptosClient();
                    const contract = new ContractInterface(mockClient, walletManager, {
                        address,
                        module,
                    });

                    const fullName = contract.getFullFunctionName(functionName);
                    expect(fullName).toBe(`${address}::${module}::${functionName}`);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: View function preserves arguments
     */
    it('Property: View function preserves all arguments', async () => {
        const argsArb = fc.array(
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            { maxLength: 5 }
        );

        await fc.assert(
            fc.asyncProperty(argsArb, async (args) => {
                const mockClient = createMockAptosClient(['result']);
                const contract = new ContractInterface(mockClient, walletManager, {
                    address: '0x1',
                    module: 'test',
                });

                await contract.view('test_func', args);

                // Verify arguments were passed correctly
                expect(mockClient.view).toHaveBeenCalledWith({
                    payload: {
                        function: '0x1::test::test_func',
                        typeArguments: [],
                        functionArguments: args,
                    },
                });

                return true;
            }),
            { numRuns: 100 }
        );
    });
});
