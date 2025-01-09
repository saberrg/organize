import { createClient } from "@/utils/supabase/server";
import { createContext, useContext, useEffect, useState } from "react";
import { Venue } from "./types/venue";

interface VenueContextType {
    venues: Venue[];
    loading: boolean;
    error: Error | null;
    getVenues: () => Promise<void>;
    insertVenue: (venueData: CreateVenue) => Promise<Venue | null>;
    getVenueImages: (venueId: string) => Promise<string[]>;
    uploadVenueImage: (venueId: string, image: File) => Promise<string | null>;
}

type CreateVenue = Omit<Venue, 'id' | 'created_at'>;

const VenueContext = createContext<VenueContextType | undefined>(undefined);

export const VenueProvider = async ({ children }: { children: React.ReactNode }) => {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const supabase = await createClient();

    useEffect(() => {
        getVenues();
    }, []);

    const getVenues = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('venues')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            const venuesWithImages = await Promise.all(
                data.map(async (venue) => {
                    const images = await getVenueImages(venue.id);
                    return { ...venue, images } as Venue;
                })
            );
            
            setVenues(venuesWithImages);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    const insertVenue = async (venueData: CreateVenue): Promise<Venue | null> => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('venues')
                .insert(venueData)
                .select('*')
                .single();

            if (error) throw error;

            // Update the venues list with the new venue
            setVenues(prevVenues => [...prevVenues, data as Venue]);

            return data;
        } catch (err) {
            setError(err as Error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getVenueImages = async (venueId: string): Promise<string[]> => {
        try {
            const { data, error } = await supabase.storage
                .from('media')
                .list(`venues/${venueId}`);

            if (error) throw error;

            // Convert to public URLs
            const imageUrls = data.map(file => {
                const { data: { publicUrl } } = supabase.storage
                    .from('media')
                    .getPublicUrl(`venues/${venueId}/${file.name}`);
                return publicUrl;
            });

            return imageUrls;
        } catch (err) {
            setError(err as Error);
            return [];
        }
    };

    const uploadVenueImage = async (venueId: string, file: File): Promise<string | null> => {
        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `venues/${venueId}/${fileName}`;

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

    const value = {
        venues,
        loading,
        error,
        getVenues,
        insertVenue,
        getVenueImages,
        uploadVenueImage
    };

    return (
        <VenueContext.Provider value={value}>
            {children}
        </VenueContext.Provider>
    );
};

export function useVenues() {
    const context = useContext(VenueContext);
    if (context === undefined) {
        throw new Error('useVenues must be used within a VenueProvider');
    }
    return context;
}