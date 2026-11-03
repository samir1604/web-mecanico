"use client";

import { useTransition } from "react";

export function ResetDemoButton() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (
      !window.confirm(
        "¿Reiniciar la base de datos con los datos de demo?\n\nEsta acción borrará todas las órdenes actuales y sembrará los 5 ejemplos iniciales.",
      )
    ) {
      event.preventDefault();
      return;
    }
  }

  return (
    <form action="/api/demo/reset" method="post" onSubmit={handleSubmit}>
      <button
        type="submit"
        className="button button--ghost demo-reset-btn"
        disabled={isPending}
      >
        {isPending ? "Reiniciando..." : "Reiniciar demo"}
      </button>
    </form>
  );
}
