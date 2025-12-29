# MoveBridge SDK - Demo Guide

This guide walks through the demo applications and showcases the key features of MoveBridge SDK.

## Demo Options

### 1. Standalone HTML Demo
**Location:** `demo/index.html`

A simple, no-build-required demo that works in any browser.

**To run:**
```bash
# Just open the file in your browser
open demo/index.html
```

**Features demonstrated:**
- Wallet detection and connection
- Balance display
- Token transfer form
- Code examples

---

### 2. Full Next.js Demo
**Location:** `examples/demo/`

A complete React application showcasing all SDK features.

**To run:**
```bash
# From monorepo root
pnpm install
pnpm build
pnpm --filter movebridge-demo dev

# Open http://localhost:3000
```

---

## Demo Walkthrough

### Dashboard (`/`)

The main dashboard shows:

1. **Welcome Screen** (disconnected)
   - Available wallets detection
   - Connect button
   - Feature preview cards

2. **Account Overview** (connected)
   - Connected wallet badge
   - Address display with copy
   - Balance with refresh
   - Quick action cards

3. **SDK Features**
   - Code examples
   - Feature checklist

**Key code:**
```tsx
const { address, connected, wallets } = useMovement();
const { balance, loading, refetch } = useBalance();
```

---

### Transfer Page (`/transfer`)

Demonstrates token transfers with real-time status.

**Flow:**
1. Enter recipient address
2. Enter amount (or use quick buttons)
3. Click "Send Transfer"
4. Watch transaction status update
5. View on explorer

**Key code:**
```tsx
const { send, loading, data: txHash } = useTransaction();
const { data: txResponse } = useWaitForTransaction(txHash);

await send({
  function: '0x1::aptos_account::transfer',
  typeArguments: [],
  arguments: [recipient, amountInOctas],
});
```

**Features shown:**
- Transaction building
- Wallet signing
- Transaction confirmation polling
- Error handling
- Explorer integration

---

### Contract Page (`/contract`)

Interactive contract interaction demo.

**Preset Contracts:**
- `0x1::coin` - Token operations
- `0x1::account` - Account queries

**Features:**
1. Select preset or enter custom contract
2. Choose function to call
3. View results in JSON
4. See generated code example

**Key code:**
```tsx
const { read, write, loading, error } = useContract({
  address: '0x1',
  module: 'coin',
});

// View function
const result = await read('balance', [address]);

// Entry function
const txHash = await write('transfer', [to, amount]);
```

---

### Events Page (`/events`)

Real-time event subscription demo.

**Event Types:**
- `0x1::coin::DepositEvent`
- `0x1::coin::WithdrawEvent`
- `0x1::account::KeyRotationEvent`

**Features:**
1. Select event type
2. Start/stop subscription
3. View live event log
4. Filter events
5. Clear history

**Key code:**
```tsx
movement.events.subscribe({
  eventHandle: '0x1::coin::DepositEvent',
  callback: (event) => {
    console.log('New event:', event);
  }
});

movement.events.unsubscribeAll();
```

---

## Demo Scenarios

### Scenario 1: First-Time User
1. Open dashboard
2. See wallet detection
3. Connect Petra wallet
4. View balance
5. Explore features

### Scenario 2: Token Transfer
1. Connect wallet
2. Go to Transfer page
3. Enter test recipient
4. Send 0.1 MOVE
5. Watch confirmation
6. Check explorer

### Scenario 3: Contract Query
1. Connect wallet
2. Go to Contract page
3. Select "Coin Module"
4. Click "balance" function
5. View result

### Scenario 4: Event Monitoring
1. Connect wallet
2. Go to Events page
3. Start listening for deposits
4. (In another tab) Send yourself tokens
5. Watch event appear

---

## Testing the Demo

### Without a Wallet
The demo gracefully handles missing wallets:
- Shows "Not detected" for unavailable wallets
- Prompts to install wallet
- Works in read-only mode for some features

### With Testnet Tokens
Get testnet MOVE from the faucet:
1. Visit Movement faucet
2. Enter your address
3. Request tokens
4. Refresh balance in demo

### Common Issues

**"Wallet not found"**
- Install Petra, Pontem, or Nightly extension
- Refresh the page

**"Transaction failed"**
- Check you have enough balance
- Verify recipient address format
- Check network (should be testnet)

**"Balance shows 0"**
- Get tokens from faucet
- Check correct network in wallet

---

## Code Highlights

### Provider Setup
```tsx
// examples/demo/src/app/providers.tsx
<MovementProvider
  network="testnet"
  autoConnect
  onError={(error) => console.error(error)}
>
  {children}
</MovementProvider>
```

### Navigation with Status
```tsx
// examples/demo/src/app/components/Navigation.tsx
const { connected, network } = useMovement();

<div className={`badge ${network === 'mainnet' ? 'badge-success' : 'badge-info'}`}>
  {network}
</div>
```

### Transaction with Confirmation
```tsx
// examples/demo/src/app/transfer/page.tsx
const { send, data: txHash } = useTransaction();
const { data: txResponse, loading } = useWaitForTransaction(txHash);

// txResponse.success, txResponse.vmStatus, etc.
```

---

## Customizing the Demo

### Change Network
```tsx
// providers.tsx
const [network] = useState<NetworkType>('mainnet'); // or 'testnet'
```

### Add Custom Contract
```tsx
// contract/page.tsx
const EXAMPLE_CONTRACTS = [
  {
    name: 'My Contract',
    address: '0xYOUR_ADDRESS',
    module: 'your_module',
    functions: [
      { name: 'my_function', type: 'view', args: [], desc: 'Description' },
    ],
  },
  // ...existing contracts
];
```

### Style Customization
```css
/* globals.css */
:root {
  --primary-rgb: 79, 70, 229; /* Change primary color */
}
```

---

## Next Steps

After exploring the demo:

1. **Read the docs** - See README.md for full API
2. **Try the SDK** - `npm install @movebridge/core`
3. **Generate types** - Use codegen for your contracts
4. **Write tests** - Use @movebridge/testing
5. **Build your app** - You're ready!
