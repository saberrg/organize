import AddVenueForm from './addvenueform'

export default async function AddVenuePage() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Add Venue</h1>
      <AddVenueForm />
    </div>
  )
}
