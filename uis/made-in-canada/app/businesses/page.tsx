import type { Metadata } from "next"
import SearchBar from "@/components/businesses/search-bar"
import BusinessGrid from "@/components/businesses/business-grid"
import Pagination from "@/components/ui/pagination"
import { getBusinesses } from "@/lib/api"

export const metadata: Metadata = {
  title: "Made in Canada | Business Directory",
  description: "Browse Canadian businesses and products",
}

export default async function BusinessDirectory({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; category?: string; location?: string }
}) {
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const category = searchParams.category || ""
  const location = searchParams.location || ""

  const businesses = await getBusinesses()

  // Client-side filtering (ideally, this would be done on the server)
  let filteredBusinesses = businesses
  if (search) {
    filteredBusinesses = filteredBusinesses.filter(
      (business) =>
        business.name.toLowerCase().includes(search.toLowerCase()) ||
        business.description.toLowerCase().includes(search.toLowerCase()),
    )
  }
  if (category) {
    filteredBusinesses = filteredBusinesses.filter(
      (business) => business.category.toLowerCase() === category.toLowerCase(),
    )
  }
  if (location) {
    filteredBusinesses = filteredBusinesses.filter((business) =>
      business.location.toLowerCase().includes(location.toLowerCase()),
    )
  }

  // Pagination
  const itemsPerPage = 6
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const paginatedBusinesses = filteredBusinesses.slice(startIndex, startIndex + itemsPerPage)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Canadian Business Directory</h1>

      <SearchBar defaultSearch={search} defaultCategory={category} defaultLocation={location} />

      <BusinessGrid businesses={paginatedBusinesses} />

      <div className="mt-8">
        <Pagination currentPage={page} totalPages={totalPages} />
      </div>
    </main>
  )
}

