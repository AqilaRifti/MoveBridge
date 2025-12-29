'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMovement } from '@movebridge/react'

interface EventLog {
    id: string
    type: string
    timestamp: Date
    data: Record<string, unknown>
}

export default function EventsPage() {
    const { movement, connected, address } = useMovement()
    const [events, setEvents] = useState<EventLog[]>([])
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [eventType, setEventType] = useState('0x1::coin::DepositEvent')
    const [filter, setFilter] = useState('')

    // Subscribe to events
    const subscribe = useCallback(() => {
        if (!movement || !address) return

        try {
            movement.events.subscribe({
                eventHandle: eventType,
                callback: (event) => {
                    const newEvent: EventLog = {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        type: eventType,
                        timestamp: new Date(),
                        data: event.data,
                    }
                    setEvents((prev) => [newEvent, ...prev].slice(0, 50))
                }
            })
            setIsSubscribed(true)
        } catch (err) {
            console.error('Failed to subscribe:', err)
        }
    }, [movement, address, eventType])

    // Unsubscribe from events
    const unsubscribe = useCallback(() => {
        if (!movement) return
        movement.events.unsubscribeAll()
        setIsSubscribed(false)
    }, [movement])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (movement) {
                movement.events.unsubscribeAll()
            }
        }
    }, [movement])

    // Filter events
    const filteredEvents = events.filter((event) => {
        if (!filter) return true
        const searchStr = JSON.stringify(event).toLowerCase()
        return searchStr.includes(filter.toLowerCase())
    })

    if (!connected) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Please connect your wallet to subscribe to events.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-2">Event Subscriptions</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
                Subscribe to real-time blockchain events for your account.
            </p>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Subscription Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-6">
                        <h2 className="font-medium mb-4">Subscribe</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    Event Type
                                </label>
                                <select
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                    className="input"
                                    disabled={isSubscribed}
                                >
                                    <option value="0x1::coin::DepositEvent">Deposit Events</option>
                                    <option value="0x1::coin::WithdrawEvent">Withdraw Events</option>
                                    <option value="0x1::account::KeyRotationEvent">Key Rotation Events</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    Account
                                </label>
                                <code className="block text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded truncate">
                                    {address}
                                </code>
                            </div>

                            {!isSubscribed ? (
                                <button
                                    onClick={subscribe}
                                    className="btn btn-primary w-full"
                                >
                                    Start Listening
                                </button>
                            ) : (
                                <button
                                    onClick={unsubscribe}
                                    className="btn btn-secondary w-full"
                                >
                                    Stop Listening
                                </button>
                            )}
                        </div>

                        {/* Status */}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {isSubscribed ? 'Listening for events...' : 'Not subscribed'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="card p-6">
                        <h2 className="font-medium mb-4">Statistics</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Total Events</span>
                                <span className="font-mono">{events.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Filtered</span>
                                <span className="font-mono">{filteredEvents.length}</span>
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

                    {/* Code Example */}
                    <div className="card p-6">
                        <h2 className="font-medium mb-4">Code Example</h2>
                        <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                            {`// Subscribe to events
movement.events.subscribe(
  '${eventType}',
  '${address?.slice(0, 10)}...',
  (event) => {
    console.log('Event:', event)
  }
)

// Unsubscribe
movement.events.unsubscribeAll()`}
                        </pre>
                    </div>
                </div>

                {/* Event Log */}
                <div className="lg:col-span-2">
                    <div className="card p-6 h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-medium">Event Log</h2>
                            <input
                                type="text"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Filter events..."
                                className="input w-48 text-sm"
                            />
                        </div>

                        {filteredEvents.length === 0 ? (
                            <div className="text-center py-16 text-slate-500">
                                {isSubscribed ? (
                                    <>
                                        <div className="text-4xl mb-4">📡</div>
                                        <p>Waiting for events...</p>
                                        <p className="text-sm mt-2">
                                            Try making a transaction to see events appear here.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-4xl mb-4">🔇</div>
                                        <p>No events yet</p>
                                        <p className="text-sm mt-2">
                                            Start listening to see events in real-time.
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {filteredEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-fade-in"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="badge badge-info text-xs">
                                                {event.type.split('::').pop()}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {event.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                                            {JSON.stringify(event.data, null, 2)}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
