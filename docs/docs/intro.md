---
sidebar_position: 1
slug: /
---

# MoveBridge SDK

> **ethers.js for Movement Network**

MoveBridge SDK is a comprehensive TypeScript SDK that simplifies frontend development on Movement Network. It provides a unified, developer-friendly interface that abstracts wallet complexity and enables type-safe contract interactions.

## Why MoveBridge?

Building on Movement Network today requires dealing with:

- 🔧 **Wallet fragmentation** - Each wallet (Razor, OKX, Nightly) has different APIs
- 📝 **Boilerplate overload** - Repetitive code for connections, transactions, error handling
- 🔍 **Type safety gaps** - Move contracts lack TypeScript bindings
- ⏱️ **Slow iteration** - No testing utilities means slow feedback loops
- 🧩 **React friction** - No hooks or components for common patterns

**MoveBridge solves all of this** with one unified SDK.

## Features

- ✅ **Unified wallet connection** - Support for Razor, OKX, and Nightly wallets with one API
- ✅ **Type-safe contract interactions** - Full TypeScript support with auto-generated types
- ✅ **React hooks** - Easy integration with React applications
- ✅ **Auto-generated types** - Generate TypeScript bindings from deployed Move modules
- ✅ **Event subscriptions** - Real-time contract event listening
- ✅ **Transaction simulation** - Estimate gas before submitting
- ✅ **Comprehensive testing** - Mocks, fakers, and validators for testing

## Packages

| Package | Description |
|---------|-------------|
| [`@movebridge/core`](/docs/packages/core) | Core SDK with wallet management, transactions, and contract interactions |
| [`@movebridge/react`](/docs/packages/react) | React hooks and pre-built components |
| [`@movebridge/codegen`](/docs/packages/codegen) | CLI tool for generating TypeScript bindings |
| [`@movebridge/testing`](/docs/packages/testing) | Testing utilities: mocks, fakers, validators |

## Quick Example

```typescript
import { Movement } from '@movebridge/core';

// Initialize client
const movement = new Movement({ network: 'testnet' });

// Connect wallet
await movement.wallet.connect('razor');

// Get balance
const balance = await movement.getAccountBalance(
  movement.wallet.getState().address!
);

// Transfer tokens
const tx = await movement.transaction.transfer({
  to: '0x123...',
  amount: '1000000', // 1 APT in octas
});
const hash = await movement.transaction.signAndSubmit(tx);
```

## Network Support

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 126 | https://full.mainnet.movementinfra.xyz/v1 |
| Testnet | 250 | https://testnet.movementnetwork.xyz/v1 |

## License

MIT License - Created by [Aqila Rifti](https://github.com/AqilaRifti)

## Next Steps

- [Getting Started](/docs/getting-started) - Install and set up MoveBridge
- [Core SDK](/docs/packages/core) - Learn about the core functionality
- [React Integration](/docs/packages/react) - Build React apps with MoveBridge
