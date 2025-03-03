import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Globe, Mail, Phone, Star } from "lucide-react"
import { notFound } from "next/navigation"
import ReviewList from "@/components/businesses/review-list"
import ReviewForm from "@/components/businesses/review-form"
import { getBusinessById, getReviews } from "@/lib/api"

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const business = await getBusinessById(params.id)

  if (!business) {
    return {
      title: "Business Not Found",
    }
  }

  return {
    title: `Made in Canada | ${business.name}`,
    description: business.description,
  }
}

export default async function BusinessDetail({
  params,
}: {
  params: { id: string }
}) {
  const business = await getBusinessById(params.id)

  if (!business) {
    notFound()
  }

  const allReviews = await getReviews()
  const reviews = allReviews.filter((review) => review.businessId === params.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-64 w-full">
              <Image src={"/placeholder.svg"} alt={business.name} fill className="object-cover" priority />
            </div>
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>

              <div className="flex items-center mb-4">
                <div className="flex items-center mr-4">
                  <Star className="h-5 w-5 text-yellow-500 mr-1" />
                  <span className="font-medium">
                    {(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span>{business.location}</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">About</h2>
                <p className="text-gray-700">{business.description}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-700">
                  <Globe className="h-5 w-5 mr-2 text-primary" />
                  <Link href={business.website} className="hover:underline text-primary">
                    Visit Website
                  </Link>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="h-5 w-5 mr-2 text-primary" />
                  <Link href={`mailto:${business.contactEmail}`} className="hover:underline text-primary">
                    {business.contactEmail}
                  </Link>
                </div>
                <div className="flex items-center text-gray-700">
                  <Phone className="h-5 w-5 mr-2 text-primary" />
                  <Link href={`tel:${business.contactPhone}`} className="hover:underline text-primary">
                    {business.contactPhone}
                  </Link>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="h-5 w-5 mr-2 flex items-center justify-center">
                    <span className="text-primary font-bold">C</span>
                  </div>
                  <span>{business.category}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            <ReviewList reviews={reviews} />
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Write a Review</h2>
            <ReviewForm businessId={params.id} />
          </div>
        </div>
      </div>
    </main>
  )
}

