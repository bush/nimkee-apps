import type { Metadata } from "next"
import { notFound } from "next/navigation"
import BusinessGrid from "@/components/businesses/business-grid"
import Pagination from "@/components/ui/pagination"
import { getCategories, getBusinesses } from "@/lib/api"

export async function generateMetadata({
  params,
}: {
  params: { category: string }
}): Promise<Metadata> {
  const categories = await getCategories()
  const category = categories.find((c) => c.id === params.category)

  if (!category) {
    return {
      title: "Category Not Found",
    }
  }

  return {
    title: `Made in Canada | ${category.name}`,
    description: `Browse businesses in the ${category.name} category`,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string }
  searchParams: { page?: string }
}) {
  const categories = await getCategories()
  const category = categories.find((c) => c.id === params.category)

  if (!category) {
    notFound()
  }

  const page = Number(searchParams.page) || 1

  const allBusinesses = await getBusinesses()
  const businessesInCategory = allBusinesses.filter((business) => business.category === category.name)

  // Pagination
  const itemsPerPage = 6
  const totalPages = Math.ceil(businessesInCategory.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const paginatedBusinesses = businessesInCategory.slice(startIndex, startIndex + itemsPerPage)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">{category.name}</h1>
      <p className="text-center text-muted-foreground mb-8">Browse businesses in this category</p>

      <BusinessGrid businesses={paginatedBusinesses} />

      <div className="mt-8">
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/categories/${params.category}`} />
      </div>
    </main>
  )
}

