import { Event } from "./event";
import { Venue } from "./venue";
import { TicketType } from "./ticket-type";
import { EventAddOn } from "./event-add-on";
import { AddOn } from "./addon";

export interface EventWithRelations extends Event {
    venue: Venue;                    // Adds the full venue object
    ticket_types: TicketType[];      // Adds array of ticket types
    event_add_ons: (EventAddOn & {   // Adds array of event add-ons with their add-on details
        add_ons: AddOn;
    })[];
}