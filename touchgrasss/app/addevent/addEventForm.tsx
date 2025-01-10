"use client"

import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2, Plus, X } from 'lucide-react'
import { format } from "date-fns"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { eventFormSchema, type EventFormValues } from "../schemas/event-form-schema"
import { useEvents } from "../contexts/eventContext"
import { Select, SelectValue, SelectTrigger, SelectItem, SelectContent } from "@/components/ui/select"
import { Venue } from "../types/venue"
import { useVenues } from "../contexts/venueContext"


export function AddEventForm() {
  const [files, setFiles] = useState<Array<{ file: File; url: string; type: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { insertEvent, uploadEventFiles } = useEvents()
  const { venues } = useVenues()

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventName: "",
      eventVenue: "",
      numberOfTickets: 1,
      pricePerTicket: 0,
      eventDescription: "",
      media: [],
    },
  })

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true)
    try {
      // 1. First create the event
      const eventData = {
        name: data.eventName,
        description: data.eventDescription,
        start_date: data.startDateTime,
        end_date: data.endDateTime,
        venue_id: data.eventVenue, // Assuming this is the venue ID
        total_tickets: data.numberOfTickets,
        price_per_ticket: data.pricePerTicket,
      }

      const newEvent = await insertEvent(eventData)
      
      if (!newEvent?.id) {
        throw new Error("Failed to create event")
      }

      // 2. Upload media files if any exist
      if (files.length > 0) {
        const fileUploads = files.map(({ file, type }) => ({
          file,
          type,
        }))

        await uploadEventFiles(newEvent.id, fileUploads)
      }

      // Optional: Redirect or show success message
      console.log("Event created successfully!")
      
    } catch (error) {
      console.error(error)
      // Handle error (show toast/alert to user)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return

    const newFiles = Array.from(fileList).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/") ? "image" : "video",
    }))

    setFiles((prev) => [...prev, ...newFiles])
    form.setValue("media", [...files, ...newFiles])
  }, [files, form])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].url)
      newFiles.splice(index, 1)
      form.setValue("media", newFiles)
      return newFiles
    })
  }, [form])

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="eventName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventVenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Venue</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {venues.map((venue: Venue) => (
                        <SelectItem key={venue.id} value={venue.id.toString()}>
                          <div className="flex flex-col">
                            <span>{venue.name}</span>
                            <span className="text-xs text-muted-foreground">{venue.address}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date & Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP HH:mm")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Input
                          type="time"
                          onChange={(e) => {
                            const date = field.value || new Date()
                            const [hours, minutes] = e.target.value.split(":")
                            date.setHours(parseInt(hours), parseInt(minutes))
                            field.onChange(date)
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDateTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date & Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP HH:mm")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Input
                          type="time"
                          onChange={(e) => {
                            const date = field.value || new Date()
                            const [hours, minutes] = e.target.value.split(":")
                            date.setHours(parseInt(hours), parseInt(minutes))
                            field.onChange(date)
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="numberOfTickets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Tickets</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Enter number of tickets"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerTicket"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Per Ticket</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Enter price per ticket"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="eventDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter event description"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="media"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Media</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {files.map((file, index) => (
                        <div key={index} className="relative aspect-square">
                          {file.type === "image" ? (
                            <Image
                              src={file.url}
                              alt="Preview"
                              className="rounded-lg object-cover"
                              fill
                            />
                          ) : (
                            <video
                              src={file.url}
                              className="rounded-lg w-full h-full object-cover"
                              controls
                            />
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <label className="relative aspect-square flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
                        <div className="flex flex-col items-center gap-2">
                          <Plus className="h-8 w-8" />
                          <span className="text-sm">Add Media</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    <FormDescription>
                      Upload images or videos for your event. Maximum file size: 5MB
                    </FormDescription>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </form>
      </Form>
    </div>
  )
}