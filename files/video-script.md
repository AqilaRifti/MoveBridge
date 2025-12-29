# MoveBridge SDK - Video Script

**Duration:** 3-5 minutes  
**Format:** Screen recording with voiceover  
**Audience:** Developers, hackathon judges, potential users

---

## INTRO (0:00 - 0:30)

### Visual
- MoveBridge logo animation
- Tagline: "ethers.js for Movement Network"

### Script
> "Building on Movement Network? You've probably felt the pain of wallet integration, type safety, and testing. Today I'm going to show you MoveBridge SDK - a complete toolkit that makes Movement development feel like magic."

> "In the next few minutes, I'll show you how to go from zero to a working dApp with wallet connection, token transfers, and contract interactions."

---

## THE PROBLEM (0:30 - 1:00)

### Visual
- Split screen: messy code on left, clean code on right
- Show typical wallet connection boilerplate (~50 lines)

### Script
> "Here's what wallet connection looks like without MoveBridge. Different APIs for each wallet, manual state management, error handling everywhere. It's a lot of code just to connect a wallet."

> "And that's before you even think about transactions, contract calls, or testing."

---

## THE SOLUTION (1:00 - 1:30)

### Visual
- Terminal: `npm install @movebridge/core @movebridge/react`
- Code editor: Simple setup

### Script
> "With MoveBridge, it's two packages and a few lines of code."

```typescript
import { MovementProvider, useMovement } from '@movebridge/react';

function App() {
  return (
    <MovementProvider network="testnet">
      <MyApp />
    </MovementProvider>
  );
}
```

> "Wrap your app in the provider, and you're ready to go."

---

## DEMO: WALLET CONNECTION (1:30 - 2:00)

### Visual
- Demo app in browser
- Click "Connect Wallet"
- Wallet popup appears
- Connected state shows

### Script
> "Let's see it in action. Here's our demo app. I click connect..."

> "The SDK automatically detects installed wallets. I'll connect with Petra..."

> "And we're connected. The address is displayed, balance is fetched automatically. All with one hook."

```typescript
const { address, connected, connect } = useMovement();
const { balance } = useBalance();
```

---

## DEMO: TOKEN TRANSFER (2:00 - 2:45)

### Visual
- Navigate to Transfer page
- Fill in recipient and amount
- Click Send
- Show transaction status updating
- Show success state

### Script
> "Now let's send some tokens. I'll go to the transfer page..."

> "Enter a recipient address, amount... and send."

> "Watch the status - it's polling for confirmation automatically. And there it is - confirmed on chain."

> "Here's the code that made this happen:"

```typescript
const { send, data: txHash } = useTransaction();
const { data: txResponse } = useWaitForTransaction(txHash);

await send({
  function: '0x1::aptos_account::transfer',
  arguments: [recipient, amount],
});
```

> "Three lines to send tokens and track confirmation."

---

## DEMO: CONTRACT INTERACTION (2:45 - 3:15)

### Visual
- Navigate to Contract page
- Select a function
- Show result
- Show code example

### Script
> "What about smart contracts? The SDK makes that easy too."

> "Here I can call any view function on any contract. Let me check a balance..."

> "Result comes back instantly. And for entry functions, it handles signing and submission automatically."

```typescript
const { read, write } = useContract({
  address: '0x1',
  module: 'coin',
});

const balance = await read('balance', [address]);
const txHash = await write('transfer', [to, amount]);
```

---

## CODE GENERATION (3:15 - 3:45)

### Visual
- Terminal: Run codegen command
- Show generated TypeScript file
- Show autocomplete in IDE

### Script
> "But here's where it gets really powerful. MoveBridge can generate TypeScript types from your deployed contracts."

```bash
npx movebridge-gen --address 0x1::coin --output ./types/coin.ts
```

> "Now I have full type safety and autocomplete for every function in the contract. No more guessing parameter types or function names."

---

## TESTING (3:45 - 4:15)

### Visual
- Show test file
- Run tests
- All passing

### Script
> "And for testing, we've got you covered. The testing package includes mocks, fakers, and validators."

```typescript
const harness = createTestHarness({ seed: 12345 });
harness.client.mockResponse('getAccountBalance', '1000000000');

const balance = await harness.client.getAccountBalance('0x1');
harness.tracker.assertCalled('getAccountBalance');
```

> "Deterministic tests, no network calls, full control over responses. Your CI will thank you."

---

## PACKAGES OVERVIEW (4:15 - 4:30)

### Visual
- Four package cards with icons

### Script
> "To recap, MoveBridge gives you four packages:"

> "**Core** - The foundation with wallet management and transactions"
> "**React** - Hooks and components for React apps"  
> "**Codegen** - TypeScript generation from contracts"
> "**Testing** - Mocks, fakers, and validators"

---

## CLOSING (4:30 - 5:00)

### Visual
- GitHub link
- Installation command
- Demo link

### Script
> "MoveBridge is open source and ready to use today."

```bash
npm install @movebridge/core @movebridge/react
```

> "Check out the GitHub repo for full documentation, or try the interactive demo."

> "We built MoveBridge because we believe developer experience matters. Building on Movement should be fast, safe, and fun."

> "Thanks for watching. Now go build something amazing."

### End Card
- Logo
- GitHub URL
- "Built for Movement Network"

---

## B-ROLL SUGGESTIONS

1. **Code typing** - Fast typing of SDK code
2. **Wallet popup** - Petra/Pontem connection flow
3. **Transaction animation** - Block confirmation visual
4. **Test runner** - Green checkmarks appearing
5. **IDE autocomplete** - TypeScript suggestions dropdown

---

## RECORDING TIPS

1. **Resolution:** 1920x1080 minimum
2. **Font size:** 18px+ for code visibility
3. **Theme:** Dark theme for code, light for browser
4. **Pace:** Slightly slower than natural, can speed up in edit
5. **Mistakes:** Keep going, edit out later
6. **Audio:** Record in quiet room, use pop filter

---

## ALTERNATIVE: SHORT VERSION (1 minute)

For social media / quick pitch:

> "Building on Movement Network? MoveBridge SDK handles wallet connection, transactions, and contract calls in just a few lines of code."

[Show: Connect wallet in 3 lines]

> "Generate TypeScript types from your contracts."

[Show: Codegen command]

> "Test without hitting the network."

[Show: Test harness]

> "Four packages. 500+ tests. Ready for production."

[Show: npm install command]

> "MoveBridge - ethers.js for Movement."

---

## THUMBNAIL IDEAS

1. MoveBridge logo + "SDK" badge
2. Before/after code comparison
3. "3 lines to connect" text overlay
4. Movement Network + React logos combined
