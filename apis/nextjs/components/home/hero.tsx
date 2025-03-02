import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative bg-red-50">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1600')] bg-cover bg-center opacity-10"></div>
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block mb-4">
            <svg
              className="h-12 w-12 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L9.5 9H2l6 4.5L5.5 22 12 17.5 18.5 22l-2.5-8.5L22 9h-7.5L12 2z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Discover the Best of <span className="text-red-600">Canadian</span> Craftsmanship
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Supporting local businesses and celebrating Canadian-made products from coast to coast
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
              <Link href="/businesses">Explore Businesses</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/categories">Browse Categories</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Proudly featuring businesses from all Canadian provinces and territories</span>
          </div>
        </div>
      </div>
    </section>
  )
}

