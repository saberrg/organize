'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building, Mail, Phone, Globe, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PlaceSearch from './placeAPI';
import { Venue } from '@/app/types/venue';
import TagInput from './tag-fields';
import { useState } from 'react';

const venueFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Please enter a valid address"),
  description: z.array(z.string()).default([]),
  zip_code: z.string().min(5, "Please enter a valid ZIP code"),
  city: z.string().min(2, "City must be at least 2 characters"),
  rental_rate_per_hour: z.number().min(0, "Rate must be a positive number"),
  capacity: z.number().min(1, "Capacity must be at least 1 person"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  images: z.array(z.any()).optional(),
  videos: z.array(z.any()).optional(),
});

type VenueFormValues = z.infer<typeof venueFormSchema>;

export default function VenueForm() {
  const { toast } = useToast();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      name: "",
      address: "",
      description: [],
      zip_code: "",
      city: "",
      rental_rate_per_hour: 0,
      capacity: 0,
      email: "",
      phone: "",
      website: "",
      images: [],
      videos: [],
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
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
    console.log("Selected venue data:", venueData);
    
    // Ensure description is properly formatted as an array
    const descriptionArray = Array.isArray(venueData.description) 
      ? venueData.description 
      : typeof venueData.description === 'string'
        ? venueData.description.split(',')
        : [];
    
    // Set form values from the selected place
    form.setValue('name', venueData.name || '');
    form.setValue('address', venueData.address || '');
    form.setValue('description', descriptionArray, { shouldValidate: true });
    form.setValue('phone', venueData.phone || '');
    form.setValue('email', venueData.email || '');
    form.setValue('website', venueData.website || '');
    form.setValue('zip_code', venueData.zip_code || '');
    form.setValue('city', venueData.city || '');

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
  };

  async function onSubmit(data: VenueFormValues) {
    try {
      setIsSubmitting(true);

      // Sanitize and prepare venue data
      const venueData = {
        name: data.name.trim(),
        address: data.address.trim(),
        description: data.description,
        zip_code: data.zip_code.trim(),
        city: data.city.trim(),
        rental_rate_per_hour: Number(data.rental_rate_per_hour) || 0,
        capacity: Number(data.capacity) || 0,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        website: data.website?.trim() || null,
        media_urls: [] as string[],
      };

      // First, create the venue record
      const { data: insertedVenue, error: insertError } = await supabase
        .from("venues")
        .insert([venueData])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting venue:', insertError);
        throw new Error(insertError.message);
      }

      if (!insertedVenue) {
        throw new Error('Failed to create venue record');
      }

      // Upload media files to Supabase storage
      const mediaUrls: string[] = [];

      // Function to handle file upload
      const uploadFile = async (file: File, type: 'image' | 'video') => {
        const sanitizedVenueName = venueData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const timestamp = Date.now();
        const fileName = `${type}-${timestamp}-${file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-')}`;
        const filePath = `venue/${sanitizedVenueName}/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error(`Error uploading ${type}:`, uploadError);
          return null;
        }

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        return urlData?.publicUrl || null;
      };

      // Upload images
      for (const file of imageFiles) {
        const url = await uploadFile(file, 'image');
        if (url) mediaUrls.push(url);
      }

      // Upload videos
      for (const file of videoFiles) {
        const url = await uploadFile(file, 'video');
        if (url) mediaUrls.push(url);
      }

      // Update venue with media URLs if any were uploaded
      if (mediaUrls.length > 0) {
        const { error: updateError } = await supabase
          .from("venues")
          .update({ media_urls: mediaUrls })
          .eq('id', insertedVenue.id);

        if (updateError) {
          console.error('Error updating venue with media URLs:', updateError);
          throw new Error('Failed to update venue with media URLs');
        }
      }

      toast({
        title: "Success!",
        description: "Venue has been successfully created.",
      });

      // Reset form and state
      form.reset();
      setImageFiles([]);
      setVideoFiles([]);

    } catch (error) {
      console.error("Error creating venue:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create venue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Venue</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input className="pl-10" placeholder="Enter venue name" {...field} />
                  </div>
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
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input className="pl-10" placeholder="Enter street address" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter city" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zip_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ZIP code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rental_rate_per_hour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter hourly rate"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
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
                      placeholder="Enter venue capacity"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input 
                      className="pl-10" 
                      placeholder="Enter contact email" 
                      {...field} 
                      value={field.value ?? ''} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input 
                      className="pl-10" 
                      placeholder="Enter contact phone" 
                      {...field} 
                      value={field.value ?? ''} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input 
                      className="pl-10" 
                      placeholder="Enter website URL" 
                      {...field} 
                      value={field.value ?? ''} 
                    />
                  </div>
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
    </div>
  );
}