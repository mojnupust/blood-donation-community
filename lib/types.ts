/**
 * lib/types.ts
 *
 * Shared TypeScript types used across API and UI layers.
 */

export interface DonorSummary {
  id: string
  name: string
  fatherName: string | null
  village: string
  wardNumber: string
  union: string | null
  upazila: string
  district: string
  mobile: string
  bloodGroup: string
  profession: string | null
  isAvailable: boolean
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DonorsApiResponse {
  data: DonorSummary[]
  pagination: PaginationMeta
}

export interface DonorFilters {
  name: string
  bloodGroup: string
  village: string
  mobile: string
  upazila: string
  district: string
}
