---
sidebar_position: 4
---

# ContractInterface

Simplified interface for Move module interactions.

## Creation

```typescript
const contract = movement.contract({
  address: '0x1',
  module: 'coin',
});
```

## Properties

### address

```typescript
readonly address: string
```

### module

```typescript
readonly module: string
```

## Methods

### view

Call a view function (read-only).

```typescript
view<T = unknown>(
  functionName: string,
  args: unknown[],
  typeArgs?: string[]
): Promise<T>
```

#### Example

```typescript
const balance = await contract.view<string>('balance', [address], [coinType]);
```

### call

Call an entry function (write).

```typescript
call(
  functionName: string,
  args: unknown[],
  typeArgs?: string[]
): Promise<string>
```

#### Returns

`Promise<string>` - Transaction hash

#### Example

```typescript
const txHash = await contract.call('transfer', [to, amount], [coinType]);
```

### hasResource

Check if a resource exists.

```typescript
hasResource(resourceType: string): Promise<boolean>
```

#### Example

```typescript
const exists = await contract.hasResource('0x1::coin::CoinStore<...>');
```

### getResource

Get a resource.

```typescript
getResource<T = unknown>(resourceType: string): Promise<T | null>
```

#### Example

```typescript
const resource = await contract.getResource<CoinStore>(resourceType);
```

### getFullFunctionName

Get the full function name.

```typescript
getFullFunctionName(functionName: string): string
```

#### Example

```typescript
const fullName = contract.getFullFunctionName('transfer');
// '0x1::coin::transfer'
```
