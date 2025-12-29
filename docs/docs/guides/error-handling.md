---
sidebar_position: 5
---

# Error Handling

Learn how to handle errors properly with MoveBridge's structured error system.

## Overview

MoveBridge uses a structured error system with typed error codes, making it easy to handle specific error conditions programmatically.

## MovementError Class

All SDK errors are instances of `MovementError`:

```typescript
import { MovementError, isMovementError } from '@movebridge/core';

class MovementError extends Error {
  code: ErrorCode;                    // Error code for programmatic handling
  details?: Record<string, unknown>;  // Additional context
  
  toJSON(): Record<string, unknown>;  // Serialize to JSON
  toString(): string;                 // Human-readable string
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_ADDRESS` | Invalid address format |
| `WALLET_NOT_FOUND` | Wallet extension not installed |
| `WALLET_CONNECTION_FAILED` | Connection rejected or failed |
| `WALLET_NOT_CONNECTED` | No wallet connected |
| `TRANSACTION_FAILED` | Transaction execution failed |
| `TRANSACTION_TIMEOUT` | Transaction confirmation timed out |
| `VIEW_FUNCTION_FAILED` | View function call failed |
| `INVALID_EVENT_HANDLE` | Invalid event handle format |
| `NETWORK_ERROR` | Network request failed |
| `ABI_FETCH_FAILED` | Failed to fetch contract ABI |
| `CODEGEN_FAILED` | Code generation failed |
| `INVALID_ARGUMENT` | Invalid argument provided |

## Type Guard

Use `isMovementError` to check if an error is a MovementError:

```typescript
import { isMovementError } from '@movebridge/core';

try {
  await movement.wallet.connect('petra');
} catch (error) {
  if (isMovementError(error)) {
    // TypeScript knows error is MovementError
    console.log('Code:', error.code);
    console.log('Details:', error.details);
  } else {
    // Unknown error
    console.log('Unexpected error:', error);
  }
}
```

## Handling Specific Errors

### Wallet Errors

```typescript
try {
  await movement.wallet.connect('petra');
} catch (error) {
  if (isMovementError(error)) {
    switch (error.code) {
      case 'WALLET_NOT_FOUND':
        // Wallet not installed
        const available = error.details?.available as string[];
        console.log('Available wallets:', available);
        // Show install prompt
        break;
        
      case 'WALLET_CONNECTION_FAILED':
        // User rejected or error occurred
        console.log('Connection failed:', error.message);
        break;
        
      case 'WALLET_NOT_CONNECTED':
        // Tried to use wallet without connecting
        console.log('Please connect wallet first');
        break;
    }
  }
}
```

### Transaction Errors

```typescript
try {
  const hash = await movement.transaction.signAndSubmit(payload);
  await movement.waitForTransaction(hash);
} catch (error) {
  if (isMovementError(error)) {
    switch (error.code) {
      case 'TRANSACTION_FAILED':
        console.log('Transaction failed');
        console.log('VM Status:', error.details?.vmStatus);
        console.log('Gas used:', error.details?.gasUsed);
        break;
        
      case 'TRANSACTION_TIMEOUT':
        console.log('Transaction timed out');
        console.log('Hash:', error.details?.hash);
        // Could retry or check status manually
        break;
    }
  }
}
```

### Contract Errors

```typescript
try {
  const result = await contract.view('get_count', []);
} catch (error) {
  if (isMovementError(error)) {
    switch (error.code) {
      case 'VIEW_FUNCTION_FAILED':
        console.log('View function failed');
        console.log('Function:', error.details?.function);
        console.log('Args:', error.details?.args);
        break;
        
      case 'INVALID_ADDRESS':
        console.log('Invalid contract address');
        break;
    }
  }
}
```

### Network Errors

```typescript
try {
  const balance = await movement.getAccountBalance(address);
} catch (error) {
  if (isMovementError(error)) {
    if (error.code === 'NETWORK_ERROR') {
      console.log('Network request failed');
      console.log('URL:', error.details?.url);
      console.log('Status:', error.details?.httpStatus);
      // Could retry or show offline message
    }
  }
}
```

## React Error Handling

Use the `onError` callback in `MovementProvider`:

```tsx
import { MovementProvider } from '@movebridge/react';
import type { MovementError } from '@movebridge/core';

function App() {
  const handleError = (error: MovementError) => {
    // Global error handler
    console.error('MoveBridge error:', error.code, error.message);
    
    // Show toast notification
    toast.error(error.message);
  };

  return (
    <MovementProvider 
      network="testnet" 
      onError={handleError}
    >
      <YourApp />
    </MovementProvider>
  );
}
```

### Hook-Level Error Handling

```tsx
import { useBalance, useTransaction } from '@movebridge/react';

function MyComponent() {
  const { balance, error: balanceError } = useBalance();
  const { send, error: txError } = useTransaction();

  // Handle errors from hooks
  useEffect(() => {
    if (balanceError) {
      console.log('Balance error:', balanceError.code);
    }
    if (txError) {
      console.log('Transaction error:', txError.code);
    }
  }, [balanceError, txError]);

  return (
    <div>
      {balanceError && <p>Failed to load balance</p>}
      {txError && <p>Transaction failed: {txError.message}</p>}
    </div>
  );
}
```

## Error Details

Each error includes contextual details:

```typescript
// WALLET_NOT_FOUND
{
  code: 'WALLET_NOT_FOUND',
  message: 'Wallet "petra" not found. Available wallets: pontem, nightly',
  details: {
    wallet: 'petra',
    available: ['pontem', 'nightly']
  }
}

// TRANSACTION_FAILED
{
  code: 'TRANSACTION_FAILED',
  message: 'Transaction 0x123... failed with status: Move abort',
  details: {
    hash: '0x123...',
    vmStatus: 'Move abort',
    gasUsed: '1234'
  }
}

// VIEW_FUNCTION_FAILED
{
  code: 'VIEW_FUNCTION_FAILED',
  message: 'View function "0x1::coin::balance" failed: ...',
  details: {
    function: '0x1::coin::balance',
    args: ['0x123...'],
    originalError: Error
  }
}
```

## Wrapping Errors

Use `wrapError` to convert unknown errors to MovementError:

```typescript
import { wrapError } from '@movebridge/core';

try {
  // Some operation that might throw
  await someOperation();
} catch (error) {
  // Wrap as MovementError with context
  throw wrapError(error, 'NETWORK_ERROR', 'Failed to fetch data');
}
```

## Best Practices

1. **Always use type guards** - Check `isMovementError` before accessing properties
2. **Handle specific codes** - Use switch statements for different error types
3. **Log error details** - Include `error.details` in logs for debugging
4. **Show user-friendly messages** - Don't expose raw error messages to users
5. **Implement retry logic** - For network errors, consider automatic retries
6. **Use global error handlers** - Catch unhandled errors at the app level

## Next Steps

- [API Reference](/docs/api/core/errors) - Full error API documentation
- [Testing](/docs/packages/testing) - Mock errors in tests
