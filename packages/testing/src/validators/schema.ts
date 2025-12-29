/**
 * @movebridge/testing - Schema validation utilities
 */

import {
    object,
    string,
    boolean,
    array,
    record,
    unknown,
    literal,
    nullable,
    Struct,
    validate,
} from 'superstruct';
import { MovementError } from '@movebridge/core';
import type { SchemaName, ValidationError } from '../types';

/**
 * Predefined schemas for SDK types
 */
export const PREDEFINED_SCHEMAS = {
    Resource: object({
        type: string(),
        data: record(string(), unknown()),
    }),

    Transaction: object({
        hash: string(),
        sender: string(),
        sequenceNumber: string(),
        payload: object({
            type: literal('entry_function_payload'),
            function: string(),
            typeArguments: array(string()),
            arguments: array(unknown()),
        }),
        timestamp: string(),
    }),

    TransactionResponse: object({
        hash: string(),
        success: boolean(),
        vmStatus: string(),
        gasUsed: string(),
        events: array(
            object({
                type: string(),
                sequenceNumber: string(),
                data: record(string(), unknown()),
            })
        ),
    }),

    WalletState: object({
        connected: boolean(),
        address: nullable(string()),
        publicKey: nullable(string()),
    }),

    ContractEvent: object({
        type: string(),
        sequenceNumber: string(),
        data: record(string(), unknown()),
    }),
} as const;

/**
 * Registry for custom schemas
 */
const customSchemas = new Map<string, Struct<unknown>>();

/**
 * Gets a schema by name
 * @param name - Schema name
 * @returns The schema struct
 * @throws MovementError if schema not found
 */
function getSchema(name: SchemaName): Struct<unknown> {
    // Check predefined schemas first
    if (name in PREDEFINED_SCHEMAS) {
        return PREDEFINED_SCHEMAS[name as keyof typeof PREDEFINED_SCHEMAS] as Struct<unknown>;
    }

    // Check custom schemas
    const customSchema = customSchemas.get(name);
    if (customSchema) {
        return customSchema;
    }

    throw new MovementError(
        `Unknown schema: ${name}`,
        'INVALID_ARGUMENT',
        {
            schemaName: name,
            availableSchemas: [
                ...Object.keys(PREDEFINED_SCHEMAS),
                ...customSchemas.keys(),
            ],
        }
    );
}

/**
 * Validates data against a schema
 * @param data - Data to validate
 * @param schemaName - Name of the schema to validate against
 * @returns true if valid, false otherwise
 */
export function validateSchema(data: unknown, schemaName: SchemaName): boolean {
    const schema = getSchema(schemaName);
    const [error] = validate(data, schema);
    return error === undefined;
}

/**
 * Gets validation errors for data against a schema
 * @param data - Data to validate
 * @param schemaName - Name of the schema to validate against
 * @returns Array of validation errors (empty if valid)
 */
export function getValidationErrors(data: unknown, schemaName: SchemaName): ValidationError[] {
    const schema = getSchema(schemaName);
    const [error] = validate(data, schema);

    if (!error) {
        return [];
    }

    return convertStructError(error);
}

/**
 * Registers a custom schema
 * @param name - Name for the schema
 * @param schema - Superstruct schema definition
 */
export function registerSchema(name: string, schema: Struct<unknown>): void {
    if (name in PREDEFINED_SCHEMAS) {
        throw new MovementError(
            `Cannot override predefined schema: ${name}`,
            'INVALID_ARGUMENT',
            { schemaName: name }
        );
    }
    customSchemas.set(name, schema);
}

/**
 * Checks if a schema exists
 * @param name - Schema name to check
 * @returns true if schema exists
 */
export function hasSchema(name: string): boolean {
    return name in PREDEFINED_SCHEMAS || customSchemas.has(name);
}

/**
 * Converts a StructError to ValidationError array
 */
function convertStructError(error: { failures(): Iterable<{ path: (string | number)[]; type: string; value: unknown; message: string }> }): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const failure of error.failures()) {
        errors.push({
            path: failure.path.join('.') || '(root)',
            expected: failure.type,
            received: getTypeOf(failure.value),
            message: failure.message,
        });
    }

    return errors;
}

/**
 * Gets a human-readable type name for a value
 */
function getTypeOf(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}
