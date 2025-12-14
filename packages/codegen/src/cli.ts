#!/usr/bin/env node
/**
 * @movebridge/codegen - CLI
 * Command-line interface for generating TypeScript bindings
 */

import { Command } from 'commander';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { ABIParser } from './parser';
import { TypeGenerator } from './generator';
import type { NetworkType } from '@movebridge/core';

const program = new Command();

program
    .name('movebridge-gen')
    .description('Generate TypeScript bindings from Move modules')
    .version('0.0.1')
    .requiredOption('-a, --address <address>', 'Module address (e.g., 0x1::coin)')
    .requiredOption('-n, --network <network>', 'Network (mainnet or testnet)')
    .requiredOption('-o, --output <path>', 'Output file path')
    .action(async (options) => {
        const { address, network, output } = options;

        // Validate network
        if (network !== 'mainnet' && network !== 'testnet') {
            console.error('Error: Network must be "mainnet" or "testnet"');
            process.exit(1);
        }

        try {
            console.log(`Fetching ABI for ${address} on ${network}...`);

            // Parse ABI
            const parser = new ABIParser(network as NetworkType);
            const abi = await parser.fetchABI(address);

            console.log(`Found module: ${abi.name} with ${abi.exposedFunctions.length} functions`);

            // Generate TypeScript
            const generator = new TypeGenerator(parser);
            const code = generator.generateClass(abi);

            // Ensure output directory exists
            const outputDir = dirname(output);
            await mkdir(outputDir, { recursive: true });

            // Write output file
            await writeFile(output, code, 'utf-8');

            console.log(`Generated: ${output}`);
            console.log('Done!');
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program.parse();
