"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getTour } from "@/lib/tours"

// driver.js é carregado dinamicamente para não entrar no bundle do servidor
export function TourRunner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const tourId       = searchParams.get("tour")
  const iniciado     = useRef(false)

  useEffect(() => {
    if (!tourId || iniciado.current) return
    const tour = getTour(tourId)
    if (!tour) return

    // Aguarda um tick para o DOM estar completamente pintado
    const timer = setTimeout(async () => {
      iniciado.current = true

      const { driver } = await import("driver.js")

      const driverObj = driver({
        showProgress:      true,
        progressText:      "Passo {{current}} de {{total}}",
        nextBtnText:       "Próximo →",
        prevBtnText:       "← Anterior",
        doneBtnText:       "Concluir ✓",
        allowClose:        true,
        overlayOpacity:    0.6,
        stagePadding:      8,
        stageRadius:       12,
        smoothScroll:      true,
        onDestroyed:       () => {
          // Remove o param ?tour= da URL sem recarregar a página
          const params = new URLSearchParams(window.location.search)
          params.delete("tour")
          const novaUrl = params.toString()
            ? `${window.location.pathname}?${params}`
            : window.location.pathname
          router.replace(novaUrl)
          iniciado.current = false
        },
        steps: tour.steps.map((s) => ({
          ...(s.element ? { element: s.element } : {}),
          popover: {
            title:       s.titulo,
            description: s.texto,
            side:        s.lado ?? "bottom",
          },
        })),
      })

      driverObj.drive()
    }, 400)

    return () => clearTimeout(timer)
  }, [tourId, router])

  return null
}
