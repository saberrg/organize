import { supabase } from './supabase'

// Define the Venue interface to match your database structure
interface Venue {
  name: string;
  address: string;
  description: string | null;
  capacity: number;
  rental_rate_per_hour: number;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_website?: string | null;
  amenities?: string[];
}

// Parse FormData into a Venue object
export function parseFormDataToVenue(formData: FormData): Venue {
  return {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    description: formData.get('description') as string,
    capacity: parseInt(formData.get('capacity') as string),
    rental_rate_per_hour: parseFloat(formData.get('rental_rate_per_hour') as string) || 0,
    contact_phone: formData.get('contact_phone') as string,
    contact_email: formData.get('contact_email') as string,
    contact_website: formData.get('contact_website') as string,
    amenities: [], // You might want to handle this separately
  };
}

// Insert venue into Supabase
export async function insertVenueToSupabase(venue: Venue) {
  const { data, error } = await supabase
    .from('venues')
    .insert([venue])
    .select('*')

  if (error) throw new Error(`Failed to insert venue into database: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No data returned after venue insertion');

  return data;
}

// Upload media files to Supabase storage
async function uploadVenueMediaToSupabase(formData: FormData, venueName: string) {
  const mediaFiles = formData.getAll('media') as File[];
  console.log('Media files:', mediaFiles);

  const uploadedFiles = [];

  for (const file of mediaFiles) {
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`venues/${venueName}/${crypto.randomUUID()}`, file);

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
    const venue = parseFormDataToVenue(formData);
    const insertedVenue = await insertVenueToSupabase(venue);
    
    if (formData.getAll('media').length > 0) {
      await uploadVenueMediaToSupabase(formData, insertedVenue[0].name);
    }

    console.log('Venue inserted successfully:', insertedVenue);
    return insertedVenue[0]; // Return the full venue object
  } catch (error) {
    console.error('Error submitting venue:', error);
    throw error;
  }
} 