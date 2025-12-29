---
sidebar_position: 3
---

# Validators

Validation utilities for testing.

## Address Validation

```typescript
import {
  isValidAddress,
  validateAddress,
  normalizeAddress,
  getAddressValidationDetails,
} from '@movebridge/testing';
```

### isValidAddress

```typescript
isValidAddress(address: string): boolean
```

### validateAddress

```typescript
validateAddress(address: string): AddressValidationResult

interface AddressValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}
```

### normalizeAddress

```typescript
normalizeAddress(address: string): string
// Pads to 64 hex chars
```

## Transaction Validation

```typescript
import {
  validateTransferPayload,
  validateEntryFunctionPayload,
  validatePayload,
} from '@movebridge/testing';
```

### validateTransferPayload

```typescript
validateTransferPayload(payload: TransferOptions): string[]
// Returns array of error messages (empty if valid)
```

### validateEntryFunctionPayload

```typescript
validateEntryFunctionPayload(payload: BuildOptions): string[]
```

## Schema Validation

```typescript
import {
  validateSchema,
  getValidationErrors,
  registerSchema,
  hasSchema,
  PREDEFINED_SCHEMAS,
} from '@movebridge/testing';
```

### validateSchema

```typescript
validateSchema(data: unknown, schemaName: string): void
// Throws if invalid
```

### getValidationErrors

```typescript
getValidationErrors(data: unknown, schemaName: string): string[]
```

### registerSchema

```typescript
registerSchema(name: string, schema: object): void
```

### Predefined Schemas

- `Resource`
- `Transaction`
- `TransactionResponse`
- `WalletState`
- `ContractEvent`

## Example

```typescript
import { isValidAddress, validateSchema } from '@movebridge/testing';

// Validate address
if (!isValidAddress(userInput)) {
  throw new Error('Invalid address');
}

// Validate data structure
validateSchema(response, 'TransactionResponse');
```
