import Hero from "@/components/home/hero"
import FeaturedBusinesses from "@/components/home/featured-businesses"
import Newsletter from "@/components/home/newsletter"
import type { Metadata } from "next"
import { getBusinesses } from "@/lib/api"

export const metadata: Metadata = {
  title: "Made in Canada | Home",
  description: "Discover amazing Canadian businesses and products",
}

export default async function Home() {
  const businesses = await getBusinesses()
  const featuredBusinesses = businesses.slice(0, 3) // Get first 3 businesses as featured

  return (
    <main className="flex-1">
      <Hero />
      <FeaturedBusinesses businesses={featuredBusinesses} />
      <Newsletter />
    </main>
  )
}

