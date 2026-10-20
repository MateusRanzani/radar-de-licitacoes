export function Spinner({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Carregando"
      aria-live="polite"
      className="animate-spin"
      style={{ color: "var(--brand)" }}
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CenteredSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner tamanho={32} />
    </div>
  )
}
