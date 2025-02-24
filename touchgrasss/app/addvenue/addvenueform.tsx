'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { handleVenueSubmission } from '@/lib/venue-handler'
import PlaceSearch from './placeAPI'
import { Venue } from '@/app/types/venue'
import { User } from '@supabase/supabase-js'
import { venueFormSchema, VenueFormValues, defaultVenueFormValues } from '@/app/types/venue'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import TagInput from './tag-fields'

export default function AddVenueForm() {
  const [user, setUser] = React.useState<User | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [imageFiles, setImageFiles] = React.useState<File[]>([])
  const [videoFiles, setVideoFiles] = React.useState<File[]>([])

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: defaultVenueFormValues,
  })

  React.useEffect(() => {
    const supabase = createClient()
    
    // Check auth state
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    
    checkUser()
  }, [router])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach(file => {
      const isVideo = file.type.startsWith('video/')
      if (isVideo) {
        setVideoFiles(prev => [...prev, file])
      } else {
        setImageFiles(prev => [...prev, file])
      }
    })
  }

  const handleDeleteFile = (index: number, type: 'image' | 'video') => {
    if (type === 'image') {
      const newImageFiles = imageFiles.filter((_, i) => i !== index)
      setImageFiles(newImageFiles)
      form.setValue('images', newImageFiles)
    } else {
      const newVideoFiles = videoFiles.filter((_, i) => i !== index)
      setVideoFiles(newVideoFiles)
      form.setValue('videos', newVideoFiles)
    }
  }

  const handlePlaceSelect = async (venueData: Partial<Venue>) => {
    console.log("Incoming description:", venueData.description);
    
    // Ensure description is properly formatted as an array
    const descriptionArray = Array.isArray(venueData.description) 
      ? venueData.description 
      : typeof venueData.description === 'string'
        ? venueData.description.split(',')
        : [];
    
    console.log("Formatted description array:", descriptionArray);
    
    // Set form values
    form.setValue('name', venueData.name || '');
    form.setValue('address', venueData.address || '');
    form.setValue('description', descriptionArray, { shouldValidate: true });  // Add shouldValidate option
    form.setValue('contact_phone', venueData.phone || '');
    form.setValue('contact_email', venueData.email || '');
    form.setValue('contact_website', venueData.website || '');
    
    // Log form value after setting
    console.log("Form description value after setting:", form.getValues('description'));
    
    // Handle images from API
    if (venueData.images && venueData.images.length > 0) {
      try {
        const imageFiles = await Promise.all(
          venueData.images.map(async (imageUrl, index) => {
            const response = await fetch(imageUrl, {
              mode: 'cors',
              headers: {
                'Accept': 'image/*'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            return new File([blob], `venue-image-${index}.jpg`, { type: 'image/jpeg' });
          })
        );
        
        setImageFiles(imageFiles);
        form.setValue('images', imageFiles);
      } catch (error) {
        console.error('Error loading images:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load some venue images"
        });
      }
    }

    console.log("THE VENUE DATA", venueData)
  };

  const onSubmit = async (data: VenueFormValues) => {
    try {
      setIsSubmitting(true)
      const formData = new FormData()

      console.log("THE DATA", data)
      
      // Add regular form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && key !== 'videos') {
          formData.append(key, String(value))
        }
      })
      
      // Add media files
      imageFiles.forEach(file => {
        formData.append('media', file)
      })
      videoFiles.forEach(file => {
        formData.append('media', file)
      })

      const insertedVenue = await handleVenueSubmission(formData)
      
      toast({
        title: "Success",
        description: "Venue added successfully!"
      })

      console.log("THEE INSERTED VENUE", insertedVenue)
      
      // Redirect to the venue page using the venue name
      if (insertedVenue && insertedVenue[0].name) {
        router.push(`/venues/${encodeURIComponent(insertedVenue[0].name)}`)
      }
      
      form.reset()
      setImageFiles([])
      setVideoFiles([])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error adding venue"
      })
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Only render the form if we have a user
  if (!user) return null
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="mb-6">
          <FormLabel>Search for a venue</FormLabel>
          <PlaceSearch 
            onPlaceSelect={handlePlaceSelect}
            className="input w-full p-2 border rounded-md"
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter venue name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter venue address" readOnly />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <TagInput 
                  value={field.value} 
                  onChange={(value) => field.onChange(Array.isArray(value) ? value : [value])} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter contact phone number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_email" 
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email" 
                  value={field.value || ''} 
                  placeholder="Enter contact email" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter venue website" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  placeholder="Enter venue capacity" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media Files</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold hover:file:bg-violet-100 file:bg-violet-50 file:text-violet-700 border-0"
                  style={{ color: 'transparent' }}
                />
              </FormControl>
              <FormDescription>Upload images and videos for your venue</FormDescription>
              <FormMessage />
              {(imageFiles.length > 0 || videoFiles.length > 0) && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Media Preview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {imageFiles.map((file, index) => (
                      <div key={`image-${index}`} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index}`}
                          className="w-full h-40 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(index, 'image')}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {videoFiles.map((file, index) => (
                      <div key={`video-${index}`} className="relative">
                        <video
                          src={URL.createObjectURL(file)}
                          className="w-full h-40 object-cover rounded"
                          controls
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(index, 'video')}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Adding Venue...' : 'Add Venue'}
        </Button>
      </form>
    </Form>
  )
} 