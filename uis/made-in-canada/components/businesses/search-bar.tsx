"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  defaultSearch?: string
  defaultCategory?: string
  defaultLocation?: string
}

export default function SearchBar({ defaultSearch = "", defaultCategory = "", defaultLocation = "" }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(defaultSearch)
  const [category, setCategory] = useState(defaultCategory)
  const [location, setLocation] = useState(defaultLocation)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (category) params.set("category", category)
    if (location) params.set("location", location)

    router.push(`/businesses?${params.toString()}`)
  }

  const handleReset = () => {
    setSearch("")
    setCategory("")
    setLocation("")
    router.push("/businesses")
  }

  const hasFilters = search || category || location

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md mb-8">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
              <SelectItem value="Fashion & Apparel">Fashion & Apparel</SelectItem>
              <SelectItem value="Home & Furniture">Home & Furniture</SelectItem>
              <SelectItem value="Arts & Crafts">Arts & Crafts</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="Toronto">Toronto</SelectItem>
              <SelectItem value="Vancouver">Vancouver</SelectItem>
              <SelectItem value="Montreal">Montreal</SelectItem>
              <SelectItem value="Calgary">Calgary</SelectItem>
              <SelectItem value="Winnipeg">Winnipeg</SelectItem>
              <SelectItem value="Halifax">Halifax</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end mt-4 gap-2">
        {hasFilters && (
          <Button type="button" variant="outline" onClick={handleReset} className="flex items-center gap-1">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Search
        </Button>
      </div>
    </form>
  )
}

