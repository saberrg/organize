export interface Venue {
    id: string;  // UUID is stored as string in TypeScript
    name: string;
    address: string;
    description: string | null;
    zip_code: string;
    city: string;
    rental_rate_per_hour: number;
    is_active: boolean;
    email: string | null;
    phone: string | null;
    website: string | null;
    created_at: string;  // ISO date string
    images?: string[];
}