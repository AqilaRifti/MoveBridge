/**
 * @movebridge/testing - Unit tests for package exports
 */

import { describe, it, expect } from 'vitest';
import * as testing from '../index';

describe('Package Exports', () => {
    describe('Test Harness', () => {
        it('should export createTestHarness', () => {
            expect(testing.createTestHarness).toBeInstanceOf(Function);
        });
    });

    describe('Address Validators', () => {
        it('should export isValidAddress', () => {
            expect(testing.isValidAddress).toBeInstanceOf(Function);
        });

        it('should export validateAddress', () => {
            expect(testing.validateAddress).toBeInstanceOf(Function);
        });

        it('should export normalizeAddress', () => {
            expect(testing.normalizeAddress).toBeInstanceOf(Function);
        });

        it('should export getAddressValidationDetails', () => {
            expect(testing.getAddressValidationDetails).toBeInstanceOf(Function);
        });
    });

    describe('Transaction Validators', () => {
        it('should export validateTransferPayload', () => {
            expect(testing.validateTransferPayload).toBeInstanceOf(Function);
        });

        it('should export validateEntryFunctionPayload', () => {
            expect(testing.validateEntryFunctionPayload).toBeInstanceOf(Function);
        });

        it('should export validatePayload', () => {
            expect(testing.validatePayload).toBeInstanceOf(Function);
        });
    });

    describe('Schema Validators', () => {
        it('should export validateSchema', () => {
            expect(testing.validateSchema).toBeInstanceOf(Function);
        });

        it('should export getValidationErrors', () => {
            expect(testing.getValidationErrors).toBeInstanceOf(Function);
        });

        it('should export registerSchema', () => {
            expect(testing.registerSchema).toBeInstanceOf(Function);
        });

        it('should export hasSchema', () => {
            expect(testing.hasSchema).toBeInstanceOf(Function);
        });

        it('should export PREDEFINED_SCHEMAS', () => {
            expect(testing.PREDEFINED_SCHEMAS).toBeDefined();
            expect(typeof testing.PREDEFINED_SCHEMAS).toBe('object');
        });
    });

    describe('Faker', () => {
        it('should export createFaker', () => {
            expect(testing.createFaker).toBeInstanceOf(Function);
        });
    });

    describe('Network Simulator', () => {
        it('should export createNetworkSimulator', () => {
            expect(testing.createNetworkSimulator).toBeInstanceOf(Function);
        });
    });

    describe('Call Tracker', () => {
        it('should export createCallTracker', () => {
            expect(testing.createCallTracker).toBeInstanceOf(Function);
        });
    });

    describe('Snapshot Utils', () => {
        it('should export createSnapshotUtils', () => {
            expect(testing.createSnapshotUtils).toBeInstanceOf(Function);
        });
    });

    describe('Integration Utils', () => {
        it('should export createIntegrationUtils', () => {
            expect(testing.createIntegrationUtils).toBeInstanceOf(Function);
        });
    });

    describe('Mock Client', () => {
        it('should export createMockClient', () => {
            expect(testing.createMockClient).toBeInstanceOf(Function);
        });
    });

    describe('Functional exports', () => {
        it('createTestHarness should return a valid harness', () => {
            const harness = testing.createTestHarness();

            expect(harness.client).toBeDefined();
            expect(harness.tracker).toBeDefined();
            expect(harness.simulator).toBeDefined();
            expect(harness.faker).toBeDefined();
            expect(harness.cleanup).toBeInstanceOf(Function);
        });

        it('createFaker should return a valid faker', () => {
            const faker = testing.createFaker();

            expect(faker.fakeAddress).toBeInstanceOf(Function);
            expect(faker.fakeBalance).toBeInstanceOf(Function);
            expect(faker.fakeTransaction).toBeInstanceOf(Function);
        });

        it('createNetworkSimulator should return a valid simulator', () => {
            const simulator = testing.createNetworkSimulator();

            expect(simulator.simulateLatency).toBeInstanceOf(Function);
            expect(simulator.simulateNetworkError).toBeInstanceOf(Function);
            expect(simulator.resetSimulation).toBeInstanceOf(Function);
        });

        it('createCallTracker should return a valid tracker', () => {
            const tracker = testing.createCallTracker();

            expect(tracker.recordCall).toBeInstanceOf(Function);
            expect(tracker.getCalls).toBeInstanceOf(Function);
            expect(tracker.assertCalled).toBeInstanceOf(Function);
        });

        it('createSnapshotUtils should return valid utils', () => {
            const snapshots = testing.createSnapshotUtils();

            expect(snapshots.createSnapshot).toBeInstanceOf(Function);
            expect(snapshots.matchSnapshot).toBeInstanceOf(Function);
            expect(snapshots.listSnapshots).toBeInstanceOf(Function);
        });

        it('createIntegrationUtils should return valid utils', () => {
            const integration = testing.createIntegrationUtils('testnet');

            expect(integration.createTestAccount).toBeInstanceOf(Function);
            expect(integration.waitForFunding).toBeInstanceOf(Function);
            expect(integration.withTestAccount).toBeInstanceOf(Function);
        });

        it('validators should work correctly', () => {
            expect(testing.isValidAddress('0x' + '1'.repeat(64))).toBe(true);
            expect(testing.isValidAddress('invalid')).toBe(false);

            expect(testing.hasSchema('Resource')).toBe(true);
            expect(testing.hasSchema('NonExistent')).toBe(false);
        });
    });
});
