/**
 * app/page.tsx
 *
 * Public Donor Directory — the main landing page.
 *
 * Architecture decisions:
 * - Client Component: search/filter state must be reactive without full-page
 *   navigation; useState + useEffect provides this without a heavy router dep.
 * - Debounce: text inputs debounce 400 ms before triggering a fetch so that
 *   the API isn't hammered on every keystroke.
 * - URL-sync: filters are kept in sync with URLSearchParams via
 *   router.replace so results are shareable and survive a page refresh.
 * - Pagination: page number is reset to 1 whenever a filter changes.
 */

"use client"

import { useCallback, useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Droplets,
  Phone,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { DonorSummary, PaginationMeta, DonorFilters } from "@/lib/types"

// ── Constants ────────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const PAGE_SIZE = 10
const DEBOUNCE_MS = 400

// ── Blood group badge color map ──────────────────────────────────────────────
const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+":  "bg-red-100    text-red-700    border-red-200",
  "A-":  "bg-red-50     text-red-600    border-red-100",
  "B+":  "bg-blue-100   text-blue-700   border-blue-200",
  "B-":  "bg-blue-50    text-blue-600   border-blue-100",
  "AB+": "bg-purple-100 text-purple-700 border-purple-200",
  "AB-": "bg-purple-50  text-purple-600 border-purple-100",
  "O+":  "bg-green-100  text-green-700  border-green-200",
  "O-":  "bg-green-50   text-green-600  border-green-100",
}

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 rounded bg-muted animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
function DonorDirectoryContent() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  // Read initial state from URL (allows bookmark/share/refresh to work)
  const [filters, setFilters] = useState<DonorFilters>({
    name:       searchParams.get("name")       ?? "",
    bloodGroup: searchParams.get("bloodGroup") ?? "",
    village:    searchParams.get("village")    ?? "",
    mobile:     searchParams.get("mobile")     ?? "",
    upazila:    searchParams.get("upazila")    ?? "",
    district:   searchParams.get("district")   ?? "",
  })
  const [page,       setPage]       = useState(Number(searchParams.get("page")) || 1)
  const [donors,     setDonors]     = useState<DonorSummary[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  // Debounce timer ref — holds the setTimeout id between renders
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Capture initial values in refs so the mount-only useEffect below can read
  // them without adding 'filters' and 'page' to the dependency array.
  const initialFiltersRef = useRef(filters)
  const initialPageRef    = useRef(page)

  // ── Fetch helpers ───────────────────────────────────────────────────────────
  const fetchDonors = useCallback(
    async (f: DonorFilters, p: number) => {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("page",  String(p))
      params.set("limit", String(PAGE_SIZE))
      if (f.name)                               params.set("name",       f.name)
      if (f.bloodGroup && f.bloodGroup !== "all") params.set("bloodGroup", f.bloodGroup)
      if (f.village)                            params.set("village",    f.village)
      if (f.mobile)                             params.set("mobile",     f.mobile)
      if (f.upazila)                            params.set("upazila",    f.upazila)
      if (f.district)                           params.set("district",   f.district)

      try {
        const res = await fetch(`/api/donors?${params.toString()}`)
        if (res.status === 429) {
          setError("Too many requests. Please wait a moment and try again.")
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setDonors(json.data ?? [])
        setPagination(json.pagination ?? null)
      } catch {
        setError("Failed to load donor data. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // ── URL sync ────────────────────────────────────────────────────────────────
  const syncUrl = useCallback(
    (f: DonorFilters, p: number) => {
      const params = new URLSearchParams()
      if (p > 1)                                  params.set("page",       String(p))
      if (f.name)                                 params.set("name",        f.name)
      if (f.bloodGroup && f.bloodGroup !== "all") params.set("bloodGroup", f.bloodGroup)
      if (f.village)                              params.set("village",     f.village)
      if (f.mobile)                               params.set("mobile",      f.mobile)
      if (f.upazila)                              params.set("upazila",     f.upazila)
      if (f.district)                             params.set("district",    f.district)
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [router, pathname]
  )

  // ── Filter change handler (debounced for text inputs) ───────────────────────
  const handleFilterChange = useCallback(
    (key: keyof DonorFilters, value: string) => {
      const next = { ...filters, [key]: value }
      setFilters(next)
      setPage(1)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(
        () => {
          syncUrl(next, 1)
          fetchDonors(next, 1)
        },
        key === "bloodGroup" ? 0 : DEBOUNCE_MS
      )
    },
    [filters, fetchDonors, syncUrl]
  )

  // ── Page change handler ─────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    (next: number) => {
      setPage(next)
      syncUrl(filters, next)
      fetchDonors(filters, next)
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [filters, fetchDonors, syncUrl]
  )

  // ── Initial fetch on mount ──────────────────────────────────────────────────
  // Uses refs so no state variables are listed as deps (avoiding stale closures
  // while keeping a strict empty dep array for mount-only semantics).
  useEffect(() => {
    fetchDonors(initialFiltersRef.current, initialPageRef.current)
  }, [fetchDonors])

  // ── Reset all filters ───────────────────────────────────────────────────────
  const handleReset = () => {
    const empty: DonorFilters = {
      name: "", bloodGroup: "", village: "", mobile: "", upazila: "", district: "",
    }
    setFilters(empty)
    setPage(1)
    router.replace(pathname, { scroll: false })
    fetchDonors(empty, 1)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <header className="border-b bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-8 md:py-12 text-center">
        <div className="mx-auto max-w-4xl space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Droplets className="size-8" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Blood Donor Directory
            </h1>
          </div>
          <p className="text-red-100 text-sm md:text-base">
            Find blood donors in your area quickly. Every donor can save a life.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Search className="size-4" />
            Search &amp; Filter Donors
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {/* Name */}
            <div className="xl:col-span-2">
              <Input
                placeholder="Search by name…"
                value={filters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
              />
            </div>

            {/* Blood Group */}
            <Select
              value={filters.bloodGroup || "all"}
              onValueChange={(v) =>
                handleFilterChange("bloodGroup", v === "all" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All blood groups</SelectItem>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Village */}
            <Input
              placeholder="Village…"
              value={filters.village}
              onChange={(e) => handleFilterChange("village", e.target.value)}
            />

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Phone number…"
                value={filters.mobile}
                onChange={(e) => handleFilterChange("mobile", e.target.value)}
              />
            </div>

            {/* District */}
            <Input
              placeholder="District…"
              value={filters.district}
              onChange={(e) => handleFilterChange("district", e.target.value)}
            />
          </div>

          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {/* ── Results summary ──────────────────────────────────────────────── */}
        {pagination && !loading && (
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <strong>
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </strong>{" "}
            of <strong>{pagination.total}</strong> donors
          </p>
        )}

        {/* ── Error state ──────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── Data Table ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> Location
                  </span>
                </TableHead>
                <TableHead>Upazila / District</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" /> Mobile
                  </span>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : donors.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Droplets className="size-8 opacity-20" />
                      <span>No donors found matching your filters.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                donors.map((donor, idx) => (
                  <TableRow key={donor.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{donor.name}</div>
                      {donor.fatherName && (
                        <div className="text-xs text-muted-foreground">
                          s/o {donor.fatherName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          BLOOD_GROUP_COLORS[donor.bloodGroup] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {donor.bloodGroup}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>{donor.village}</div>
                      {donor.union && (
                        <div className="text-xs text-muted-foreground">
                          {donor.union}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{donor.upazila}</div>
                      <div className="text-xs text-muted-foreground">
                        {donor.district}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {donor.mobile}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={donor.isAvailable ? "default" : "secondary"}
                        className={
                          donor.isAvailable
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }
                      >
                        {donor.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination Controls ───────────────────────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              Page <strong className="text-foreground">{page}</strong> of{" "}
              <strong className="text-foreground">{pagination.totalPages}</strong>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
        Blood Donation Community &mdash; Together we save lives
      </footer>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────
// useSearchParams() must be inside a Suspense boundary to support static
// export / prerendering in Next.js App Router.
export default function DonorDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-red-500" />
        </div>
      }
    >
      <DonorDirectoryContent />
    </Suspense>
  )
}
