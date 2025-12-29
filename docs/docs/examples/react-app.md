---
sidebar_position: 2
---

# React Application

A complete React application example using MoveBridge.

## Project Setup

```bash
# Create React app with Vite
npm create vite@latest my-movement-app -- --template react-ts
cd my-movement-app

# Install dependencies
npm install @movebridge/core @movebridge/react
```

## App Structure

```
src/
├── App.tsx
├── components/
│   ├── Header.tsx
│   ├── Dashboard.tsx
│   ├── TransferForm.tsx
│   └── EventLog.tsx
└── main.tsx
```

## Main Entry Point

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MovementProvider } from '@movebridge/react';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MovementProvider 
      network="testnet" 
      autoConnect
      onError={(error) => {
        console.error('MoveBridge error:', error.code, error.message);
      }}
    >
      <App />
    </MovementProvider>
  </React.StrictMode>
);
```

## App Component

```tsx
// src/App.tsx
import { useMovement } from '@movebridge/react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

function App() {
  const { connected } = useMovement();

  return (
    <div className="app">
      <Header />
      <main>
        {connected ? (
          <Dashboard />
        ) : (
          <div className="connect-prompt">
            <h2>Welcome to My Movement App</h2>
            <p>Connect your wallet to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
```

## Header Component

```tsx
// src/components/Header.tsx
import { useState } from 'react';
import { 
  useMovement, 
  WalletButton, 
  WalletModal, 
  AddressDisplay 
} from '@movebridge/react';

function Header() {
  const [modalOpen, setModalOpen] = useState(false);
  const { address, connected } = useMovement();

  return (
    <header className="header">
      <h1>My Movement App</h1>
      
      <div className="wallet-section">
        {connected && address && (
          <AddressDisplay address={address} truncate copyable />
        )}
        <WalletButton onClick={() => setModalOpen(true)} />
      </div>

      <WalletModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </header>
  );
}

export default Header;
```

## Dashboard Component

```tsx
// src/components/Dashboard.tsx
import { useMovement, useBalance } from '@movebridge/react';
import TransferForm from './TransferForm';
import EventLog from './EventLog';

function Dashboard() {
  const { address } = useMovement();
  const { balance, loading, refetch } = useBalance();

  // Format balance (octas to APT)
  const formatBalance = (octas: string | null) => {
    if (!octas) return '0';
    const apt = Number(octas) / 100_000_000;
    return apt.toFixed(4);
  };

  return (
    <div className="dashboard">
      <section className="balance-section">
        <h2>Account Balance</h2>
        <div className="balance">
          {loading ? (
            <span>Loading...</span>
          ) : (
            <>
              <span className="amount">{formatBalance(balance)}</span>
              <span className="unit">APT</span>
            </>
          )}
        </div>
        <button onClick={refetch} disabled={loading}>
          Refresh
        </button>
      </section>

      <section className="transfer-section">
        <h2>Transfer Tokens</h2>
        <TransferForm />
      </section>

      <section className="events-section">
        <h2>Recent Events</h2>
        <EventLog />
      </section>
    </div>
  );
}

export default Dashboard;
```

## Transfer Form Component

```tsx
// src/components/TransferForm.tsx
import { useState } from 'react';
import { useTransaction, useWaitForTransaction } from '@movebridge/react';

function TransferForm() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  
  const { send, data: hash, loading, error, reset } = useTransaction();
  const { data: result, loading: confirming } = useWaitForTransaction(hash);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert APT to octas
    const octas = String(Math.floor(Number(amount) * 100_000_000));
    
    try {
      await send({
        function: '0x1::coin::transfer',
        typeArguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: [recipient, octas],
      });
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  const handleReset = () => {
    setRecipient('');
    setAmount('');
    reset();
  };

  return (
    <form onSubmit={handleSubmit} className="transfer-form">
      <div className="form-group">
        <label htmlFor="recipient">Recipient Address</label>
        <input
          id="recipient"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount (APT)</label>
        <input
          id="amount"
          type="number"
          step="0.0001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading || confirming}>
          {loading ? 'Sending...' : confirming ? 'Confirming...' : 'Send'}
        </button>
        {(hash || error) && (
          <button type="button" onClick={handleReset}>
            Reset
          </button>
        )}
      </div>

      {hash && (
        <div className="status">
          <p>Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}</p>
          {result?.success && <p className="success">✅ Confirmed!</p>}
          {result && !result.success && (
            <p className="error">❌ Failed: {result.vmStatus}</p>
          )}
        </div>
      )}

      {error && (
        <div className="error">
          Error: {error.message}
        </div>
      )}
    </form>
  );
}

export default TransferForm;
```

## Event Log Component

```tsx
// src/components/EventLog.tsx
import { useEffect, useState } from 'react';
import { useMovement } from '@movebridge/react';
import type { ContractEvent } from '@movebridge/core';

function EventLog() {
  const { movement, address } = useMovement();
  const [events, setEvents] = useState<ContractEvent[]>([]);

  useEffect(() => {
    if (!movement || !address) return;

    // Subscribe to deposit events
    const subId = movement.events.subscribe({
      eventHandle: '0x1::coin::DepositEvent',
      callback: (event) => {
        setEvents((prev) => [event, ...prev].slice(0, 10)); // Keep last 10
      },
    });

    return () => {
      movement.events.unsubscribe(subId);
    };
  }, [movement, address]);

  if (events.length === 0) {
    return <p className="no-events">No events yet</p>;
  }

  return (
    <ul className="event-log">
      {events.map((event, index) => (
        <li key={`${event.sequenceNumber}-${index}`} className="event-item">
          <span className="event-type">{event.type.split('::').pop()}</span>
          <span className="event-seq">#{event.sequenceNumber}</span>
          <pre className="event-data">
            {JSON.stringify(event.data, null, 2)}
          </pre>
        </li>
      ))}
    </ul>
  );
}

export default EventLog;
```

## Styles

```css
/* src/index.css */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
  min-height: 100vh;
}

.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #333;
  margin-bottom: 40px;
}

.wallet-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.balance-section {
  text-align: center;
}

.balance {
  font-size: 48px;
  margin: 20px 0;
}

.balance .amount {
  font-weight: bold;
}

.balance .unit {
  font-size: 24px;
  color: #888;
  margin-left: 8px;
}

.transfer-form {
  max-width: 400px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #888;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #1a1a1a;
  color: #fff;
  font-size: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status {
  margin-top: 16px;
  padding: 12px;
  background: #1a1a1a;
  border-radius: 8px;
}

.success {
  color: #22c55e;
}

.error {
  color: #ef4444;
}

.event-log {
  list-style: none;
}

.event-item {
  padding: 12px;
  background: #1a1a1a;
  border-radius: 8px;
  margin-bottom: 8px;
}

.event-type {
  font-weight: bold;
  color: #3b82f6;
}

.event-seq {
  color: #888;
  margin-left: 8px;
}

.event-data {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
  overflow-x: auto;
}

.connect-prompt {
  text-align: center;
  padding: 60px 20px;
}

.connect-prompt h2 {
  margin-bottom: 16px;
}

.connect-prompt p {
  color: #888;
}

.no-events {
  color: #888;
  text-align: center;
  padding: 20px;
}
```

## Running the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.
