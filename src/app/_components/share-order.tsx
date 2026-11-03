"use client";

import { useEffect, useRef, useState } from "react";

import {
  buildShareMessage,
  normalizeMexicanPhone,
  whatsAppUrl,
} from "@/workshop/whatsapp";

interface Props {
  folio: string;
  token: string;
  customerName: string;
  phone: string;
}

/**
 * Copia el enlace público y abre WhatsApp con el mensaje ya escrito. No hay
 * envío automático: todo ocurre en el navegador del dueño.
 */
export function ShareOrder({ folio, token, customerName, phone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const publicPath = `/orden/${token}`;
  const publicUrl = origin ? `${origin}${publicPath}` : publicPath;
  const normalizedPhone = normalizeMexicanPhone(phone);
  const message = buildShareMessage({ customerName, folio, publicUrl });
  const waHref = origin && normalizedPhone ? whatsAppUrl(phone, message) : null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      return;
    } catch {
      inputRef.current?.select();
      setCopied(document.execCommand("copy"));
    }
  }

  return (
    <section className="detail-card" aria-labelledby="compartir">
      <h2 id="compartir" className="section-title">
        Compartir con el cliente
      </h2>

      <label className="field">
        <span>Enlace público de la orden {folio}</span>
        <input
          ref={inputRef}
          className="share-link"
          type="text"
          readOnly
          value={publicUrl}
          onFocus={(event) => event.currentTarget.select()}
        />
      </label>

      <div className="share-actions">
        <button
          type="button"
          className="button button--ghost"
          onClick={copyLink}
          disabled={!origin}
        >
          {copied ? "Enlace copiado" : "Copiar enlace"}
        </button>

        {waHref ? (
          <a
            className="button"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Enviar por WhatsApp
          </a>
        ) : (
          <button
            type="button"
            className="button"
            disabled
            title="El teléfono de la orden no es válido para WhatsApp."
          >
            Enviar por WhatsApp
          </button>
        )}
      </div>

      {normalizedPhone ? (
        <p className="field-hint">Se abrirá WhatsApp al +{normalizedPhone}.</p>
      ) : (
        <p className="alert" role="note">
          El teléfono «{phone}» no es un número mexicano válido de 10 dígitos,
          así que no se puede abrir WhatsApp. Copia el enlace y compártelo
          manualmente.
        </p>
      )}
    </section>
  );
}
