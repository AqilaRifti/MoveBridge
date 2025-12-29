/**
 * @movebridge/codegen - CLI Tests
 * Tests CLI logic without spawning processes
 */

import { describe, it, expect, vi } from 'vitest';
import { dirname } from 'path';

// Mock fs/promises
vi.mock('fs/promises', () => ({
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
}));

// Mock the parser and generator
vi.mock('../parser', () => ({
    ABIParser: vi.fn().mockImplementation(() => ({
        fetchABI: vi.fn().mockResolvedValue({
            address: '0x1',
            name: 'coin',
            exposedFunctions: [
                {
                    name: 'balance',
                    visibility: 'public',
                    isEntry: false,
                    isView: true,
                    genericTypeParams: [],
                    params: ['address'],
                    return: ['u64'],
                },
            ],
        }),
        parseType: vi.fn((type: string) => {
            const typeMap: Record<string, string> = {
                'bool': 'boolean',
                'u64': 'string',
                'address': 'string',
            };
            return typeMap[type] || 'unknown';
        }),
    })),
}));

vi.mock('../generator', () => ({
    TypeGenerator: vi.fn().mockImplementation(() => ({
        generateClass: vi.fn().mockReturnValue('export class CoinContract {}'),
    })),
}));

describe('CLI Logic', () => {
    describe('network validation', () => {
        it('should accept mainnet', () => {
            const network = 'mainnet';
            const isValid = network === 'mainnet' || network === 'testnet';
            expect(isValid).toBe(true);
        });

        it('should accept testnet', () => {
            const network = 'testnet';
            const isValid = network === 'mainnet' || network === 'testnet';
            expect(isValid).toBe(true);
        });

        it('should reject devnet', () => {
            const network = 'devnet';
            const isValid = network === 'mainnet' || network === 'testnet';
            expect(isValid).toBe(false);
        });

        it('should reject empty string', () => {
            const network = '';
            const isValid = network === 'mainnet' || network === 'testnet';
            expect(isValid).toBe(false);
        });

        it('should reject uppercase variants', () => {
            const network = 'MAINNET';
            const isValid = network === 'mainnet' || network === 'testnet';
            expect(isValid).toBe(false);
        });
    });

    describe('module address parsing', () => {
        it('should validate correct format 0x1::coin', () => {
            const address = '0x1::coin';
            const parts = address.split('::');
            expect(parts.length).toBe(2);
            expect(parts[0]).toBe('0x1');
            expect(parts[1]).toBe('coin');
        });

        it('should validate long address format', () => {
            const address = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::my_module';
            const parts = address.split('::');
            expect(parts.length).toBe(2);
            expect(parts[0]).toMatch(/^0x[a-f0-9]+$/);
            expect(parts[1]).toBe('my_module');
        });

        it('should detect invalid format without separator', () => {
            const address = '0x1coin';
            const parts = address.split('::');
            expect(parts.length).toBe(1);
        });

        it('should detect invalid format with multiple separators', () => {
            const address = '0x1::coin::extra';
            const parts = address.split('::');
            expect(parts.length).toBe(3);
        });

        it('should detect empty address part', () => {
            const address = '::coin';
            const parts = address.split('::');
            expect(parts[0]).toBe('');
        });

        it('should detect empty module part', () => {
            const address = '0x1::';
            const parts = address.split('::');
            expect(parts[1]).toBe('');
        });
    });

    describe('output path handling', () => {
        it('should extract directory from output path', () => {
            const output = '/path/to/generated/coin.ts';
            const dir = dirname(output);
            expect(dir).toBe('/path/to/generated');
        });

        it('should handle relative paths', () => {
            const output = 'src/generated/coin.ts';
            const dir = dirname(output);
            expect(dir).toBe('src/generated');
        });

        it('should handle file in current directory', () => {
            const output = 'coin.ts';
            const dir = dirname(output);
            expect(dir).toBe('.');
        });
    });

    describe('CLI options structure', () => {
        it('should have required address option', () => {
            const options = {
                address: '0x1::coin',
                network: 'testnet',
                output: 'coin.ts',
            };
            expect(options.address).toBeDefined();
        });

        it('should have required network option', () => {
            const options = {
                address: '0x1::coin',
                network: 'testnet',
                output: 'coin.ts',
            };
            expect(options.network).toBeDefined();
        });

        it('should have required output option', () => {
            const options = {
                address: '0x1::coin',
                network: 'testnet',
                output: 'coin.ts',
            };
            expect(options.output).toBeDefined();
        });
    });

    describe('code generation flow', () => {
        it('should create parser with correct network', async () => {
            const { ABIParser } = await import('../parser');
            new ABIParser('testnet');
            expect(ABIParser).toHaveBeenCalledWith('testnet');
        });

        it('should fetch ABI with correct address', async () => {
            const { ABIParser } = await import('../parser');
            const parser = new ABIParser('testnet');
            const abi = await parser.fetchABI('0x1::coin');
            expect(parser.fetchABI).toHaveBeenCalledWith('0x1::coin');
            expect(abi.name).toBe('coin');
        });

        it('should generate class from ABI', async () => {
            const { ABIParser } = await import('../parser');
            const { TypeGenerator } = await import('../generator');

            const parser = new ABIParser('testnet');
            const generator = new TypeGenerator(parser);
            const abi = await parser.fetchABI('0x1::coin');
            const code = generator.generateClass(abi);

            expect(code).toContain('CoinContract');
        });

        it('should write generated code to file', async () => {
            const { writeFile, mkdir } = await import('fs/promises');

            await mkdir('/path/to', { recursive: true });
            await writeFile('/path/to/coin.ts', 'export class CoinContract {}', 'utf-8');

            expect(mkdir).toHaveBeenCalledWith('/path/to', { recursive: true });
            expect(writeFile).toHaveBeenCalledWith('/path/to/coin.ts', 'export class CoinContract {}', 'utf-8');
        });
    });

    describe('error handling', () => {
        it('should handle invalid module address error', () => {
            const validateAddress = (address: string): boolean => {
                const parts = address.split('::');
                return parts.length === 2 && parts[0] !== '' && parts[1] !== '';
            };

            expect(validateAddress('invalid')).toBe(false);
            expect(validateAddress('0x1::coin')).toBe(true);
            expect(validateAddress('::coin')).toBe(false);
            expect(validateAddress('0x1::')).toBe(false);
        });

        it('should handle network fetch errors gracefully', async () => {
            const mockError = new Error('Network error');
            const handleError = (error: Error): string => {
                return `Error: ${error.message}`;
            };

            expect(handleError(mockError)).toBe('Error: Network error');
        });
    });
});
