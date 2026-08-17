export type DashboardRole = "admin" | "viewer"
export type DashboardUserStatus = "pending" | "approved"

export interface DashboardUserRecord {
  email: string
  displayName?: string
  photoURL?: string
  role: DashboardRole
  status: DashboardUserStatus
  requestedAt?: string
  approvedAt?: string
}
