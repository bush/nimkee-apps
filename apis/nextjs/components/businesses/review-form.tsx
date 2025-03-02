"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Star } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { createReview } from "@/lib/api"

export default function ReviewForm({ businessId }: { businessId: string }) {
  const [name, setName] = useState("")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await createReview({
        businessId,
        rating,
        comment,
        reviewerName: name,
        reviewDate: new Date().toISOString(),
      })

      setName("")
      setRating(0)
      setComment("")

      toast({
        title: "Review submitted!",
        description: "Thank you for sharing your experience.",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Your Name
          </label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
                aria-label={`Rate ${i + 1} stars`}
              >
                <Star
                  className={`h-6 w-6 ${
                    i < (hoverRating || rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-1">
            Your Review
          </label>
          <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} required />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700">
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </form>
  )
}

