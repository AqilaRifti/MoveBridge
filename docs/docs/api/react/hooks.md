---
sidebar_position: 2
---

# Hooks

React hooks for MoveBridge SDK.

## useMovement

Wallet connection state and actions.

```typescript
const {
  movement,    // Movement | null
  network,     // NetworkType
  address,     // string | null
  connected,   // boolean
  connecting,  // boolean
  connect,     // (wallet: WalletType) => Promise<void>
  disconnect,  // () => Promise<void>
  wallets,     // WalletType[]
  wallet,      // WalletType | null
} = useMovement();
```

### Example

```tsx
function WalletButton() {
  const { connected, connect, disconnect, wallets } = useMovement();

  if (connected) {
    return <button onClick={disconnect}>Disconnect</button>;
  }

  return <button onClick={() => connect(wallets[0])}>Connect</button>;
}
```

## useBalance

Fetch account balance.

```typescript
const {
  balance,  // string | null
  loading,  // boolean
  error,    // MovementError | null
  refetch,  // () => Promise<void>
} = useBalance(address?);
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `address` | `string` | Connected address | Address to fetch balance for |

### Example

```tsx
function Balance() {
  const { balance, loading, refetch } = useBalance();

  return (
    <div>
      {loading ? 'Loading...' : `${balance} octas`}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

## useContract

Contract interactions.

```typescript
const {
  data,      // T | null
  loading,   // boolean
  error,     // MovementError | null
  read,      // <R>(fn, args, typeArgs?) => Promise<R>
  write,     // (fn, args, typeArgs?) => Promise<string>
  contract,  // ContractInterface | null
} = useContract<T>({ address, module });
```

### Parameters

```typescript
interface UseContractOptions {
  address: string;
  module: string;
}
```

### Example

```tsx
function Counter() {
  const { data, read, write } = useContract({
    address: '0x123...',
    module: 'counter',
  });

  return (
    <div>
      <p>Count: {data}</p>
      <button onClick={() => read('get_count', [])}>Fetch</button>
      <button onClick={() => write('increment', [])}>Increment</button>
    </div>
  );
}
```

## useTransaction

Submit transactions.

```typescript
const {
  send,    // (payload: TransactionPayload) => Promise<void>
  data,    // string | null (tx hash)
  loading, // boolean
  error,   // MovementError | null
  reset,   // () => void
} = useTransaction();
```

### Example

```tsx
function Transfer() {
  const { send, data, loading } = useTransaction();

  const handleSend = () => {
    send({
      function: '0x1::coin::transfer',
      typeArguments: ['0x1::aptos_coin::AptosCoin'],
      arguments: ['0x456...', '1000000'],
    });
  };

  return (
    <div>
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {data && <p>Hash: {data}</p>}
    </div>
  );
}
```

## useWaitForTransaction

Wait for transaction confirmation.

```typescript
const {
  data,    // TransactionResponse | null
  loading, // boolean
  error,   // MovementError | null
} = useWaitForTransaction(hash, options?);
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `hash` | `string \| null` | Transaction hash |
| `options.timeoutMs` | `number` | Timeout (default: 30000) |
| `options.checkIntervalMs` | `number` | Check interval (default: 1000) |

### Example

```tsx
function TxStatus({ hash }) {
  const { data, loading } = useWaitForTransaction(hash);

  if (loading) return <p>Confirming...</p>;
  if (data?.success) return <p>✅ Confirmed</p>;
  if (data) return <p>❌ Failed: {data.vmStatus}</p>;
  return null;
}
```
