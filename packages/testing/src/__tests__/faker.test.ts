/**
 * @movebridge/testing - Unit tests for Response Faker
 */

import { describe, it, expect } from 'vitest';
import { createFaker } from '../faker';

describe('Response Faker', () => {
    describe('createFaker', () => {
        it('should create a faker without options', () => {
            const faker = createFaker();
            expect(faker).toBeDefined();
            expect(faker.fakeAddress).toBeDefined();
        });

        it('should create a faker with seed', () => {
            const faker = createFaker({ seed: 12345 });
            expect(faker).toBeDefined();
        });
    });

    describe('fakeAddress', () => {
        it('should return a valid hex address', () => {
            const faker = createFaker({ seed: 12345 });
            const address = faker.fakeAddress();
            expect(address).toMatch(/^0x[a-f0-9]{64}$/);
        });

        it('should return different addresses on subsequent calls', () => {
            const faker = createFaker({ seed: 12345 });
            const addr1 = faker.fakeAddress();
            const addr2 = faker.fakeAddress();
            expect(addr1).not.toBe(addr2);
        });
    });

    describe('fakeBalance', () => {
        it('should return a numeric string', () => {
            const faker = createFaker({ seed: 12345 });
            const balance = faker.fakeBalance();
            expect(Number(balance)).not.toBeNaN();
        });

        it('should respect min bound', () => {
            const faker = createFaker({ seed: 12345 });
            const balance = faker.fakeBalance({ min: '1000' });
            expect(BigInt(balance) >= 1000n).toBe(true);
        });

        it('should respect max bound', () => {
            const faker = createFaker({ seed: 12345 });
            const balance = faker.fakeBalance({ max: '100' });
            expect(BigInt(balance) <= 100n).toBe(true);
        });

        it('should respect both bounds', () => {
            const faker = createFaker({ seed: 12345 });
            const balance = faker.fakeBalance({ min: '50', max: '100' });
            const balanceNum = BigInt(balance);
            expect(balanceNum >= 50n).toBe(true);
            expect(balanceNum <= 100n).toBe(true);
        });
    });

    describe('fakeTransaction', () => {
        it('should return a complete transaction object', () => {
            const faker = createFaker({ seed: 12345 });
            const tx = faker.fakeTransaction();

            expect(tx.hash).toMatch(/^0x[a-f0-9]{64}$/);
            expect(tx.sender).toMatch(/^0x[a-f0-9]{64}$/);
            expect(tx.sequenceNumber).toBeDefined();
            expect(tx.payload).toBeDefined();
            expect(tx.payload.type).toBe('entry_function_payload');
            expect(tx.timestamp).toBeDefined();
        });
    });

    describe('fakeTransactionResponse', () => {
        it('should return successful response by default', () => {
            const faker = createFaker({ seed: 12345 });
            const response = faker.fakeTransactionResponse();

            expect(response.success).toBe(true);
            expect(response.vmStatus).toContain('success');
        });

        it('should return failed response when specified', () => {
            const faker = createFaker({ seed: 12345 });
            const response = faker.fakeTransactionResponse(false);

            expect(response.success).toBe(false);
            expect(response.vmStatus).toContain('abort');
        });

        it('should include all required fields', () => {
            const faker = createFaker({ seed: 12345 });
            const response = faker.fakeTransactionResponse();

            expect(response.hash).toBeDefined();
            expect(response.gasUsed).toBeDefined();
            expect(response.events).toBeDefined();
            expect(Array.isArray(response.events)).toBe(true);
        });
    });

    describe('fakeResource', () => {
        it('should return resource with specified type', () => {
            const faker = createFaker({ seed: 12345 });
            const resource = faker.fakeResource('0x1::coin::CoinStore');

            expect(resource.type).toBe('0x1::coin::CoinStore');
            expect(resource.data).toBeDefined();
            expect(typeof resource.data).toBe('object');
        });
    });

    describe('fakeEvent', () => {
        it('should return event with specified type', () => {
            const faker = createFaker({ seed: 12345 });
            const event = faker.fakeEvent('0x1::test::Event');

            expect(event.type).toBe('0x1::test::Event');
            expect(event.sequenceNumber).toBeDefined();
            expect(event.data).toBeDefined();
        });
    });

    describe('fakeWalletState', () => {
        it('should return connected state when specified', () => {
            const faker = createFaker({ seed: 12345 });
            const state = faker.fakeWalletState(true);

            expect(state.connected).toBe(true);
            expect(state.address).not.toBeNull();
            expect(state.publicKey).not.toBeNull();
        });

        it('should return disconnected state when specified', () => {
            const faker = createFaker({ seed: 12345 });
            const state = faker.fakeWalletState(false);

            expect(state.connected).toBe(false);
            expect(state.address).toBeNull();
            expect(state.publicKey).toBeNull();
        });

        it('should return disconnected state by default', () => {
            const faker = createFaker({ seed: 12345 });
            const state = faker.fakeWalletState();

            expect(state.connected).toBe(false);
        });
    });

    describe('fakeTransactionHash', () => {
        it('should return a valid transaction hash', () => {
            const faker = createFaker({ seed: 12345 });
            const hash = faker.fakeTransactionHash();

            expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
        });
    });

    describe('deterministic seeding', () => {
        it('should produce same results with same seed', () => {
            const faker1 = createFaker({ seed: 12345 });
            const faker2 = createFaker({ seed: 12345 });

            expect(faker1.fakeAddress()).toBe(faker2.fakeAddress());
            expect(faker1.fakeBalance()).toBe(faker2.fakeBalance());
            expect(faker1.fakeTransactionHash()).toBe(faker2.fakeTransactionHash());
        });

        it('should produce different results with different seeds', () => {
            const faker1 = createFaker({ seed: 12345 });
            const faker2 = createFaker({ seed: 54321 });

            expect(faker1.fakeAddress()).not.toBe(faker2.fakeAddress());
        });
    });
});
