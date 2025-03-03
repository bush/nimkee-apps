"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Search, Menu, X } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 md:gap-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold" onClick={() => {}}>
                  <svg
                    className="h-6 w-6 text-red-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L9.5 9H2l6 4.5L5.5 22 12 17.5 18.5 22l-2.5-8.5L22 9h-7.5L12 2z" />
                  </svg>
                  <span>Made in Canada</span>
                </Link>
                <Link
                  href="/"
                  className={`transition-colors hover:text-red-600 ${
                    isActive("/") ? "text-red-600 font-semibold" : ""
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/businesses"
                  className={`transition-colors hover:text-red-600 ${
                    isActive("/businesses") ? "text-red-600 font-semibold" : ""
                  }`}
                >
                  Businesses
                </Link>
                <Link
                  href="/categories"
                  className={`transition-colors hover:text-red-600 ${
                    isActive("/categories") ? "text-red-600 font-semibold" : ""
                  }`}
                >
                  Categories
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <svg
              className="h-6 w-6 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L9.5 9H2l6 4.5L5.5 22 12 17.5 18.5 22l-2.5-8.5L22 9h-7.5L12 2z" />
            </svg>
            <span className="hidden font-bold sm:inline-block">Made in Canada</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-red-600 ${
                isActive("/") ? "text-red-600" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="/businesses"
              className={`text-sm font-medium transition-colors hover:text-red-600 ${
                isActive("/businesses") ? "text-red-600" : ""
              }`}
            >
              Businesses
            </Link>
            <Link
              href="/categories"
              className={`text-sm font-medium transition-colors hover:text-red-600 ${
                isActive("/categories") ? "text-red-600" : ""
              }`}
            >
              Categories
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center">
              <Input type="search" placeholder="Search businesses..." className="w-[200px] md:w-[300px]" autoFocus />
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close search</span>
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

