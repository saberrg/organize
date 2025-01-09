import { Event } from "../contexts/types/event"
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import Image from "next/image"
import { EventWithRelations } from "../contexts/types/event-relations";

interface EventCardProps {
  event: EventWithRelations;
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {

  return (
    <div 
      className={`relative group overflow-hidden rounded-lg ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      <div className="relative aspect-[3/4] md:aspect-auto md:h-full">
        <Image
          src={event.images?.[0] ?? ''}
          alt={event.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 w-full p-6 text-white">
          <h3 className={`font-serif ${featured ? 'text-3xl' : 'text-xl'} mb-2`}>
            {event.name}
          </h3>
          <p className="text-[#f6e47c] mb-1">{event.venue.name}</p>
          <p className="mb-4 text-sm opacity-90">
            {event.start_date}
          </p>
          <Button 
            variant="outline" 
            className="bg-[#1e1e2e] text-white border-white hover:bg-white hover:text-[#1e1e2e] transition-colors"
          >
            View Event
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}