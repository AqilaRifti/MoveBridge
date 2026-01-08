'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useMovement } from '@movebridge/react'

interface EventLog {
    id: string
    type: string
    timestamp: Date
    data: Record<string, unknown>
    sequenceNumber: string
}

const EVENT_TYPES = [
    { value: '0x1::coin::DepositEvent', label: 'Deposit Events', desc: 'When tokens are deposited' },
    { value: '0x1::coin::WithdrawEvent', label: 'Withdraw Events', desc: 'When tokens are withdrawn' },
    { value: '0x1::account::KeyRotationEvent', label: 'Key Rotation', desc: 'When account keys change' },
]

export default function EventsPage() {
    const { movement, connected, address } = useMovement()
    const [events, setEvents] = useState<EventLog[]>([])
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [eventType, setEventType] = useState(EVENT_TYPES[0].value)
    const [filter, setFilter] = useState('')
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
    const [autoScroll, setAutoScroll] = useState(true)
    const eventLogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (autoScroll && eventLogRef.current && events.length > 0) {
            eventLogRef.current.scrollTop = 0
        }
    }, [events, autoScroll])

    const subscribe = useCallback(() => {
        if (!movement || !address) return
        try {
            const subId = movement.events.subscribe({
                accountAddress: address,
                eventType: eventType,
                callback: (event) => {
                    const newEvent: EventLog = {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        type: event.type,
                        timestamp: new Date(),
                        data: event.data,
                        sequenceNumber: event.sequenceNumber,
                    }
                    setEvents((prev) => [newEvent, ...prev].slice(0, 100))
                }
            })
            setSubscriptionId(subId)
            setIsSubscribed(true)
        } catch (err) {
            console.error('Failed to subscribe:', err)
        }
    }, [movement, address, eventType])

    const unsubscribe = useCallback(() => {
        if (!movement || !subscriptionId) return
        movement.events.unsubscribe(subscriptionId)
        setSubscriptionId(null)
        setIsSubscribed(false)
    }, [movement, subscriptionId])

    useEffect(() => {
        return () => {
            if (movement && subscriptionId) {
                movement.events.unsubscribe(subscriptionId)
            }
        }
    }, [movement, subscriptionId])

    const filteredEvents = events.filter((event) => {
        if (!filter) return true
        return JSON.stringify(event).toLowerCase().includes(filter.toLowerCase())
    })

    const selectedEventType = EVENT_TYPES.find(e => e.value === eventType)

    if (!connected) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <div className="text-5xl mb-4">📡</div>
                <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Connect your wallet to subscribe to blockchain events.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Event Subscriptions</h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Subscribe to real-time blockchain events for your account.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="card p-4">
                        <h2 className="font-medium mb-4">Subscribe to Events</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    Event Type
                                </label>
                                <div className="space-y-2">
                                    {EVENT_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => !isSubscribed && setEventType(type.value)}
                                            disabled={isSubscribed}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${eventType === type.value
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                } ${isSubscribed ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="font-medium text-sm">{type.label}</div>
                                            <div className="text-xs text-slate-500">{type.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    Watching Account
                                </label>
                                <code className="block text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded truncate">
                                    {address}
                                </code>
                            </div>

                            {!isSubscribed ? (
                                <button onClick={subscribe} className="btn btn-primary w-full">
                                    ▶ Start Listening
                                </button>
                            ) : (
                                <button onClick={unsubscribe} className="btn btn-secondary w-full">
                                    ⏹ Stop Listening
                                </button>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                                    }`} />
                                <span className="text-sm">
                                    {isSubscribed ? (
                                        <span className="text-green-600 dark:text-green-400">
                                            Listening for {selectedEventType?.label}
                                        </span>
                                    ) : (
                                        <span className="text-slate-500">Not subscribed</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <h2 className="font-medium mb-3">Statistics</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Total Events</span>
                                <span className="font-mono font-medium">{events.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Filtered</span>
                                <span className="font-mono font-medium">{filteredEvents.length}</span>
                            </div>
                        </div>
                        {events.length > 0 && (
                            <button
                                onClick={() => setEvents([])}
                                className="btn btn-secondary w-full mt-4 text-sm"
                            >
                                Clear Events
                            </button>
                        )}
                    </div>

                    <div className="card p-4">
                        <h2 className="font-medium mb-3">Code Example</h2>
                        <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                            {`const subId = movement.events.subscribe({
  accountAddress: '${address?.slice(0, 8)}...',
  eventType: '${eventType}',
  callback: (event) => {
    console.log(event.data)
  }
})

// Cleanup
movement.events.unsubscribe(subId)`}
                        </pre>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="card p-4 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-medium">Event Log</h2>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={autoScroll}
                                        onChange={(e) => setAutoScroll(e.target.checked)}
                                        className="rounded"
                                    />
                                    Auto-scroll
                                </label>
                                <input
                                    type="text"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    placeholder="Filter..."
                                    className="input w-32 text-sm py-1.5"
                                />
                            </div>
                        </div>

                        <div ref={eventLogRef} className="flex-1 overflow-y-auto min-h-[500px] max-h-[600px]">
                            {filteredEvents.length === 0 ? (
                                <div className="text-center py-16 text-slate-500">
                                    {isSubscribed ? (
                                        <>
                                            <div className="text-5xl mb-4">📡</div>
                                            <p className="font-medium">Waiting for events...</p>
                                            <p className="text-sm mt-2">Make a transaction to see events.</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-5xl mb-4">🔇</div>
                                            <p className="font-medium">No events yet</p>
                                            <p className="text-sm mt-2">Start listening to see events.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredEvents.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function EventCard({ event }: { event: EventLog }) {
    const [expanded, setExpanded] = useState(false)
    const eventName = event.type.split('::').pop() || event.type

    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-fade-in">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-3">
                    <span className="badge badge-info text-xs">{eventName}</span>
                    <span className="text-xs text-slate-400">#{event.sequenceNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400">{expanded ? '▼' : '▶'}</span>
                </div>
            </div>
            {expanded && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}
