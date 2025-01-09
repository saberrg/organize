export interface Ticket {
    id: string;
    ticket_type_id: string;
    purchaser_id: string;
    purchase_date: string;  // ISO date string
    status: 'active' | 'used' | 'cancelled';  // Using union type for status
    created_at: string;
}