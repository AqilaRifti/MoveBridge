/**
 * @movebridge/codegen - ABI Parser Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ABIParser } from '../parser';

// Mock the Aptos SDK
vi.mock('@aptos-labs/ts-sdk', () => ({
    Aptos: vi.fn().mockImplementation(() => ({
        getAccountModules: vi.fn(),
    })),
    AptosConfig: vi.fn(),
    Network: { CUSTOM: 'custom' },
}));

describe('ABIParser', () => {
    let parser: ABIParser;

    beforeEach(() => {
        vi.clearAllMocks();
        parser = new ABIParser('testnet');
    });

    describe('constructor', () => {
        it('should create parser for testnet', () => {
            const testnetParser = new ABIParser('testnet');
            expect(testnetParser).toBeInstanceOf(ABIParser);
        });

        it('should create parser for mainnet', () => {
            const mainnetParser = new ABIParser('mainnet');
            expect(mainnetParser).toBeInstanceOf(ABIParser);
        });
    });

    describe('fetchABI', () => {
        it('should throw error for invalid module address format', async () => {
            await expect(parser.fetchABI('invalid')).rejects.toThrow(
                'Expected format: 0xADDRESS::module_name'
            );
        });

        it('should throw error for address without module name', async () => {
            await expect(parser.fetchABI('0x1::')).rejects.toThrow(
                'Expected format: 0xADDRESS::module_name'
            );
        });

        it('should throw error for module name without address', async () => {
            await expect(parser.fetchABI('::coin')).rejects.toThrow(
                'Expected format: 0xADDRESS::module_name'
            );
        });

        it('should parse valid module address format', async () => {
            // Mock the getAccountModules response
            const mockModules = [
                {
                    abi: {
                        name: 'coin',
                        exposed_functions: [
                            {
                                name: 'transfer',
                                visibility: 'public',
                                is_entry: true,
                                is_view: false,
                                generic_type_params: [{ constraints: [] }],
                                params: ['&signer', 'address', 'u64'],
                                return: [],
                            },
                            {
                                name: 'balance',
                                visibility: 'public',
                                is_entry: false,
                                is_view: true,
                                generic_type_params: [{ constraints: [] }],
                                params: ['address'],
                                return: ['u64'],
                            },
                        ],
                    },
                },
            ];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (parser as any).aptosClient.getAccountModules = vi.fn().mockResolvedValue(mockModules);

            const abi = await parser.fetchABI('0x1::coin');

            expect(abi.address).toBe('0x1');
            expect(abi.name).toBe('coin');
            expect(abi.exposedFunctions).toHaveLength(2);
        });

        it('should throw error when module not found', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (parser as any).aptosClient.getAccountModules = vi.fn().mockResolvedValue([]);

            await expect(parser.fetchABI('0x1::nonexistent')).rejects.toThrow('Module not found');
        });

        it('should correctly parse function ABIs', async () => {
            const mockModules = [
                {
                    abi: {
                        name: 'test_module',
                        exposed_functions: [
                            {
                                name: 'test_function',
                                visibility: 'public',
                                is_entry: true,
                                is_view: false,
                                generic_type_params: [
                                    { constraints: ['copy', 'drop'] },
                                ],
                                params: ['&signer', 'u64', 'vector<u8>'],
                                return: ['bool'],
                            },
                        ],
                    },
                },
            ];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (parser as any).aptosClient.getAccountModules = vi.fn().mockResolvedValue(mockModules);

            const abi = await parser.fetchABI('0x1::test_module');
            const fn = abi.exposedFunctions[0];

            expect(fn.name).toBe('test_function');
            expect(fn.visibility).toBe('public');
            expect(fn.isEntry).toBe(true);
            expect(fn.isView).toBe(false);
            expect(fn.genericTypeParams).toHaveLength(1);
            expect(fn.genericTypeParams[0].constraints).toEqual(['copy', 'drop']);
            expect(fn.params).toEqual(['&signer', 'u64', 'vector<u8>']);
            expect(fn.return).toEqual(['bool']);
        });
    });

    describe('parseType', () => {
        it('should parse boolean type', () => {
            expect(parser.parseType('bool')).toBe('boolean');
        });

        it('should parse small integer types as number', () => {
            expect(parser.parseType('u8')).toBe('number');
            expect(parser.parseType('u16')).toBe('number');
            expect(parser.parseType('u32')).toBe('number');
        });

        it('should parse large integer types as string', () => {
            expect(parser.parseType('u64')).toBe('string');
            expect(parser.parseType('u128')).toBe('string');
            expect(parser.parseType('u256')).toBe('string');
        });

        it('should parse address type', () => {
            expect(parser.parseType('address')).toBe('string');
        });

        it('should parse signer types as void', () => {
            expect(parser.parseType('&signer')).toBe('void');
            expect(parser.parseType('signer')).toBe('void');
        });

        it('should parse Move string type', () => {
            expect(parser.parseType('0x1::string::String')).toBe('string');
        });

        it('should parse vector types', () => {
            expect(parser.parseType('vector<u8>')).toBe('number[]');
            expect(parser.parseType('vector<address>')).toBe('string[]');
            expect(parser.parseType('vector<bool>')).toBe('boolean[]');
        });

        it('should parse nested vector types', () => {
            expect(parser.parseType('vector<vector<u8>>')).toBe('number[][]');
        });

        it('should parse generic type parameters', () => {
            expect(parser.parseType('T0')).toBe('T0');
            expect(parser.parseType('T1')).toBe('T1');
            expect(parser.parseType('T10')).toBe('T10');
        });

        it('should return unknown for complex types', () => {
            expect(parser.parseType('0x1::some_module::SomeStruct')).toBe('unknown');
        });
    });
});
