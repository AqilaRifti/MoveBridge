---
sidebar_position: 3
---

# TransactionBuilder

Constructs, signs, and submits transactions.

## Access

```typescript
const movement = new Movement({ network: 'testnet' });
const txBuilder = movement.transaction;
```

## Methods

### transfer

Build a token transfer transaction.

```typescript
transfer(options: TransferOptions): Promise<TransactionPayload>
```

#### Parameters

```typescript
interface TransferOptions {
  to: string;        // Recipient address
  amount: string;    // Amount in octas
  coinType?: string; // Coin type (default: AptosCoin)
}
```

#### Example

```typescript
const payload = await movement.transaction.transfer({
  to: '0x123...',
  amount: '1000000',
});
```

### build

Build a custom transaction.

```typescript
build(options: BuildOptions): Promise<TransactionPayload>
```

#### Parameters

```typescript
interface BuildOptions {
  function: string;        // Full function name
  typeArguments: string[]; // Type arguments
  arguments: unknown[];    // Function arguments
}
```

#### Example

```typescript
const payload = await movement.transaction.build({
  function: '0x1::coin::transfer',
  typeArguments: ['0x1::aptos_coin::AptosCoin'],
  arguments: ['0x123...', '1000000'],
});
```

### sign

Sign a transaction payload.

```typescript
sign(payload: TransactionPayload): Promise<SignedTransaction>
```

#### Returns

```typescript
interface SignedTransaction {
  payload: TransactionPayload;
  signature: string;
  sender: string;
}
```

### submit

Submit a signed transaction.

```typescript
submit(signed: SignedTransaction): Promise<string>
```

#### Returns

`Promise<string>` - Transaction hash

### signAndSubmit

Sign and submit in one step.

```typescript
signAndSubmit(payload: TransactionPayload): Promise<string>
```

#### Example

```typescript
const hash = await movement.transaction.signAndSubmit(payload);
```

### simulate

Simulate a transaction without submitting.

```typescript
simulate(payload: TransactionPayload): Promise<{
  success: boolean;
  gasUsed: string;
  vmStatus: string;
}>
```

#### Example

```typescript
const sim = await movement.transaction.simulate(payload);
if (sim.success) {
  console.log('Estimated gas:', sim.gasUsed);
}
```

## TransactionPayload

```typescript
interface TransactionPayload {
  type: 'entry_function_payload';
  function: string;
  typeArguments: string[];
  arguments: unknown[];
}
```
