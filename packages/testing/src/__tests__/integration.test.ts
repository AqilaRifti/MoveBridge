/**
 * @movebridge/testing - Unit tests for Integration Utils
 */

import { describe, it, expect } from 'vitest';
import { createIntegrationUtils, assertNotMainnet } from '../integration';

describe('Integration Utils', () => {
    describe('createIntegrationUtils', () => {
        it('should create utils for testnet', () => {
            const utils = createIntegrationUtils('testnet');

            expect(utils).toBeDefined();
            expect(utils.createTestAccount).toBeInstanceOf(Function);
            expect(utils.waitForFunding).toBeInstanceOf(Function);
            expect(utils.cleanupTestAccount).toBeInstanceOf(Function);
            expect(utils.withTestAccount).toBeInstanceOf(Function);
        });

        it('should throw for mainnet', () => {
            expect(() => createIntegrationUtils('mainnet' as any)).toThrow(
                'Integration tests can only be run on testnet'
            );
        });

        it('should throw for invalid network', () => {
            expect(() => createIntegrationUtils('invalid' as any)).toThrow(
                'Integration tests can only be run on testnet'
            );
        });
    });

    describe('assertNotMainnet', () => {
        it('should not throw for testnet', () => {
            expect(() => assertNotMainnet('testnet')).not.toThrow();
        });

        it('should not throw for devnet', () => {
            expect(() => assertNotMainnet('devnet')).not.toThrow();
        });

        it('should throw for mainnet', () => {
            expect(() => assertNotMainnet('mainnet')).toThrow(
                'Cannot run integration tests on mainnet'
            );
        });

        it('should include network in error details', () => {
            try {
                assertNotMainnet('mainnet');
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.details).toEqual({
                    network: 'mainnet',
                    reason: 'Mainnet usage is forbidden in tests',
                });
            }
        });
    });

    describe('placeholder methods', () => {
        it('createTestAccount should throw with helpful message', async () => {
            const utils = createIntegrationUtils('testnet');

            await expect(utils.createTestAccount()).rejects.toThrow(
                'createTestAccount requires network access'
            );
        });

        it('waitForFunding should throw with helpful message', async () => {
            const utils = createIntegrationUtils('testnet');

            await expect(utils.waitForFunding('0x1')).rejects.toThrow(
                'waitForFunding requires network access'
            );
        });

        it('cleanupTestAccount should throw with helpful message', async () => {
            const utils = createIntegrationUtils('testnet');
            const account = {
                address: '0x1',
                privateKey: '0xabc',
                publicKey: '0xdef',
            };

            await expect(utils.cleanupTestAccount(account)).rejects.toThrow(
                'cleanupTestAccount requires network access'
            );
        });

        it('withTestAccount should throw from createTestAccount', async () => {
            const utils = createIntegrationUtils('testnet');

            await expect(
                utils.withTestAccount(async () => 'result')
            ).rejects.toThrow('createTestAccount requires network access');
        });
    });

    describe('error structure', () => {
        it('should throw MovementError with correct code', () => {
            try {
                createIntegrationUtils('mainnet' as any);
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.code).toBe('INVALID_ARGUMENT');
            }
        });

        it('should include allowed networks in error details', () => {
            try {
                createIntegrationUtils('mainnet' as any);
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.details.allowed).toEqual(['testnet']);
            }
        });
    });
});
