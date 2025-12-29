/**
 * @movebridge/codegen - Type Generator Property Tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TypeGenerator } from '../generator';
import { ABIParser, type ModuleABI } from '../parser';

// Create a real parser for type conversion
const parser = new ABIParser('testnet');

describe('TypeGenerator Property Tests', () => {
    describe('Property 19: ABI to TypeScript generation', () => {
        it('should always generate valid class structure for any module ABI', () => {
            const generator = new TypeGenerator(parser);

            // Generate arbitrary module names (snake_case)
            const moduleNameArb = fc.stringOf(
                fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz_'.split('')),
                { minLength: 1, maxLength: 20 }
            ).filter(s => !s.startsWith('_') && !s.endsWith('_') && !s.includes('__'));

            // Generate arbitrary addresses
            const addressArb = fc.hexaString({ minLength: 2, maxLength: 64 })
                .map(s => `0x${s}`);

            fc.assert(
                fc.property(addressArb, moduleNameArb, (address, name) => {
                    const abi: ModuleABI = {
                        address,
                        name,
                        exposedFunctions: [],
                    };

                    const code = generator.generateClass(abi);

                    // Should contain class definition
                    expect(code).toContain('export class');
                    expect(code).toContain('Contract');

                    // Should contain constructor
                    expect(code).toContain('constructor(movement: Movement)');

                    // Should contain address and module
                    expect(code).toContain(`private readonly address = '${address}'`);
                    expect(code).toContain(`private readonly module = '${name}'`);

                    // Should import Movement
                    expect(code).toContain("import type { Movement } from '@movebridge/core'");

                    return true;
                }),
                { numRuns: 50 }
            );
        });
    });

    describe('Property 20: Generated class constructor', () => {
        it('should always generate constructor that accepts Movement instance', () => {
            const generator = new TypeGenerator(parser);

            const abiArb = fc.record({
                address: fc.hexaString({ minLength: 2, maxLength: 64 }).map(s => `0x${s}`),
                name: fc.constantFrom('coin', 'token', 'swap', 'nft', 'staking'),
                exposedFunctions: fc.constant([]),
            });

            fc.assert(
                fc.property(abiArb, (abi) => {
                    const code = generator.generateClass(abi as ModuleABI);

                    // Constructor should accept Movement
                    expect(code).toContain('constructor(movement: Movement)');
                    expect(code).toContain('this.movement = movement');

                    // Should have private movement field
                    expect(code).toContain('private readonly movement: Movement');

                    return true;
                }),
                { numRuns: 30 }
            );
        });
    });

    describe('Property 21: Generic type parameter generation', () => {
        it('should generate correct generic type params for any number of type params', () => {
            const generator = new TypeGenerator(parser);

            // Generate functions with varying numbers of generic type params
            const numTypeParamsArb = fc.integer({ min: 0, max: 5 });

            fc.assert(
                fc.property(numTypeParamsArb, (numTypeParams) => {
                    const genericTypeParams = Array.from({ length: numTypeParams }, () => ({
                        constraints: [],
                    }));

                    const abi: ModuleABI = {
                        address: '0x1',
                        name: 'test',
                        exposedFunctions: [
                            {
                                name: 'test_function',
                                visibility: 'public',
                                isEntry: true,
                                isView: false,
                                genericTypeParams,
                                params: ['&signer', 'u64'], // Need non-signer param
                                return: [],
                            },
                        ],
                    };

                    const code = generator.generateClass(abi);

                    if (numTypeParams === 0) {
                        // Should not have generic params
                        expect(code).not.toContain('<T0');
                        expect(code).not.toContain('typeArgs');
                    } else {
                        // Should have generic params
                        expect(code).toContain('<T0 = unknown');
                        expect(code).toContain('typeArgs: string[]');

                        // Should have all type params
                        for (let i = 0; i < numTypeParams; i++) {
                            expect(code).toContain(`T${i}`);
                        }
                    }

                    return true;
                }),
                { numRuns: 20 }
            );
        });
    });

    describe('Property: Method generation consistency', () => {
        it('should generate methods for all non-private, non-signer-only functions', () => {
            const generator = new TypeGenerator(parser);

            // Generate arbitrary function names
            const fnNameArb = fc.stringOf(
                fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz_'.split('')),
                { minLength: 1, maxLength: 15 }
            ).filter(s => !s.startsWith('_') && !s.endsWith('_') && !s.includes('__'));

            fc.assert(
                fc.property(fnNameArb, (fnName) => {
                    const abi: ModuleABI = {
                        address: '0x1',
                        name: 'test',
                        exposedFunctions: [
                            {
                                name: fnName,
                                visibility: 'public',
                                isEntry: false,
                                isView: true,
                                genericTypeParams: [],
                                params: ['address'],
                                return: ['u64'],
                            },
                        ],
                    };

                    const code = generator.generateClass(abi);

                    // Should contain the method (converted to camelCase)
                    const camelName = fnName
                        .split('_')
                        .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join('');

                    expect(code).toContain(`async ${camelName}`);

                    return true;
                }),
                { numRuns: 30 }
            );
        });
    });

    describe('Property: View vs Entry function handling', () => {
        it('should use contract.view for view functions and contract.call for entry functions', () => {
            const generator = new TypeGenerator(parser);

            const isViewArb = fc.boolean();

            fc.assert(
                fc.property(isViewArb, (isView) => {
                    const abi: ModuleABI = {
                        address: '0x1',
                        name: 'test',
                        exposedFunctions: [
                            {
                                name: 'test_fn',
                                visibility: 'public',
                                isEntry: !isView,
                                isView,
                                genericTypeParams: [],
                                params: ['address'],
                                return: isView ? ['u64'] : [],
                            },
                        ],
                    };

                    const code = generator.generateClass(abi);

                    if (isView) {
                        expect(code).toContain('contract.view');
                        expect(code).not.toContain('contract.call');
                    } else {
                        expect(code).toContain('contract.call');
                        expect(code).not.toContain('contract.view');
                    }

                    return true;
                }),
                { numRuns: 20 }
            );
        });
    });
});
