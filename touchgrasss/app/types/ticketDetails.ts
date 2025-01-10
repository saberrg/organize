import { Ticket } from "./ticket";
import { TicketType } from "./ticket-type";
import { EventWithRelations } from "./event-relations";
import { TicketAddOn } from "./ticket-add-on";
import { EventAddOn } from "./event-add-on";
import { AddOn } from "./addon";

export interface TicketWithDetails extends Ticket {
    ticket_type: TicketType & {
        event: EventWithRelations;
    };
    ticket_add_ons: (TicketAddOn & {
        event_add_on: EventAddOn & {
            add_on: AddOn;
        };
    })[];
}