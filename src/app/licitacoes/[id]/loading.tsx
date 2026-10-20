import { CenteredSpinner } from "@/components/ui/Spinner"

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 w-full">
      <div className="h-5 w-32 rounded animate-pulse mb-5" style={{ background: "var(--border)" }} />
      <div className="rounded-2xl border bg-white p-5 mb-4" style={{ borderColor: "var(--border)" }}>
        <div className="h-7 w-3/4 rounded-lg animate-pulse mb-3" style={{ background: "var(--border)" }} />
        <div className="h-4 w-1/2 rounded animate-pulse" style={{ background: "var(--border)" }} />
      </div>
      <CenteredSpinner />
    </div>
  )
}
