const API_BASE_URL = "https://api.madeincanada.ca/v1"

// Fallback data
const fallbackBusinesses: Business[] = [
  {
    id: "1",
    name: "Maple Craft Furniture",
    description: "Handcrafted wooden furniture made from sustainable Canadian maple.",
    location: "Toronto, Ontario",
    category: "Home & Furniture",
    website: "https://maplecraft.example.com",
    contactEmail: "info@maplecraft.example.com",
    contactPhone: "+1 (416) 555-1234",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Northern Lights Apparel",
    description: "Eco-friendly clothing inspired by Canada's natural beauty.",
    location: "Vancouver, British Columbia",
    category: "Fashion & Apparel",
    website: "https://northernlights.example.com",
    contactEmail: "hello@northernlights.example.com",
    contactPhone: "+1 (604) 555-5678",
    rating: 4.6,
  },
  // Add more fallback businesses as needed
]

const fallbackReviews: Review[] = [
  {
    id: "1",
    businessId: "1",
    rating: 5,
    comment: "Excellent quality furniture!",
    reviewerName: "John Doe",
    reviewDate: "2023-06-01T12:00:00Z",
  },
  // Add more fallback reviews as needed
]

const fallbackCategories: Category[] = [
  {
    id: "home-furniture",
    name: "Home & Furniture",
  },
  {
    id: "fashion-apparel",
    name: "Fashion & Apparel",
  },
  // Add more fallback categories as needed
]

async function fetchWithFallback<T>(url: string, fallbackData: T): Promise<T> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.warn(`Failed to fetch from ${url}. Using fallback data.`, error)
    return fallbackData
  }
}

export async function getBusinesses(): Promise<Business[]> {
  return fetchWithFallback(`${API_BASE_URL}/businesses`, fallbackBusinesses)
}

export async function getBusinessById(id: string): Promise<Business | undefined> {
  try {
    return await fetchWithFallback(
      `${API_BASE_URL}/businesses/${id}`,
      fallbackBusinesses.find((b) => b.id === id),
    )
  } catch (error) {
    console.error(`Failed to fetch business with id ${id}`, error)
    return undefined
  }
}

export async function createBusiness(businessData: Omit<Business, "id">): Promise<Business> {
  try {
    const response = await fetch(`${API_BASE_URL}/businesses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(businessData),
    })
    if (!response.ok) {
      throw new Error("Failed to create business")
    }
    return response.json()
  } catch (error) {
    console.error("Failed to create business", error)
    throw error
  }
}

export async function deleteBusiness(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/businesses/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete business")
    }
  } catch (error) {
    console.error(`Failed to delete business with id ${id}`, error)
    throw error
  }
}

export async function getReviews(): Promise<Review[]> {
  return fetchWithFallback(`${API_BASE_URL}/reviews`, fallbackReviews)
}

export async function createReview(reviewData: Omit<Review, "id">): Promise<Review> {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    })
    if (!response.ok) {
      throw new Error("Failed to create review")
    }
    return response.json()
  } catch (error) {
    console.error("Failed to create review", error)
    throw error
  }
}

export async function getCategories(): Promise<Category[]> {
  return fetchWithFallback(`${API_BASE_URL}/categories`, fallbackCategories)
}

// Types based on the API schema
export interface Business {
  id: string
  name: string
  description: string
  location: string
  category: string
  website: string
  contactEmail: string
  contactPhone: string
  rating?: number
}

export interface Review {
  id: string
  businessId: string
  rating: number
  comment: string
  reviewerName: string
  reviewDate: string
}

export interface Category {
  id: string
  name: string
}

