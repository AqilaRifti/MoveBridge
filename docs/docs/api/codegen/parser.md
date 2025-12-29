---
sidebar_position: 2
---

# ABIParser

Fetches and parses Move module ABIs.

## Import

```typescript
import { ABIParser } from '@movebridge/codegen';
```

## Constructor

```typescript
new ABIParser(network: 'mainnet' | 'testnet')
```

## Methods

### fetchABI

Fetch ABI from the network.

```typescript
fetchABI(moduleAddress: string): Promise<ModuleABI>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `moduleAddress` | `string` | Module address (e.g., `0x1::coin`) |

#### Returns

```typescript
interface ModuleABI {
  address: string;
  name: string;
  exposedFunctions: FunctionABI[];
}

interface FunctionABI {
  name: string;
  visibility: 'public' | 'private' | 'friend';
  isEntry: boolean;
  isView: boolean;
  genericTypeParams: TypeParam[];
  params: string[];
  return: string[];
}

interface TypeParam {
  constraints: string[];
}
```

### parseType

Parse Move type to TypeScript type.

```typescript
parseType(moveType: string): string
```

#### Type Mappings

| Move Type | TypeScript Type |
|-----------|-----------------|
| `bool` | `boolean` |
| `u8`, `u16`, `u32` | `number` |
| `u64`, `u128`, `u256` | `string` |
| `address` | `string` |
| `vector<T>` | `T[]` |
| `0x1::string::String` | `string` |
| `&signer`, `signer` | `void` |
| `T0`, `T1`, etc. | `T0`, `T1`, etc. |

## Example

```typescript
const parser = new ABIParser('testnet');
const abi = await parser.fetchABI('0x1::coin');

console.log('Module:', abi.name);
console.log('Functions:', abi.exposedFunctions.length);

const tsType = parser.parseType('vector<u64>');
console.log(tsType); // 'string[]'
```
