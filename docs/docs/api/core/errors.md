---
sidebar_position: 6
---

# Errors

Structured error handling for MoveBridge.

## MovementError

```typescript
class MovementError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;
  
  toJSON(): Record<string, unknown>;
  toString(): string;
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_ADDRESS` | Invalid address format |
| `WALLET_NOT_FOUND` | Wallet not installed |
| `WALLET_CONNECTION_FAILED` | Connection failed |
| `WALLET_NOT_CONNECTED` | No wallet connected |
| `TRANSACTION_FAILED` | Transaction failed |
| `TRANSACTION_TIMEOUT` | Confirmation timeout |
| `VIEW_FUNCTION_FAILED` | View function error |
| `INVALID_EVENT_HANDLE` | Invalid event handle |
| `NETWORK_ERROR` | Network request failed |
| `ABI_FETCH_FAILED` | ABI fetch failed |
| `CODEGEN_FAILED` | Code generation failed |
| `INVALID_ARGUMENT` | Invalid argument |

## Type Guard

```typescript
import { isMovementError } from '@movebridge/core';

if (isMovementError(error)) {
  console.log(error.code);
}
```

## Error Factory

```typescript
import { Errors } from '@movebridge/core';

Errors.invalidAddress(address, reason);
Errors.walletNotFound(wallet, available);
Errors.walletConnectionFailed(wallet, originalError);
Errors.walletNotConnected();
Errors.transactionFailed(hash, vmStatus, gasUsed);
Errors.transactionTimeout(hash);
Errors.viewFunctionFailed(functionName, args, originalError);
Errors.invalidEventHandle(eventHandle);
Errors.networkError(url, httpStatus, responseBody);
Errors.abiFetchFailed(address, network, originalError);
Errors.codegenFailed(reason, abi);
Errors.invalidArgument(argument, reason);
```

## wrapError

```typescript
import { wrapError } from '@movebridge/core';

throw wrapError(error, 'NETWORK_ERROR', 'Failed to fetch');
```
