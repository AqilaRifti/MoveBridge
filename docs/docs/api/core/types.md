---
sidebar_position: 7
---

# Types

TypeScript type definitions for @movebridge/core.

## Network Types

```typescript
type NetworkType = 'mainnet' | 'testnet';

type WalletType = 'petra' | 'pontem' | 'nightly';
```

## Configuration

```typescript
interface MovementConfig {
  network: NetworkType;
  rpcUrl?: string;
  indexerUrl?: string;
  autoConnect?: boolean;
}

interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  indexerUrl: string | null;
  explorerUrl: string;
  faucetUrl?: string;
}
```

## Wallet

```typescript
interface WalletState {
  connected: boolean;
  address: string | null;
  publicKey: string | null;
}

interface WalletEvents {
  connect: (address: string) => void;
  disconnect: () => void;
  accountChanged: (newAddress: string) => void;
  networkChanged: (network: string) => void;
}
```

## Transaction

```typescript
interface TransactionPayload {
  type: 'entry_function_payload';
  function: string;
  typeArguments: string[];
  arguments: unknown[];
}

interface SignedTransaction {
  payload: TransactionPayload;
  signature: string;
  sender: string;
}

interface Transaction {
  hash: string;
  sender: string;
  sequenceNumber: string;
  payload: TransactionPayload;
  timestamp: string;
}

interface TransactionResponse {
  hash: string;
  success: boolean;
  vmStatus: string;
  gasUsed: string;
  events: ContractEvent[];
}

interface TransferOptions {
  to: string;
  amount: string;
  coinType?: string;
}

interface BuildOptions {
  function: string;
  typeArguments: string[];
  arguments: unknown[];
}
```

## Contract

```typescript
interface ContractOptions {
  address: string;
  module: string;
}

interface Resource {
  type: string;
  data: Record<string, unknown>;
}
```

## Events

```typescript
interface ContractEvent {
  type: string;
  sequenceNumber: string;
  data: Record<string, unknown>;
}

interface EventSubscription {
  eventHandle: string;
  callback: (event: ContractEvent) => void;
}
```

## Errors

```typescript
type ErrorCode =
  | 'INVALID_ADDRESS'
  | 'WALLET_NOT_FOUND'
  | 'WALLET_CONNECTION_FAILED'
  | 'WALLET_NOT_CONNECTED'
  | 'TRANSACTION_FAILED'
  | 'TRANSACTION_TIMEOUT'
  | 'VIEW_FUNCTION_FAILED'
  | 'INVALID_EVENT_HANDLE'
  | 'NETWORK_ERROR'
  | 'ABI_FETCH_FAILED'
  | 'CODEGEN_FAILED'
  | 'INVALID_ARGUMENT';

type ErrorDetails = Record<string, unknown>;
```
