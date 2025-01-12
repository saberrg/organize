import { z } from "zod";

export interface Venue {
    id: string;  // UUID is stored as string in TypeScript
    name: string;
    address: string;
    description: string[] | string | null;
    zip_code: string;
    city: string;
    rental_rate_per_hour: number;
    is_active: boolean;
    email: string | null;
    phone: string | null;
    website: string | null;
    created_at: string;  // ISO date string
    images?: string[];
    capacity: number;
}

export type CreateVenue = Omit<Venue, 'id' | 'created_at'>;

export const venueFormSchema = z.object({
    name: z.string().min(2, { message: 'Venue name must be at least 2 characters' }),
    address: z.string().min(5, { message: 'Address must be at least 5 characters' }),
    description: z.array(z.string()).min(1, { message: 'Add at least one tag to describe the venue' }).optional(),
    capacity: z.number().min(1, { message: 'Capacity must be at least 1' }),
    contact_email: z.string().email({ message: 'Invalid email address' }).optional().nullable(),
    contact_phone: z.string().optional(),
    images: z.array(z.instanceof(File)).optional(),
    videos: z.array(z.instanceof(File)).optional(),
    contact_website: z.string().optional(),
})

export type VenueFormValues = z.infer<typeof venueFormSchema>

export const defaultVenueFormValues: VenueFormValues = {
  name: '',
  address: '',
  description: [],
  capacity: 0,
  contact_email: '',
  contact_phone: '',
  images: [],
  videos: [],
  contact_website: '',
}