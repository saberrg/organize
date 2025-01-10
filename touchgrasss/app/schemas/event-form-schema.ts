import * as z from "zod"

const MAX_FILE_SIZE = 5000000 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"]

export const eventFormSchema = z.object({
  eventName: z.string().min(2, {
    message: "Event name must be at least 2 characters.",
  }),
  eventVenue: z.string().min(2, {
    message: "Event venue must be at least 2 characters.",
  }),
  startDateTime: z.date({
    required_error: "Start date and time is required.",
  }),
  endDateTime: z.date({
    required_error: "End date and time is required.",
  }),
  numberOfTickets: z.number().min(1, {
    message: "Number of tickets must be at least 1.",
  }),
  pricePerTicket: z.number().min(0, {
    message: "Price per ticket must be 0 or greater.",
  }),
  eventDescription: z.string().min(10, {
    message: "Event description must be at least 10 characters.",
  }),
  media: z
    .array(
      z.object({
        file: z.any(),
        url: z.string(),
        type: z.string(),
      })
    )
    .optional(),
})

export type EventFormValues = z.infer<typeof eventFormSchema>