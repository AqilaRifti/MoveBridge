---
sidebar_position: 4
---

# Event Subscriptions

Learn how to subscribe to and handle contract events with MoveBridge.

## Overview

The `EventListener` allows you to subscribe to contract events and receive real-time updates when events are emitted.

## Subscribing to Events

```typescript
import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });

// Subscribe to events
const subscriptionId = movement.events.subscribe({
  eventHandle: '0x123::counter::CounterChanged',
  callback: (event) => {
    console.log('Event type:', event.type);
    console.log('Sequence:', event.sequenceNumber);
    console.log('Data:', event.data);
  },
});

console.log('Subscription ID:', subscriptionId);
```

## Event Handle Format

Event handles follow the format: `address::module::EventType`

```typescript
// Examples of valid event handles
'0x1::coin::DepositEvent'
'0x1::coin::WithdrawEvent'
'0x123::counter::CounterChanged'
'0x456::nft::MintEvent'
```

## Unsubscribing

```typescript
// Unsubscribe from a specific subscription
movement.events.unsubscribe(subscriptionId);

// Unsubscribe from all events
movement.events.unsubscribeAll();
```

## Checking Subscriptions

```typescript
// Check if a subscription exists
const exists = movement.events.hasSubscription(subscriptionId);

// Get the number of active subscriptions
const count = movement.events.getSubscriptionCount();
```

## Event Data Structure

Events have the following structure:

```typescript
interface ContractEvent {
  type: string;                    // Event type (e.g., '0x1::coin::DepositEvent')
  sequenceNumber: string;          // Unique sequence number
  data: Record<string, unknown>;   // Event-specific data
}
```

## Example: Monitoring Transfers

```typescript
const movement = new Movement({ network: 'testnet' });

// Subscribe to deposit events
const depositSub = movement.events.subscribe({
  eventHandle: '0x1::coin::DepositEvent',
  callback: (event) => {
    console.log('Deposit received!');
    console.log('Amount:', event.data.amount);
  },
});

// Subscribe to withdraw events
const withdrawSub = movement.events.subscribe({
  eventHandle: '0x1::coin::WithdrawEvent',
  callback: (event) => {
    console.log('Withdrawal made!');
    console.log('Amount:', event.data.amount);
  },
});

// Later: cleanup
movement.events.unsubscribeAll();
```

## Polling Interval

Events are detected using polling. The default interval is 3 seconds:

```typescript
// The EventListener polls every 3 seconds by default
// This is configured internally and optimized for most use cases
```

## React Integration

Handle events in React components:

```tsx
import { useEffect, useState } from 'react';
import { useMovement } from '@movebridge/react';
import type { ContractEvent } from '@movebridge/core';

function EventMonitor() {
  const { movement } = useMovement();
  const [events, setEvents] = useState<ContractEvent[]>([]);

  useEffect(() => {
    if (!movement) return;

    const subscriptionId = movement.events.subscribe({
      eventHandle: '0x123::counter::CounterChanged',
      callback: (event) => {
        setEvents((prev) => [...prev, event]);
      },
    });

    // Cleanup on unmount
    return () => {
      movement.events.unsubscribe(subscriptionId);
    };
  }, [movement]);

  return (
    <div>
      <h3>Recent Events</h3>
      <ul>
        {events.map((event, i) => (
          <li key={i}>
            #{event.sequenceNumber}: {JSON.stringify(event.data)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Error Handling

Handle event subscription errors:

```typescript
import { isMovementError } from '@movebridge/core';

try {
  const subscriptionId = movement.events.subscribe({
    eventHandle: 'invalid-format',
    callback: (event) => console.log(event),
  });
} catch (error) {
  if (isMovementError(error)) {
    if (error.code === 'INVALID_EVENT_HANDLE') {
      console.log('Invalid event handle format');
      console.log('Expected:', error.details?.expectedFormat);
    }
  }
}
```

## Best Practices

1. **Always unsubscribe** - Clean up subscriptions when components unmount
2. **Use specific event handles** - Subscribe only to events you need
3. **Handle errors in callbacks** - Wrap callback logic in try-catch
4. **Consider rate limits** - Don't create too many subscriptions
5. **Store subscription IDs** - Keep track of IDs for cleanup

## Limitations

- Events are detected via polling (not WebSocket)
- Default poll interval is 3 seconds
- Historical events are not fetched on subscription
- Only events from the specified event handle are received

## Next Steps

- [Error Handling](/docs/guides/error-handling) - Handle errors properly
- [API Reference](/docs/api/core/event-listener) - Full EventListener API
- [Testing](/docs/packages/testing) - Mock events in tests
