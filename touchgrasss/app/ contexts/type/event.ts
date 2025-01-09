// Event type
export interface Event {
    id: string;
    name: string;
    description: string | null;
    start_date: string;  // ISO date string
    end_date: string;    // ISO date string
    venue_id: string;
    created_at: string;
}