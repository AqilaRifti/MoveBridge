/**
 * @movebridge/testing - Property tests for Response Faker
 * 
 * Feature: testing-validation
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createFaker } from '../faker';
import { validateSchema } from '../validators/schema';
import { isValidAddress } from '../validators/address';

describe('Response Faker Properties', () => {
    /**
     * Feature: testing-validation, Property 17: Faker outputs valid data
     * For any call to fakeAddress, fakeTransaction, fakeTransactionResponse,
     * fakeResource, or fakeEvent, the returned value SHALL pass schema validation.
     */
    it('Property 17: Faker outputs valid data - fakeAddress', () => {
        fc.assert(
            fc.property(fc.integer(), (seed) => {
                const faker = createFaker({ seed });
                const address = faker.fakeAddress();
                expect(isValidAddress(address)).toBe(true);
                expect(address.startsWith('0x')).toBe(true);
                expect(address.length).toBe(66); // 0x + 64 hex chars
            }),
            { numRuns: 100 }
        );
    });

    it('Property 17: Faker outputs valid data - fakeTransaction', () => {
        fc.assert(
            fc.property(fc.integer(), (seed) => {
                const faker = createFaker({ seed });
                const transaction = faker.fakeTransaction();
                expect(validateSchema(transaction, 'Transaction')).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    it('Property 17: Faker outputs valid data - fakeTransactionResponse', () => {
        fc.assert(
            fc.property(
                fc.integer(),
                fc.boolean(),
                (seed, success) => {
                    const faker = createFaker({ seed });
                    const response = faker.fakeTransactionResponse(success);
                    expect(validateSchema(response, 'TransactionResponse')).toBe(true);
                    expect(response.success).toBe(success);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 17: Faker outputs valid data - fakeResource', () => {
        fc.assert(
            fc.property(
                fc.integer(),
                fc.string({ minLength: 1, maxLength: 50 }),
                (seed, type) => {
                    const faker = createFaker({ seed });
                    const resource = faker.fakeResource(type);
                    expect(validateSchema(resource, 'Resource')).toBe(true);
                    expect(resource.type).toBe(type);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 17: Faker outputs valid data - fakeEvent', () => {
        fc.assert(
            fc.property(
                fc.integer(),
                fc.string({ minLength: 1, maxLength: 50 }),
                (seed, type) => {
                    const faker = createFaker({ seed });
                    const event = faker.fakeEvent(type);
                    expect(validateSchema(event, 'ContractEvent')).toBe(true);
                    expect(event.type).toBe(type);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 17: Faker outputs valid data - fakeWalletState', () => {
        fc.assert(
            fc.property(
                fc.integer(),
                fc.boolean(),
                (seed, connected) => {
                    const faker = createFaker({ seed });
                    const state = faker.fakeWalletState(connected);
                    expect(validateSchema(state, 'WalletState')).toBe(true);
                    expect(state.connected).toBe(connected);

                    if (connected) {
                        expect(state.address).not.toBeNull();
                        expect(state.publicKey).not.toBeNull();
                    } else {
                        expect(state.address).toBeNull();
                        expect(state.publicKey).toBeNull();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 18: Faker balance bounds
     * For any min and max values where min <= max, fakeBalance SHALL return
     * a string representing a number within the inclusive range [min, max].
     */
    it('Property 18: Faker balance bounds', () => {
        fc.assert(
            fc.property(
                fc.integer(),
                fc.integer({ min: 0, max: 1000000 }),
                fc.integer({ min: 0, max: 1000000 }),
                (seed, a, b) => {
                    const min = Math.min(a, b);
                    const max = Math.max(a, b);

                    const faker = createFaker({ seed });
                    const balance = faker.fakeBalance({
                        min: String(min),
                        max: String(max),
                    });

                    const balanceNum = BigInt(balance);
                    expect(balanceNum >= BigInt(min)).toBe(true);
                    expect(balanceNum <= BigInt(max)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Deterministic seeding
     * Same seed should produce same results
     */
    it('Property: Deterministic seeding produces same results', () => {
        fc.assert(
            fc.property(fc.integer(), (seed) => {
                const faker1 = createFaker({ seed });
                const faker2 = createFaker({ seed });

                // Generate same sequence
                expect(faker1.fakeAddress()).toBe(faker2.fakeAddress());
                expect(faker1.fakeBalance()).toBe(faker2.fakeBalance());
                expect(faker1.fakeTransactionHash()).toBe(faker2.fakeTransactionHash());
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Different seeds produce different results
     */
    it('Property: Different seeds produce different results', () => {
        fc.assert(
            fc.property(
                fc.integer(),
                fc.integer().filter(n => n !== 0),
                (seed1, offset) => {
                    const seed2 = seed1 + offset;
                    const faker1 = createFaker({ seed: seed1 });
                    const faker2 = createFaker({ seed: seed2 });

                    // Very unlikely to be the same with different seeds
                    const addr1 = faker1.fakeAddress();
                    const addr2 = faker2.fakeAddress();

                    // This should almost always be true
                    // (probability of collision is astronomically low)
                    expect(addr1 !== addr2 || seed1 === seed2).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});
