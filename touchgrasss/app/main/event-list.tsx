'use client'

import { useEffect, useState } from "react"
import { Event } from "../contexts/types/event"
import { FeaturedEvent } from "./featured-event"
import { EventListItem } from "./event-list-item"
import { EventCard } from "./event-card"
import { useEvents } from "../contexts/eventContext"

interface EventListProps {
  events: Event[]
}

export function EventList() {
  const [isMobile, setIsMobile] = useState(false)
  const { events } = useEvents();
  const featuredEvent = events[0];
  const upcomingEvents = events.slice(1);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-4rem)] snap-y snap-mandatory overflow-y-auto">
        {events.map((event, index) => (
          <div key={event.id} className="h-full snap-start snap-always">
            <EventCard event={event} featured={index === 0} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <FeaturedEvent event={featuredEvent} />
      <div className="flex-1 bg-white">
        <div className="max-w-6xl mx-auto py-12">
          <h2 className="text-center text-4xl font-serif mb-8">Event List</h2>
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <EventListItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}