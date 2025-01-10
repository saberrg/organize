import { Event } from "../types/event"
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import Image from "next/image"
import { EventWithRelations } from "../types/event-relations"

interface FeaturedEventProps {
  event: EventWithRelations
}

export function FeaturedEvent({ event }: FeaturedEventProps) {
  return (
    <div className="relative w-full h-[60vh] min-h-[500px]">
      <Image
        src={event.images?.[0] ?? ''}
        alt={event.name}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute bottom-0 w-full bg-[#f6e47c] p-6 flex justify-between items-center">
        <div>
          <h1 className="text-[#1e1e2e] text-3xl md:text-4xl font-serif mb-2">
            {event.name}
          </h1>
          <p className="text-[#1e1e2e] text-xl">
            {event.start_date}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="bg-[#1e1e2e] text-white border-none hover:bg-[#1e1e2e]/90 rounded-full p-6"
        >
          <ArrowRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}