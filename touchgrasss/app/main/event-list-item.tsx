import { ArrowRight } from 'lucide-react'
import { EventWithRelations } from "../contexts/types/event-relations"

interface EventListItemProps {
  event: EventWithRelations
}

export function EventListItem({ event }: EventListItemProps) {
  return (
    <div className="group bg-[#1e1e2e] text-white p-6 flex justify-between items-center hover:bg-[#1e1e2e]/90 transition-colors">
      <div className="flex-1">
        <h3 className="text-xl font-serif">
          {event.name} @ {event.venue.name}
        </h3>
        <p className="text-[#f6e47c]">{event.start_date}</p>
      </div>
      <button className="bg-[#f6e47c] p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-5 h-5 text-[#1e1e2e]" />
      </button>
    </div>
  )
}

