import { CenteredSpinner } from "@/components/ui/Spinner"

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 w-full">
      <div className="mb-6">
        <div className="h-7 w-72 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
        <div className="h-4 w-48 rounded mt-2 animate-pulse" style={{ background: "var(--border)" }} />
      </div>
      <CenteredSpinner />
    </div>
  )
}
