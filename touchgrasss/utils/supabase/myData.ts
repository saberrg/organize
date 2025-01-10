import { createClient } from './client'
import { type EventFormValues } from '@/app/schemas/event-form-schema'

export async function createEvent(eventData: EventFormValues) {
  const supabase = createClient()
  
  try {
    // First, upload media files to storage
    const mediaUrls = await Promise.all(
      eventData.media.map(async (mediaFile) => {
        const fileName = `${Date.now()}-${mediaFile.file.name}`
        const { data, error } = await supabase.storage
          .from('event-media')
          .upload(fileName, mediaFile.file)
        
        if (error) throw error
        
        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('event-media')
          .getPublicUrl(fileName)
          
        return {
          url: publicUrl,
          type: mediaFile.type
        }
      })
    )

    // Then, insert event data into the database
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: eventData.eventName,
        venue: eventData.eventVenue,
        start_date_time: eventData.startDateTime,
        end_date_time: eventData.endDateTime,
        number_of_tickets: eventData.numberOfTickets,
        price_per_ticket: eventData.pricePerTicket,
        description: eventData.eventDescription,
        media_urls: mediaUrls
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }

  } catch (error) {
    console.error('Error creating event:', error)
    return { data: null, error }
  }
}
