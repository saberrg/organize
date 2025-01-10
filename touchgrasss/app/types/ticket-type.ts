export interface TicketType {
    id: string;
    event_id: string;
    name: string;
    description: string | null;
    price: number;
    quantity_available: number | null;
    start_sales_date: string | null;  // ISO date string
    end_sales_date: string | null;    // ISO date string
    created_at: string;
}