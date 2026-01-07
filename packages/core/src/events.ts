/**
 * @movebridge/core - Event Listener
 * Subscribes to and handles blockchain events via polling
 */

import type { Aptos } from '@aptos-labs/ts-sdk';
import type { ContractEvent } from './types';

/**
 * Event subscription configuration
 */
export interface EventSubscriptionConfig {
    /** Account address to watch for events */
    accountAddress: string;
    /** Event type (e.g., '0x1::coin::DepositEvent') */
    eventType: string;
    /** Callback function when events are received */
    callback: (event: ContractEvent) => void;
}

/**
 * Legacy event subscription (for backward compatibility)
 */
export interface LegacyEventSubscription {
    /** Event handle in format: 0xADDRESS::module::EventType */
    eventHandle: string;
    /** Callback function when events are received */
    callback: (event: ContractEvent) => void;
}

/**
 * Internal subscription data
 */
interface InternalSubscription {
    accountAddress: string;
    eventType: string;
    callback: (event: ContractEvent) => void;
    lastSequenceNumber: bigint;
    intervalId: ReturnType<typeof setInterval> | null;
}

/**
 * Event Listener
 * Manages event subscriptions and polling for blockchain events
 *
 * @example
 * ```typescript
 * // Subscribe to deposit events for an account
 * const subId = movement.events.subscribe({
 *   accountAddress: '0x123...',
 *   eventType: '0x1::coin::DepositEvent',
 *   callback: (event) => {
 *     console.log('Deposit received:', event.data);
 *   },
 * });
 *
 * // Unsubscribe when done
 * movement.events.unsubscribe(subId);
 * ```
 */
export class EventListener {
    private subscriptions: Map<string, InternalSubscription> = new Map();
    private subscriptionCounter = 0;
    private readonly pollIntervalMs: number;

    constructor(
        private readonly aptosClient: Aptos,
        options?: { pollIntervalMs?: number }
    ) {
        this.pollIntervalMs = options?.pollIntervalMs ?? 3000;
    }

    /**
     * Subscribes to blockchain events
     * Supports both new format (accountAddress + eventType) and legacy format (eventHandle)
     * 
     * @param subscription - Subscription configuration
     * @returns Subscription ID for unsubscribing
     * 
     * @example
     * ```typescript
     * // New format (recommended)
     * const subId = events.subscribe({
     *   accountAddress: '0x1',
     *   eventType: '0x1::coin::DepositEvent',
     *   callback: (event) => console.log(event),
     * });
     * 
     * // Legacy format (backward compatible)
     * const subId = events.subscribe({
     *   eventHandle: '0x1::coin::DepositEvent',
     *   callback: (event) => console.log(event),
     * });
     * ```
     */
    subscribe(subscription: EventSubscriptionConfig | LegacyEventSubscription): string {
        const subscriptionId = `sub_${++this.subscriptionCounter}`;

        // Handle both new and legacy subscription formats
        let accountAddress: string;
        let eventType: string;

        if ('accountAddress' in subscription) {
            accountAddress = subscription.accountAddress;
            eventType = subscription.eventType;
        } else {
            // Legacy format: parse eventHandle (0xADDRESS::module::EventType)
            const parts = subscription.eventHandle.split('::');
            if (parts.length >= 3 && parts[0]) {
                accountAddress = parts[0];
                eventType = subscription.eventHandle;
            } else {
                // Invalid format, use as-is
                accountAddress = subscription.eventHandle;
                eventType = subscription.eventHandle;
            }
        }

        const internalSub: InternalSubscription = {
            accountAddress,
            eventType,
            callback: subscription.callback,
            lastSequenceNumber: BigInt(-1), // Start at -1 to catch all events
            intervalId: null,
        };

        // Store subscription first
        this.subscriptions.set(subscriptionId, internalSub);

        // Start polling
        internalSub.intervalId = setInterval(() => {
            this.pollEvents(subscriptionId).catch(() => {
                // Silently handle polling errors - continue polling
            });
        }, this.pollIntervalMs);

        // Do initial poll
        this.pollEvents(subscriptionId).catch(() => {
            // Silently handle initial poll errors
        });

        return subscriptionId;
    }

    /**
     * Unsubscribes from events
     * @param subscriptionId - Subscription ID to remove
     */
    unsubscribe(subscriptionId: string): void {
        const subscription = this.subscriptions.get(subscriptionId);

        if (subscription) {
            if (subscription.intervalId) {
                clearInterval(subscription.intervalId);
                subscription.intervalId = null;
            }
            this.subscriptions.delete(subscriptionId);
        }
    }

    /**
     * Unsubscribes from all events
     */
    unsubscribeAll(): void {
        for (const [id] of this.subscriptions) {
            this.unsubscribe(id);
        }
    }

    /**
     * Gets active subscription count
     * @returns Number of active subscriptions
     */
    getSubscriptionCount(): number {
        return this.subscriptions.size;
    }

    /**
     * Checks if a subscription exists
     * @param subscriptionId - Subscription ID
     * @returns true if subscription exists
     */
    hasSubscription(subscriptionId: string): boolean {
        return this.subscriptions.has(subscriptionId);
    }

    /**
     * Polls for new events for a subscription
     * @internal
     */
    private async pollEvents(subscriptionId: string): Promise<void> {
        const subscription = this.subscriptions.get(subscriptionId);

        if (!subscription) {
            return;
        }

        try {
            // Use Aptos SDK to get events by type
            const events = await this.aptosClient.getAccountEventsByEventType({
                accountAddress: subscription.accountAddress,
                eventType: subscription.eventType as `${string}::${string}::${string}`,
                options: {
                    limit: 25,
                    orderBy: [{ sequence_number: 'desc' }],
                },
            });

            // Process events in reverse order (oldest first) to maintain sequence
            const sortedEvents = [...events].sort((a, b) => {
                const seqA = BigInt(a.sequence_number);
                const seqB = BigInt(b.sequence_number);
                return seqA < seqB ? -1 : seqA > seqB ? 1 : 0;
            });

            for (const event of sortedEvents) {
                const sequenceNumber = BigInt(event.sequence_number);

                // Only process events newer than last seen
                if (sequenceNumber > subscription.lastSequenceNumber) {
                    const contractEvent: ContractEvent = {
                        type: event.type,
                        sequenceNumber: String(event.sequence_number),
                        data: event.data as Record<string, unknown>,
                    };

                    // Invoke callback
                    try {
                        subscription.callback(contractEvent);
                    } catch {
                        // Don't let callback errors stop polling
                    }

                    // Update last seen sequence number
                    subscription.lastSequenceNumber = sequenceNumber;
                }
            }
        } catch {
            // Silently handle polling errors - continue polling
            // This ensures network hiccups don't break subscriptions
        }
    }
}
