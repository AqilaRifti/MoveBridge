---
sidebar_position: 1
---

# Movement

The main entry point for MoveBridge SDK.

## Import

```typescript
import { Movement } from '@movebridge/core';
```

## Constructor

```typescript
new Movement(config: MovementConfig)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `MovementConfig` | Configuration options |

### MovementConfig

```typescript
interface MovementConfig {
  network: 'mainnet' | 'testnet';  // Required
  rpcUrl?: string;                  // Custom RPC URL
  indexerUrl?: string;              // Custom indexer URL
  autoConnect?: boolean;            // Auto-connect to last wallet
}
```

### Example

```typescript
const movement = new Movement({
  network: 'testnet',
  autoConnect: true,
});
```

## Properties

### config

```typescript
readonly config: ResolvedConfig
```

The resolved configuration with all URLs.

```typescript
interface ResolvedConfig {
  network: NetworkType;
  chainId: number;
  rpcUrl: string;
  indexerUrl: string | null;
  explorerUrl: string;
  autoConnect: boolean;
}
```

### wallet

```typescript
readonly wallet: WalletManager
```

The wallet manager instance. See [WalletManager](/docs/api/core/wallet-manager).

### transaction

```typescript
readonly transaction: TransactionBuilder
```

The transaction builder instance. See [TransactionBuilder](/docs/api/core/transaction-builder).

### events

```typescript
readonly events: EventListener
```

The event listener instance. See [EventListener](/docs/api/core/event-listener).

## Methods

### getAccountBalance

Get the balance of an account.

```typescript
getAccountBalance(address: string): Promise<string>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `string` | Account address |

#### Returns

`Promise<string>` - Balance in octas (smallest unit)

#### Throws

- `MovementError` with code `INVALID_ADDRESS` if address is invalid
- `MovementError` with code `NETWORK_ERROR` if request fails

#### Example

```typescript
const balance = await movement.getAccountBalance('0x1');
console.log('Balance:', balance, 'octas');
```

### getAccountResources

Get all resources for an account.

```typescript
getAccountResources(address: string): Promise<Resource[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `string` | Account address |

#### Returns

`Promise<Resource[]>` - Array of resources

```typescript
interface Resource {
  type: string;
  data: Record<string, unknown>;
}
```

#### Example

```typescript
const resources = await movement.getAccountResources('0x1');
resources.forEach(r => console.log(r.type));
```

### getTransaction

Get a transaction by hash.

```typescript
getTransaction(hash: string): Promise<Transaction>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `hash` | `string` | Transaction hash |

#### Returns

`Promise<Transaction>` - Transaction data

```typescript
interface Transaction {
  hash: string;
  sender: string;
  sequenceNumber: string;
  payload: TransactionPayload;
  timestamp: string;
}
```

#### Example

```typescript
const tx = await movement.getTransaction('0x123...');
console.log('Sender:', tx.sender);
```

### waitForTransaction

Wait for a transaction to be confirmed.

```typescript
waitForTransaction(
  hash: string,
  options?: { timeoutMs?: number; checkIntervalMs?: number }
): Promise<TransactionResponse>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hash` | `string` | - | Transaction hash |
| `options.timeoutMs` | `number` | `30000` | Timeout in milliseconds |
| `options.checkIntervalMs` | `number` | `1000` | Check interval in milliseconds |

#### Returns

`Promise<TransactionResponse>` - Transaction result

```typescript
interface TransactionResponse {
  hash: string;
  success: boolean;
  vmStatus: string;
  gasUsed: string;
  events: ContractEvent[];
}
```

#### Throws

- `MovementError` with code `TRANSACTION_TIMEOUT` if timeout exceeded

#### Example

```typescript
const result = await movement.waitForTransaction('0x123...', {
  timeoutMs: 60000,
});

if (result.success) {
  console.log('Confirmed! Gas used:', result.gasUsed);
}
```

### contract

Create a contract interface.

```typescript
contract(options: ContractOptions): ContractInterface
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.address` | `string` | Contract address |
| `options.module` | `string` | Module name |

#### Returns

`ContractInterface` - Contract interface instance

#### Example

```typescript
const counter = movement.contract({
  address: '0x123...',
  module: 'counter',
});

const count = await counter.view('get_count', []);
```

### getAptosClient

Get the underlying Aptos SDK client.

```typescript
getAptosClient(): Aptos
```

#### Returns

`Aptos` - Aptos SDK client instance

#### Example

```typescript
const aptos = movement.getAptosClient();
const modules = await aptos.getAccountModules({ accountAddress: '0x1' });
```

## Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 126 | https://full.mainnet.movementinfra.xyz/v1 |
| Testnet | 250 | https://testnet.movementnetwork.xyz/v1 |
