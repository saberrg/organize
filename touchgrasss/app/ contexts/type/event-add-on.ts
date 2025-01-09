export interface EventAddOn {
    id: string;
    event_id: string;
    add_on_id: string;
    price: number | null;  // Optional override price
    created_at: string;
}