/**
 * app/admin/page.tsx
 *
 * Basic admin dashboard landing page.
 */

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to the Blood Donation Community admin panel. Use the navigation
        to manage donor profiles.
      </p>
    </div>
  )
}
