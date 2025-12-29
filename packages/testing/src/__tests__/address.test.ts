/**
 * @movebridge/testing - Unit tests for Address Validator
 */

import { describe, it, expect } from 'vitest';
import { MovementError } from '@movebridge/core';
import {
    isValidAddress,
    validateAddress,
    normalizeAddress,
    getAddressValidationDetails,
} from '../validators/address';

describe('Address Validator', () => {
    describe('isValidAddress', () => {
        it('should accept valid 64-character hex address without prefix', () => {
            const address = 'a'.repeat(64);
            expect(isValidAddress(address)).toBe(true);
        });

        it('should accept valid 64-character hex address with 0x prefix', () => {
            const address = '0x' + 'a'.repeat(64);
            expect(isValidAddress(address)).toBe(true);
        });

        it('should accept valid 64-character hex address with 0X prefix', () => {
            const address = '0X' + 'A'.repeat(64);
            expect(isValidAddress(address)).toBe(true);
        });

        it('should accept short addresses (less than 64 chars)', () => {
            expect(isValidAddress('0x1')).toBe(true);
            expect(isValidAddress('0x123abc')).toBe(true);
            expect(isValidAddress('1')).toBe(true);
        });

        it('should accept mixed case hex characters', () => {
            const address = '0x' + 'aAbBcCdDeEfF0123456789'.repeat(3).slice(0, 64);
            expect(isValidAddress(address)).toBe(true);
        });

        it('should reject empty string', () => {
            expect(isValidAddress('')).toBe(false);
        });

        it('should reject just 0x prefix', () => {
            expect(isValidAddress('0x')).toBe(false);
        });

        it('should reject addresses longer than 64 hex chars', () => {
            const address = '0x' + 'a'.repeat(65);
            expect(isValidAddress(address)).toBe(false);
        });

        it('should reject non-hex characters', () => {
            expect(isValidAddress('0xghijklmnop')).toBe(false);
            expect(isValidAddress('0x123xyz')).toBe(false);
        });

        it('should reject non-string inputs', () => {
            expect(isValidAddress(null as unknown as string)).toBe(false);
            expect(isValidAddress(undefined as unknown as string)).toBe(false);
            expect(isValidAddress(123 as unknown as string)).toBe(false);
        });
    });

    describe('validateAddress', () => {
        it('should not throw for valid addresses', () => {
            expect(() => validateAddress('0x' + 'a'.repeat(64))).not.toThrow();
            expect(() => validateAddress('0x1')).not.toThrow();
        });

        it('should throw MovementError for invalid addresses', () => {
            expect(() => validateAddress('')).toThrow(MovementError);
            expect(() => validateAddress('0x')).toThrow(MovementError);
            expect(() => validateAddress('invalid')).toThrow(MovementError);
        });

        it('should throw with INVALID_ADDRESS code', () => {
            try {
                validateAddress('invalid');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(MovementError);
                expect((error as MovementError).code).toBe('INVALID_ADDRESS');
            }
        });

        it('should include address in error details', () => {
            try {
                validateAddress('bad-address');
                expect.fail('Should have thrown');
            } catch (error) {
                expect((error as MovementError).details?.address).toBe('bad-address');
            }
        });

        it('should include reason in error details', () => {
            try {
                validateAddress('');
                expect.fail('Should have thrown');
            } catch (error) {
                expect((error as MovementError).details?.reason).toBeDefined();
            }
        });
    });

    describe('normalizeAddress', () => {
        it('should add 0x prefix if missing', () => {
            const result = normalizeAddress('a'.repeat(64));
            expect(result.startsWith('0x')).toBe(true);
        });

        it('should convert to lowercase', () => {
            const result = normalizeAddress('0x' + 'A'.repeat(64));
            expect(result).toBe('0x' + 'a'.repeat(64));
        });

        it('should pad short addresses to 64 characters', () => {
            const result = normalizeAddress('0x1');
            expect(result.length).toBe(66); // 0x + 64 chars
            expect(result).toBe('0x' + '0'.repeat(63) + '1');
        });

        it('should handle 0X prefix', () => {
            const result = normalizeAddress('0X' + 'ABC'.repeat(21) + 'A');
            expect(result.startsWith('0x')).toBe(true);
            expect(result).toBe(result.toLowerCase());
        });

        it('should throw for invalid addresses', () => {
            expect(() => normalizeAddress('')).toThrow(MovementError);
            expect(() => normalizeAddress('invalid')).toThrow(MovementError);
        });

        it('should be idempotent', () => {
            const address = '0x' + 'AbCdEf'.repeat(10) + 'AbCd';
            const normalized1 = normalizeAddress(address);
            const normalized2 = normalizeAddress(normalized1);
            expect(normalized1).toBe(normalized2);
        });
    });

    describe('getAddressValidationDetails', () => {
        it('should return valid=true for valid addresses', () => {
            const result = getAddressValidationDetails('0x' + 'a'.repeat(64));
            expect(result.valid).toBe(true);
            expect(result.normalized).toBeDefined();
            expect(result.error).toBeUndefined();
        });

        it('should return valid=false for invalid addresses', () => {
            const result = getAddressValidationDetails('invalid');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should provide normalized address for valid inputs', () => {
            const result = getAddressValidationDetails('0x1');
            expect(result.normalized).toBe('0x' + '0'.repeat(63) + '1');
        });

        it('should provide error message for empty string', () => {
            const result = getAddressValidationDetails('');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('empty');
        });

        it('should provide error message for too long address', () => {
            const result = getAddressValidationDetails('0x' + 'a'.repeat(65));
            expect(result.valid).toBe(false);
            expect(result.error).toContain('long');
        });

        it('should provide error message for invalid characters', () => {
            const result = getAddressValidationDetails('0xghij');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('invalid characters');
        });

        it('should handle non-string inputs gracefully', () => {
            const result = getAddressValidationDetails(null as unknown as string);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('string');
        });
    });
});
