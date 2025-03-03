import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star } from "lucide-react"

interface Business {
  id: string
  name: string
  description: string
  category: string
  location: string
  image: string
  rating: number
}

export default function BusinessGrid({ businesses }: { businesses: Business[] }) {
  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">No businesses found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {businesses.map((business) => (
        <Link key={business.id} href={`/businesses/${business.id}`}>
          <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 w-full">
              <Image src={business.image || "/placeholder.svg"} alt={business.name} fill className="object-cover" />
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
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span>{business.rating.toFixed(1)}</span>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}

