import { supabase } from './supabase'
import { Venue, CreateVenue } from '@/app/types/venue'

// Parse FormData into a CreateVenue object (omits id and created_at as per the type)
export function parseFormDataToVenue(formData: FormData): CreateVenue {
  // Get description array and convert to comma-separated string
  const description = formData.get('description');
  const descriptionString = Array.isArray(JSON.parse(description as string))
    ? JSON.parse(description as string).join(',')
    : description;

  return {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    description: descriptionString,
    zip_code: '', // You might want to add this to your form
    city: '', // You might want to add this to your form
    capacity: parseInt(formData.get('capacity') as string),
    rental_rate_per_hour: 0, // You might want to add this to your form
    is_active: true,
    email: formData.get('contact_email') as string,
    phone: formData.get('contact_phone') as string,
    website: formData.get('contact_website') as string,
    images: [], // This will be handled by the media upload
  };
}

// Insert venue into Supabase
export async function insertVenueToSupabase(venue: CreateVenue): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .insert([venue])
    .select('*')

  if (error) throw new Error(`Failed to insert venue into database: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No data returned after venue insertion');

  return data;
}

// Upload media files to Supabase storage
async function uploadVenueMediaToSupabase(formData: FormData) {
  const mediaFiles = formData.getAll('media') as File[];
  console.log('Media files:', mediaFiles);

  const uploadedFiles = [];

  for (const file of mediaFiles) {
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`venues/${formData.get('name')}/${crypto.randomUUID()}`, file);

    if (error) {
      throw new Error(`Failed to upload media: ${error.message}`);
    }

    uploadedFiles.push(data);
    console.log('Media uploaded successfully:', data);
  }

  return uploadedFiles;
}

// Handle form submission
export async function handleVenueSubmission(formData: FormData) {
  try {

    const { data, error } = await supabase
      .from('venues')
      .insert({
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        description: formData.get('description') as string,
        zip_code: formData.get('zip_code') as string,
        city: formData.get('city') as string,
        rental_rate_per_hour: 0.00,
        email: formData.get('contact_email') as string,
        phone: formData.get('contact_phone') as string,
        website: formData.get('contact_website') as string,
        capacity: parseInt(formData.get('capacity') as string)
      })
      .select()

    console.log("THE FORM DATA", formData)
    
    if (formData.getAll('media').length > 0) {
      await uploadVenueMediaToSupabase(formData);
    }

    console.log('Venue inserted successfully:', data);
    return data; // Return the full venue object
  } catch (error) {
    console.error('Error submitting venue:', error);
    throw error;
  }
} 