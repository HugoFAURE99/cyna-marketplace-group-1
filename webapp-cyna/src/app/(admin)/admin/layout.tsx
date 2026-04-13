export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <nav>Admin</nav>
      {children}
    </div>
  )
}