import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import * as React from "react"
import { cn } from "@/lib/utils"
import { type ButtonProps, buttonVariants } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl?: string
}

export default function Pagination({ currentPage, totalPages, baseUrl = "/businesses" }: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const getPageUrl = (page: number) => {
    const url = new URL(baseUrl, "http://localhost")
    url.searchParams.set("page", page.toString())
    return `${url.pathname}${url.search}`
  }

  // Create array of page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning
      if (currentPage <= 3) {
        end = 4
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push("ellipsis-start")
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis-end")
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav className="flex justify-center" aria-label="Pagination">
      <ul className="flex items-center gap-1">
        <li>
          <Button variant="outline" size="icon" disabled={currentPage === 1} asChild={currentPage !== 1}>
            {currentPage === 1 ? (
              <span>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </span>
            ) : (
              <Link href={getPageUrl(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Link>
            )}
          </Button>
        </li>

        {pageNumbers.map((page, index) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <li key={`ellipsis-${index}`}>
                <span className="px-2">...</span>
              </li>
            )
          }

          return (
            <li key={index}>
              {page === currentPage ? (
                <Button variant="default" size="icon" className="bg-red-600 hover:bg-red-600">
                  {page}
                </Button>
              ) : (
                <Button variant="outline" size="icon" asChild>
                  <Link href={getPageUrl(page as number)}>{page}</Link>
                </Button>
              )}
            </li>
          )
        })}

        <li>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === totalPages}
            asChild={currentPage !== totalPages}
          >
            {currentPage === totalPages ? (
              <span>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </span>
            ) : (
              <Link href={getPageUrl(currentPage + 1)}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Link>
            )}
          </Button>
        </li>
      </ul>
    </nav>
  )
}

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  ),
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className,
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 pl-2.5", className)} {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 pr-2.5", className)} {...props}>
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export { PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious }

