export default function AdminGroupLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    // Plus tard : vérification auth ici
    return <>{children}</>
  }