import VenueForm from './addVenueForm2'

export default async function AddVenuePage() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Add Venue</h1>
      <VenueForm />
    </div>
  )
}
