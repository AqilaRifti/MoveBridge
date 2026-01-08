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
            const parsed = this.parseEventHandle(subscription.eventHandle);
            accountAddress = parsed.accountAddress;
            eventType = parsed.eventType;
        }

        // Validate event type format (warn but don't throw)
        if (!this.isValidEventType(eventType)) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(
                    `[EventListener] Event type "${eventType}" may not be in the expected format (address::module::EventType). ` +
                    'Subscription will proceed but may not receive events.'
                );
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
     * Parses a legacy event handle into account address and event type
     * @internal
     */
    private parseEventHandle(eventHandle: string): { accountAddress: string; eventType: string } {
        const parts = eventHandle.split('::');

        if (parts.length >= 3 && parts[0]) {
            // Valid format: 0xADDRESS::module::EventType
            return {
                accountAddress: parts[0],
                eventType: eventHandle,
            };
        }

        // Invalid format - use as-is and let the API handle it
        // This provides backward compatibility
        return {
            accountAddress: eventHandle,
            eventType: eventHandle,
        };
    }

    /**
     * Validates event type format
     * Expected format: address::module::EventType
     * @internal
     */
    private isValidEventType(eventType: string): boolean {
        // Check for the expected format: address::module::EventType
        const parts = eventType.split('::');
        if (parts.length < 3) {
            return false;
        }

        // First part should be an address (starts with 0x)
        const address = parts[0];
        if (!address || !address.startsWith('0x')) {
            return false;
        }

        // Module and event type should be non-empty
        const module = parts[1];
        const eventName = parts.slice(2).join('::'); // Handle nested types

        return Boolean(module && eventName);
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
            // Fetch events using the appropriate method
            const events = await this.fetchEvents(
                subscription.accountAddress,
                subscription.eventType
            );

            // Process events in ascending sequence order (oldest first)
            const sortedEvents = this.sortEventsBySequence(events);

            for (const event of sortedEvents) {
                const sequenceNumber = this.parseSequenceNumber(event.sequence_number);

                // Only process events newer than last seen
                if (sequenceNumber > subscription.lastSequenceNumber) {
                    const contractEvent: ContractEvent = {
                        type: event.type || subscription.eventType,
                        sequenceNumber: String(event.sequence_number),
                        data: this.normalizeEventData(event.data),
                    };

                    // Invoke callback safely
                    this.safeInvokeCallback(subscription.callback, contractEvent);

                    // Update last seen sequence number
                    subscription.lastSequenceNumber = sequenceNumber;
                }
            }
        } catch (error) {
            // Log error for debugging but continue polling
            // This ensures network hiccups don't break subscriptions
            if (process.env.NODE_ENV === 'development') {
                console.warn(`[EventListener] Polling error for ${subscriptionId}:`, error);
            }
        }
    }

    /**
     * Fetches events from the blockchain
     * Handles different API response formats and fallback methods
     * @internal
     */
    private async fetchEvents(
        accountAddress: string,
        eventType: string
    ): Promise<Array<{ type?: string; sequence_number: string | number; data: unknown }>> {
        // Try multiple methods to fetch events
        // Method 1: Standard getAccountEventsByEventType (requires indexer)
        try {
            const events = await this.aptosClient.getAccountEventsByEventType({
                accountAddress,
                eventType: eventType as `${string}::${string}::${string}`,
                options: {
                    limit: 25,
                    orderBy: [{ sequence_number: 'desc' }],
                },
            });

            return events.map(e => ({
                type: e.type,
                sequence_number: e.sequence_number,
                data: e.data,
            }));
        } catch (indexerError) {
            // Method 2: Try using getEventsByEventHandle (older API)
            try {
                // Parse event type to get the event handle structure
                // Format: 0x1::coin::DepositEvent -> need to find the event handle in account resources
                const events = await this.fetchEventsViaEventHandle(accountAddress, eventType);
                return events;
            } catch (handleError) {
                // Method 3: Try fetching from account resources directly
                try {
                    const events = await this.fetchEventsViaResources(accountAddress, eventType);
                    return events;
                } catch (resourceError) {
                    // All methods failed - log and return empty
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(
                            `[EventListener] Failed to fetch events for ${eventType}:`,
                            { indexerError, handleError, resourceError }
                        );
                    }
                    return [];
                }
            }
        }
    }

    /**
     * Fetches events using the event handle API
     * @internal
     */
    private async fetchEventsViaEventHandle(
        accountAddress: string,
        eventType: string
    ): Promise<Array<{ type?: string; sequence_number: string | number; data: unknown }>> {
        // Parse event type: 0x1::coin::DepositEvent
        const parts = eventType.split('::');
        if (parts.length < 3) {
            throw new Error('Invalid event type format');
        }

        // Extract struct name (last part after module)
        const structName = parts.slice(2).join('::');

        // Common event handle patterns for coin events
        const eventHandleMappings: Record<string, { resource: string; field: string }> = {
            'DepositEvent': { resource: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>', field: 'deposit_events' },
            'WithdrawEvent': { resource: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>', field: 'withdraw_events' },
        };

        const mapping = eventHandleMappings[structName];
        if (!mapping) {
            throw new Error(`Unknown event type: ${structName}`);
        }

        // Use the Aptos SDK's getEventsByEventHandle method
        const events = await (this.aptosClient as unknown as {
            getEventsByEventHandle: (params: {
                accountAddress: string;
                eventHandleStruct: string;
                fieldName: string;
                options?: { limit?: number };
            }) => Promise<Array<{ type: string; sequence_number: string; data: unknown }>>;
        }).getEventsByEventHandle({
            accountAddress,
            eventHandleStruct: mapping.resource,
            fieldName: mapping.field,
            options: { limit: 25 },
        });

        return events.map(e => ({
            type: e.type || eventType,
            sequence_number: e.sequence_number,
            data: e.data,
        }));
    }

    /**
     * Fetches events by checking account resources
     * This is a fallback method when indexer is not available
     * @internal
     */
    private async fetchEventsViaResources(
        accountAddress: string,
        eventType: string
    ): Promise<Array<{ type?: string; sequence_number: string | number; data: unknown }>> {
        // Get account resources
        const resources = await this.aptosClient.getAccountResources({
            accountAddress,
        });

        // Look for CoinStore resource which contains event handles
        const coinStore = resources.find(
            r => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
        );

        if (!coinStore) {
            return [];
        }

        const data = coinStore.data as {
            deposit_events?: { counter: string; guid: { id: { addr: string; creation_num: string } } };
            withdraw_events?: { counter: string; guid: { id: { addr: string; creation_num: string } } };
        };

        // Determine which event handle to use based on event type
        const isDeposit = eventType.includes('Deposit');
        const eventHandle = isDeposit ? data.deposit_events : data.withdraw_events;

        if (!eventHandle) {
            return [];
        }

        // Try to fetch events using the event handle GUID
        try {
            const creationNum = eventHandle.guid.id.creation_num;
            const addr = eventHandle.guid.id.addr;

            // Use the REST API directly to fetch events
            const response = await fetch(
                `${this.getFullnodeUrl()}/accounts/${accountAddress}/events/${addr}/${creationNum}?limit=25`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const events = await response.json() as Array<{
                type: string;
                sequence_number: string;
                data: unknown;
            }>;

            return events.map(e => ({
                type: e.type || eventType,
                sequence_number: e.sequence_number,
                data: e.data,
            }));
        } catch {
            // REST API fallback failed
            return [];
        }
    }

    /**
     * Gets the fullnode URL from the Aptos client config
     * @internal
     */
    private getFullnodeUrl(): string {
        // Access the config from the Aptos client
        const config = (this.aptosClient as unknown as { config: { fullnode: string } }).config;
        return config?.fullnode || 'https://testnet.movementnetwork.xyz/v1';
    }

    /**
     * Sorts events by sequence number in ascending order
     * @internal
     */
    private sortEventsBySequence(
        events: Array<{ type?: string; sequence_number: string | number; data: unknown }>
    ): Array<{ type?: string; sequence_number: string | number; data: unknown }> {
        return [...events].sort((a, b) => {
            const seqA = this.parseSequenceNumber(a.sequence_number);
            const seqB = this.parseSequenceNumber(b.sequence_number);
            return seqA < seqB ? -1 : seqA > seqB ? 1 : 0;
        });
    }

    /**
     * Parses sequence number from various formats
     * @internal
     */
    private parseSequenceNumber(value: string | number | bigint): bigint {
        if (typeof value === 'bigint') {
            return value;
        }
        if (typeof value === 'number') {
            return BigInt(value);
        }
        // Handle string format
        try {
            return BigInt(value);
        } catch {
            return BigInt(0);
        }
    }

    /**
     * Normalizes event data to a consistent format
     * @internal
     */
    private normalizeEventData(data: unknown): Record<string, unknown> {
        if (data === null || data === undefined) {
            return {};
        }
        if (typeof data === 'object') {
            return data as Record<string, unknown>;
        }
        return { value: data };
    }

    /**
     * Safely invokes a callback without letting errors propagate
     * @internal
     */
    private safeInvokeCallback(
        callback: (event: ContractEvent) => void,
        event: ContractEvent
    ): void {
        try {
            callback(event);
        } catch (error) {
            // Don't let callback errors stop polling
            if (process.env.NODE_ENV === 'development') {
                console.warn('[EventListener] Callback error:', error);
            }
        }
    }
}
