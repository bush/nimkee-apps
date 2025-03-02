import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategories, getBusinesses } from "@/lib/api"

export const metadata: Metadata = {
  title: "Made in Canada | Categories",
  description: "Browse Canadian businesses by category",
}

export default async function CategoriesPage() {
  const categories = await getCategories()
  const businesses = await getBusinesses()

  const categoriesWithCount = categories.map((category) => ({
    ...category,
    count: businesses.filter((business) => business.category === category.name).length,
  }))

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Business Categories</h1>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categoriesWithCount.map((category) => (
          <Link key={category.id} href={`/categories/${category.id}`}>
            <Card className="h-full transition-all hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Browse businesses in this category</p>
                <p className="text-sm font-medium mt-2">{category.count} businesses</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}

