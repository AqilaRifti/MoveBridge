# MoveBridge SDK - Demo Guide

## Live Demo

The demo application showcases all MoveBridge SDK features in a real Next.js app.

**URL:** [Demo App](http://localhost:3000) (run locally)

## Running the Demo

```bash
# From repository root
pnpm install
pnpm build
pnpm --filter movebridge-demo dev
```

Open http://localhost:3000

## Demo Features

### 1. Dashboard (Home Page)

**What it shows:**
- Wallet connection status
- Account address with copy button
- Current balance (auto-refreshes)
- Network indicator

**SDK features demonstrated:**
```tsx
const { address, connected, connect, disconnect } = useMovement();
const { balance, loading } = useBalance();
```

### 2. Transfer Page

**What it shows:**
- Token transfer form
- Recipient address input
- Amount input with validation
- Transaction status tracking
- Transaction hash with explorer link

**SDK features demonstrated:**
```typescript
const tx = await movement.transaction.transfer({
  to: recipientAddress,
  amount: amountInOctas,
});
const hash = await movement.transaction.signAndSubmit(tx);
await movement.waitForTransaction(hash);
```

### 3. Contract Page

**What it shows:**
- Contract address input
- Module name input
- View function calls (read-only)
- Entry function calls (write)
- Function arguments builder
- Response display

**SDK features demonstrated:**
```typescript
const contract = movement.contract({
  address: contractAddress,
  module: moduleName,
});

// View function
const result = await contract.view('get_count', []);

// Entry function
const txHash = await contract.call('increment', []);
```

### 4. Events Page

**What it shows:**
- Event type selector (Deposit, Withdraw, Key Rotation)
- Subscribe/Unsubscribe toggle
- Real-time event log
- Event data expansion
- Filter by content
- Auto-scroll toggle

**SDK features demonstrated:**
```typescript
const subId = movement.events.subscribe({
  accountAddress: address,
  eventType: '0x1::coin::DepositEvent',
  callback: (event) => {
    console.log('New event:', event);
  }
});

// Cleanup
movement.events.unsubscribe(subId);
```

## Demo Walkthrough Script

### Step 1: Connect Wallet

1. Click "Connect Wallet" button
2. Select wallet (Razor, Nightly, or OKX)
3. Approve connection in wallet popup
4. See address and balance appear

### Step 2: View Balance

1. Balance displays automatically after connection
2. Click refresh to update
3. Note the formatted display (APT vs octas)

### Step 3: Transfer Tokens

1. Navigate to Transfer page
2. Enter recipient address
3. Enter amount (e.g., 0.01 APT)
4. Click "Send"
5. Approve in wallet
6. Watch transaction status update
7. Click hash to view on explorer

### Step 4: Contract Interaction

1. Navigate to Contract page
2. Enter a contract address (e.g., `0x1`)
3. Enter module name (e.g., `coin`)
4. Try a view function:
   - Function: `balance`
   - Args: `["0x1::aptos_coin::AptosCoin"]`
5. Try an entry function (if applicable)

### Step 5: Event Subscriptions

1. Navigate to Events page
2. Select event type (e.g., Deposit Events)
3. Click "Start Listening"
4. Make a transfer in another tab
5. Watch event appear in real-time
6. Expand event to see full data
7. Click "Stop Listening" when done

## Code Highlights

### Provider Setup (layout.tsx)
```tsx
<MovementProvider network="testnet" autoConnect>
  {children}
</MovementProvider>
```

### Wallet Button Component
```tsx
function ConnectButton() {
  const { connected, connect, disconnect, wallets, address } = useMovement();
  
  if (connected) {
    return (
      <div>
        <AddressDisplay address={address} truncate copyable />
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }
  
  return (
    <button onClick={() => connect(wallets[0])}>
      Connect Wallet
    </button>
  );
}
```

### Balance Display
```tsx
function Balance() {
  const { balance, loading, refetch } = useBalance();
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      {formatBalance(balance)} APT
      <button onClick={refetch}>↻</button>
    </div>
  );
}
```

### Transfer Form
```tsx
function TransferForm() {
  const { movement } = useMovement();
  const { send, loading, data, error } = useTransaction();
  
  const handleSubmit = async (to: string, amount: string) => {
    const tx = await movement.transaction.transfer({ to, amount });
    await send(tx);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {data && <p>TX: {data.hash}</p>}
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

## Testing the Demo

The demo includes examples you can use to verify SDK functionality:

| Test | How to Verify |
|------|---------------|
| Wallet detection | Available wallets shown in modal |
| Connection | Address appears after connecting |
| Balance fetch | Balance displays correctly |
| Transfer | Transaction completes, balance updates |
| Contract view | Returns expected data |
| Contract call | Transaction submits successfully |
| Events | Events appear when triggered |

## Troubleshooting

**Wallet not detected:**
- Ensure wallet extension is installed
- Refresh the page
- Check browser console for errors

**Transaction fails:**
- Verify sufficient balance
- Check recipient address format
- Ensure correct network (testnet)

**Events not appearing:**
- Verify subscription is active (green indicator)
- Make a transaction to trigger events
- Check that event type matches your activity
