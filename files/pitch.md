# MoveBridge SDK - Pitch

## The Problem

Building dApps on Movement Network today is painful:

1. **Fragmented wallet support** - Each wallet (Razor, Nightly, OKX) has different APIs. Developers write boilerplate code for each one.

2. **No type safety** - Raw Aptos SDK calls return `any` types. Bugs slip through to production.

3. **Steep learning curve** - Movement uses Move language with unique concepts (resources, abilities, generics). No abstraction layer exists.

4. **Testing is hard** - No mocking utilities. Developers test against live testnets, making CI/CD slow and flaky.

5. **React integration is DIY** - Every team builds their own hooks and context providers from scratch.

## The Solution: MoveBridge SDK

MoveBridge is **ethers.js for Movement Network** - a complete TypeScript SDK that makes Movement development feel familiar and productive.

### What We Built

| Package | Purpose |
|---------|---------|
| `@movebridge/core` | Unified wallet connection, transactions, contract calls |
| `@movebridge/react` | React hooks + pre-built components |
| `@movebridge/codegen` | Generate TypeScript from deployed contracts |
| `@movebridge/testing` | Mocks, fakers, validators for testing |

### Key Differentiators

**1. Unified Wallet API**
```typescript
// One API for all wallets
await movement.wallet.connect('razor');  // or 'nightly', 'okx'
```

**2. Type-Safe Contracts**
```bash
npx movebridge-gen --address 0x1::coin --output ./types/coin.ts
```
```typescript
// Auto-generated, fully typed
const balance = await coin.balance(address, ['0x1::aptos_coin::AptosCoin']);
```

**3. React-First Design**
```tsx
const { address, connect, disconnect } = useMovement();
const { balance, loading } = useBalance();
```

**4. Testing That Works**
```typescript
const harness = createTestHarness();
harness.client.mockResponse('getAccountBalance', '1000000');
// Test without hitting the network
```

## Market Opportunity

- Movement Network is growing rapidly
- No comprehensive SDK exists today
- Ethereum developers expect ethers.js-level tooling
- First-mover advantage in developer tooling

## Traction

- 4 production-ready packages
- Full documentation site
- Demo application showcasing all features
- Published to npm as `@movebridge/*`

## Ask

We're building the developer infrastructure layer for Movement Network. MoveBridge SDK reduces dApp development time from weeks to days.

**MoveBridge: Build on Movement, ship with confidence.**
