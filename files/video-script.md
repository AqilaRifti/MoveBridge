# MoveBridge SDK - Video Script

## Duration: 3-4 minutes

---

### Opening (0:00 - 0:20)

**[Screen: MoveBridge logo + tagline]**

"Building dApps on Movement Network shouldn't be hard. But right now, it is."

"You're juggling multiple wallet APIs, writing untyped code, and testing against live networks."

"MoveBridge changes that. It's ethers.js for Movement - a complete SDK that makes blockchain development feel like regular web development."

---

### The Problem (0:20 - 0:45)

**[Screen: Code showing messy wallet integration]**

"Here's what Movement development looks like today:"

"Different code for Razor wallet... different code for Nightly... different code for OKX."

"No TypeScript types. Bugs everywhere."

"And testing? You're hitting the testnet for every unit test."

---

### The Solution (0:45 - 1:30)

**[Screen: Clean MoveBridge code]**

"MoveBridge gives you one unified API."

```typescript
const movement = new Movement({ network: 'testnet' });
await movement.wallet.connect('razor');
```

"That's it. Same code works for any wallet."

**[Screen: Type generation]**

"Want type safety? Generate TypeScript from your deployed contracts:"

```bash
npx @movebridge/codegen --address 0x1::coin --output ./types/coin.ts --network testnet
```

"Now you get autocomplete, type checking, and documentation - all generated automatically."

---

### React Integration (1:30 - 2:00)

**[Screen: React code]**

"Building with React? We've got hooks:"

```tsx
const { address, connect } = useMovement();
const { balance, loading } = useBalance();
```

"And pre-built components:"

```tsx
<WalletButton />
<WalletModal />
<AddressDisplay address={address} copyable />
```

"Drop them in and you're done."

---

### Testing (2:00 - 2:30)

**[Screen: Test code]**

"Testing is where MoveBridge really shines."

```typescript
const harness = createTestHarness();
harness.client.mockResponse('getAccountBalance', '1000000');
```

"Mock any response. Simulate network errors. Generate fake data."

"Your tests run in milliseconds, not minutes. CI stays green."

---

### Demo (2:30 - 3:15)

**[Screen: Live demo app]**

"Let me show you the demo app."

**[Click through features]**

1. "Connect wallet with one click"
2. "See your balance update in real-time"
3. "Transfer tokens with full type safety"
4. "Call contract functions - view and entry"
5. "Subscribe to events and watch them stream in"

"All of this built with MoveBridge in under 500 lines of code."

---

### Closing (3:15 - 3:45)

**[Screen: Package list + npm install commands]**

"MoveBridge SDK. Four packages:"

- `@movebridge/core` - The foundation
- `@movebridge/react` - React hooks and components  
- `@movebridge/codegen` - Type generation CLI
- `@movebridge/testing` - Testing utilities

"Install from npm today. Full documentation at movebridge.dev."

**[Screen: Logo + GitHub link]**

"MoveBridge: Build on Movement, ship with confidence."

---

## B-Roll Suggestions

- Terminal showing npm install
- VS Code with TypeScript autocomplete working
- Demo app wallet connection flow
- Test suite running and passing
- Documentation site navigation
