"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

export default function Newsletter() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setEmail("")
      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing to our newsletter.",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      })
    }, 1000)
  }

  return (
    <section className="bg-red-600 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Mail className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Stay Updated with Canadian Businesses</h2>
          <p className="mb-8">
            Subscribe to our newsletter to receive updates on new businesses, special promotions, and Canadian business
            news.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white text-gray-900"
            />
            <Button type="submit" disabled={isLoading} className="bg-white text-red-600 hover:bg-gray-100">
              {isLoading ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
          <p className="text-sm mt-4 text-red-100">We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </div>
    </section>
  )
}

