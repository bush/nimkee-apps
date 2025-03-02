import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star } from "lucide-react"
import type { Business } from "@/lib/api" // Make sure to import the Business type

export default function FeaturedBusinesses({ businesses }: { businesses: Business[] }) {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Featured Canadian Businesses</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover these outstanding Canadian businesses that exemplify quality, innovation, and the Canadian spirit
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {businesses.map((business) => (
          <Link key={business.id} href={`/businesses/${business.id}`}>
            <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full">
                <Image src={"/placeholder.svg"} alt={business.name} fill className="object-cover" />
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{business.name}</h3>
                  <Badge variant="outline" className="bg-red-50">
                    {business.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 line-clamp-2">{business.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{business.location}</span>
                </div>
                {business.rating !== undefined && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{business.rating.toFixed(1)}</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          href="/businesses"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2"
        >
          View All Businesses
        </Link>
      </div>
    </section>
  )
}

