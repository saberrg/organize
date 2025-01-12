'use client';

import { LoadScript, Autocomplete } from '@react-google-maps/api';
import { useState } from 'react';
import { CreateVenue, Venue } from '@/app/types/venue';
import { useVenues } from '@/app/contexts/venueContext';

const libraries = ['places'];

interface PlaceDetails {
  formatted_address: string;
  name: string;
  place_id: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  types: string[];
  photos?: Array<{
    getUrl: () => string;
    height: number;
    width: number;
    html_attributions: string[];
  }>;
}

const mapPlaceToVenue = async (place: any): Promise<CreateVenue> => {
  if (!place.name || !place.formattedAddress) {
    throw new Error('Missing required venue data');
  }

  const placeTypes = place.types || [];
  const description = placeTypes;
  console.log("THE DESCRIPTION", description);
  const imageUrls = place.photos
    ?.slice(0, 8)
    .map((photo: any) => {
      return `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    }) || [];

  // Create timestamp with UTC offset in minutes
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', { 
    timeZone: 'UTC',
    timeZoneName: 'short',
    hour12: false
  });

  return {
    name: place.displayName?.text || place.name,
    address: place.formattedAddress,
    rental_rate_per_hour: 0,
    description: description,
    images: imageUrls,
    phone: place.formatted_phone_number || '',
    email: '',
    website: place.website || '',
    zip_code: place.address_components?.find((c: any) => c.types.includes('postal_code'))?.long_name || '',
    city: place.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || '',
    is_active: true,
    capacity: 0,
  };
};

interface PlaceSearchProps {
  onPlaceSelect?: (venueData: Partial<Venue>) => void;
  className?: string;
}

export default function PlaceSearch({ onPlaceSelect, className }: PlaceSearchProps) {
  const { insertVenue } = useVenues();
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [autocompleteInstance, setAutocompleteInstance] = useState<any>(null);

  const fetchPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location,photos,editorial_summary&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-FieldMask': '*'
          }
        }
      );
      const data = await response.json();
      console.log("Raw place details data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching place details:", error);
      throw error;
    }
  };

  const onPlaceChanged = async () => {
    if (autocompleteInstance) {
      const place = autocompleteInstance.getPlace();
      console.log("Initial place object:", place);
      
      // Get additional details including photos using Places API
      const placeDetails = await fetchPlaceDetails(place.place_id);

      console.log("THE PLACE DETAILS:", placeDetails);
      
      // Combine the original place data with the additional details
      const combinedPlaceData = {
        ...place,
        ...placeDetails,
        // Ensure we have the formatted address from either source
        formattedAddress: placeDetails.formattedAddress || place.formatted_address
      };
      
      console.log("THE COMBINED PLACE DATA", combinedPlaceData);

      // Map the place to venue format
      const venueData = await mapPlaceToVenue(combinedPlaceData);
      console.log("Mapped venue data:", venueData);
      
      // Call the onPlaceSelect callback
      if (onPlaceSelect) {
        onPlaceSelect(venueData);
      }
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={libraries as any}
    >
      <Autocomplete
        onLoad={setAutocompleteInstance}
        onPlaceChanged={onPlaceChanged}
      >
        <input
          type="text"
          placeholder="Search for a venue"
          className={className || "input w-full p-2 border rounded-md"}
        />
      </Autocomplete>
    </LoadScript>
  );
}