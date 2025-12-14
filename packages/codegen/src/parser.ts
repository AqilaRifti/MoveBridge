/**
 * @movebridge/codegen - ABI Parser
 * Fetches and parses Move module ABIs
 */

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { NETWORK_CONFIG, Errors, type NetworkType } from '@movebridge/core';

/**
 * Type parameter definition
 */
export interface TypeParam {
    constraints: string[];
}

/**
 * Function ABI definition
 */
export interface FunctionABI {
    name: string;
    visibility: 'public' | 'private' | 'friend';
    isEntry: boolean;
    isView: boolean;
    genericTypeParams: TypeParam[];
    params: string[];
    return: string[];
}

/**
 * Module ABI definition
 */
export interface ModuleABI {
    address: string;
    name: string;
    exposedFunctions: FunctionABI[];
}

/**
 * ABI Parser
 * Fetches and parses Move module ABIs from the network
 */
export class ABIParser {
    private aptosClient: Aptos;

    constructor(network: NetworkType) {
        const config = NETWORK_CONFIG[network];
        const aptosConfig = new AptosConfig({
            network: Network.CUSTOM,
            fullnode: config.rpcUrl,
        });
        this.aptosClient = new Aptos(aptosConfig);
    }

    /**
     * Fetches the ABI for a module
     * @param moduleAddress - Full module address (e.g., '0x1::coin')
     * @returns Module ABI
     */
    async fetchABI(moduleAddress: string): Promise<ModuleABI> {
        // Parse module address: 0xADDRESS::module_name
        const parts = moduleAddress.split('::');
        if (parts.length !== 2) {
            throw Errors.invalidArgument(
                'moduleAddress',
                'Expected format: 0xADDRESS::module_name'
            );
        }

        const address = parts[0];
        const moduleName = parts[1];

        if (!address || !moduleName) {
            throw Errors.invalidArgument(
                'moduleAddress',
                'Expected format: 0xADDRESS::module_name'
            );
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = this.aptosClient as any;
            const modules = await client.getAccountModules({
                accountAddress: address,
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const targetModule = modules.find((m: any) => {
                const abi = m.abi;
                return abi?.name === moduleName;
            });

            if (!targetModule || !targetModule.abi) {
                throw Errors.abiFetchFailed(moduleAddress, 'Module not found');
            }

            const abi = targetModule.abi;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const exposedFunctions: FunctionABI[] = abi.exposed_functions.map((fn: any) => ({
                name: fn.name,
                visibility: fn.visibility as 'public' | 'private' | 'friend',
                isEntry: fn.is_entry,
                isView: fn.is_view,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                genericTypeParams: fn.generic_type_params.map((p: any) => ({
                    constraints: p.constraints,
                })),
                params: fn.params,
                return: fn.return,
            }));

            return {
                address,
                name: moduleName,
                exposedFunctions,
            };
        } catch (error) {
            if (error instanceof Error && error.message.includes('Module not found')) {
                throw error;
            }
            throw Errors.abiFetchFailed(moduleAddress, 'network', error);
        }
    }

    /**
     * Parses a Move type to TypeScript type
     * @param moveType - Move type string
     * @returns TypeScript type string
     */
    parseType(moveType: string): string {
        // Handle common Move types
        const typeMap: Record<string, string> = {
            'bool': 'boolean',
            'u8': 'number',
            'u16': 'number',
            'u32': 'number',
            'u64': 'string',
            'u128': 'string',
            'u256': 'string',
            'address': 'string',
            '&signer': 'void',
            'signer': 'void',
            '0x1::string::String': 'string',
        };

        if (typeMap[moveType]) {
            return typeMap[moveType];
        }

        // Handle vector types
        if (moveType.startsWith('vector<')) {
            const innerType = moveType.slice(7, -1);
            return `${this.parseType(innerType)}[]`;
        }

        // Handle generic types (T0, T1, etc.)
        if (/^T\d+$/.test(moveType)) {
            return moveType;
        }

        // Default to unknown for complex types
        return 'unknown';
    }
}
