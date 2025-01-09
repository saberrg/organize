import { createClient } from "@/utils/supabase/server";
import { createContext, useContext, useEffect, useState } from "react";
import { EventWithRelations } from "./types/event-relations";

const EventContext = createContext<EventContextType | undefined>(undefined);

type CreateEvent = Omit<Event, 'id' | 'created_at'>;

interface EventContextType {
    events: EventWithRelations[];
    loading: boolean;
    error: Error | null;
    getEvents: () => Promise<void>;
    insertEvent: (eventData: CreateEvent) => Promise<Event | null>; 
    getEventImages: (eventId: string) => Promise<string[] | null>;
    uploadEventImage: (eventId: string, image: File) => Promise<string | null>;
}

export const EventProvider = async ({ children }: { children: React.ReactNode }) => {
    const [events, setEvents] = useState<EventWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const supabase = await createClient();

    const getEvents = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    venue:venues(*),
                    ticket_types(*),
                    event_add_ons(
                        *,
                        add_ons(*)
                    )
                `)
                .order('start_date', { ascending: true });

            if (error) throw error;

            // Fetch images for each event
            const eventsWithImages = await Promise.all(
                data.map(async (event) => {
                    const images = await getEventImages(event.id);
                    return { ...event, images } as EventWithRelations;
                })
            );

            setEvents(eventsWithImages);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }
    
    const insertEvent = async (eventData: CreateEvent): Promise<Event | null> => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('events')
                .insert(eventData)
                .select(`
                    *,
                    venue:venues(*),
                    ticket_types(*),
                    event_add_ons(
                        *,
                        add_ons(*)
                    )
                `)
                .single();

            if (error) throw error;

            // Update the events list with the new event
            setEvents(prevEvents => [...prevEvents, data as EventWithRelations]);

            return data;

        } catch (err) {
            setError(err as Error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getEventImages = async (eventId: string): Promise<string[]> => {
        try {
            const { data, error } = await supabase.storage
                .from('media')
                .list(`events/${eventId}`);

            if (error) throw error;

            // Convert to public URLs
            const imageUrls = data.map(file => {
                const { data: { publicUrl } } = supabase.storage
                    .from('media')
                    .getPublicUrl(`events/${eventId}/${file.name}`);
                return publicUrl;
            });

            return imageUrls;
        } catch (err) {
            setError(err as Error);
            return [];
        }
    };

    const uploadEventImage = async (eventId: string, file: File): Promise<string | null> => {
        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `events/${eventId}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('media')
                .upload(filePath, file);

            if (error) throw error;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            setError(err as Error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getEvents();
    }, []);

    const value = {
        events,
        loading,
        error,
        getEvents,
        insertEvent,
        getEventImages,
        uploadEventImage
    };

    return (
        <EventContext.Provider value={value}>
            {children}
        </EventContext.Provider>
    );
};

export function useEvents() {
    const context = useContext(EventContext);
    if (context === undefined) {
        throw new Error('useEvents must be used within an EventProvider');
    }
    return context;
}