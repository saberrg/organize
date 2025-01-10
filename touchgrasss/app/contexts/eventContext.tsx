'use client'
import { createClient } from "@/utils/supabase/server";
import { createContext, useContext, useEffect, useState } from "react";
import { EventWithRelations } from "../types/event-relations";

const EventContext = createContext<EventContextType | undefined>(undefined);

type CreateEvent = Omit<Event, 'id' | 'created_at'>;

interface EventContextType {
    events: EventWithRelations[];
    loading: boolean;
    error: Error | null;
    getEvents: () => Promise<void>;
    insertEvent: (eventData: CreateEvent) => Promise<Event | null>; 
    getEventFiles: (eventId: string) => Promise<string[] | null>;
    uploadEventFiles: (eventId: string, files: { file: File; type: string; }[]) => Promise<{ path: string; type: string; }[]>;
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
            const eventsWithFiles = await Promise.all(
                data.map(async (event) => {
                    const files = await getEventFiles(event.id);
                    return { ...event, files } as EventWithRelations;
                })
            );

            setEvents(eventsWithFiles);
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

    const getEventFiles = async (eventId: string): Promise<string[]> => {
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

    const uploadEventFiles = async (eventId: string, files: {file: File, type: string}[]) => {
        const uploads = await Promise.all(
            files.map(async ({ file, type }) => {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}.${fileExt}`
                const filePath = `events/${eventId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('media')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                return {
                    path: filePath,
                    type
                }
            })
        )
        return uploads
    }

    useEffect(() => {
        getEvents();
    }, []);

    const value = {
        events,
        loading,
        error,
        getEvents,
        insertEvent,
        getEventFiles,
        uploadEventFiles
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