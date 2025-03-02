import Link from "next/link"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="h-6 w-6 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L9.5 9H2l6 4.5L5.5 22 12 17.5 18.5 22l-2.5-8.5L22 9h-7.5L12 2z" />
              </svg>
              <span className="font-bold text-white">Made in Canada</span>
            </div>
            <p className="mb-4">
              Supporting local businesses and celebrating Canadian-made products from coast to coast.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-white">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="hover:text-white">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="hover:text-white">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/businesses" className="hover:text-white">
                  Businesses
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/categories/food-beverage" className="hover:text-white">
                  Food & Beverage
                </Link>
              </li>
              <li>
                <Link href="/categories/fashion-apparel" className="hover:text-white">
                  Fashion & Apparel
                </Link>
              </li>
              <li>
                <Link href="/categories/home-furniture" className="hover:text-white">
                  Home & Furniture
                </Link>
              </li>
              <li>
                <Link href="/categories/arts-crafts" className="hover:text-white">
                  Arts & Crafts
                </Link>
              </li>
              <li>
                <Link href="/categories/technology" className="hover:text-white">
                  Technology
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-red-500" />
                <span>
                  123 Maple Street
                  <br />
                  Toronto, ON M5V 2K4
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-red-500" />
                <Link href="tel:+14165551234" className="hover:text-white">
                  (416) 555-1234
                </Link>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-red-500" />
                <Link href="mailto:info@madeincanada.ca" className="hover:text-white">
                  info@madeincanada.ca
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Made in Canada. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <ul className="flex gap-4 text-sm">
              <li>
                <Link href="#" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

