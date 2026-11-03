"use client";
import { useEffect, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import type { SignatureStatus } from "@/lib/signature-status";

export function useSignatureStatus() {
  const [status, setStatus] = useState<SignatureStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let disposed = false;
    let pending = false;
    const controller = new AbortController();
    async function refresh() {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const response = await fetch("/api/signature-status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Status indisponível");
        const next: SignatureStatus = await response.json();
        if (!disposed) {
          setStatus(next);
          setUnavailable(false);
        }
      } catch {
        if (!disposed) setUnavailable(true);
      } finally {
        pending = false;
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return { status, unavailable };
}
export function SignatureSummary({
  status,
  unavailable,
}: ReturnType<typeof useSignatureStatus>) {
  const count =
    Number(status?.contratante ?? false) + Number(status?.contratado ?? false);
  const message = unavailable
    ? "Não foi possível atualizar as assinaturas. Tentaremos novamente automaticamente."
    : !status
      ? "Consultando assinaturas…"
      : status.status === "cancelled"
        ? "Contrato cancelado"
        : !status.released
          ? "Contrato ainda não liberado para assinatura"
          : count === 2
            ? "Contrato assinado por ambas as partes"
            : count === 1
              ? "Contrato parcialmente assinado — aguardando a outra parte"
              : "Aguardando as duas assinaturas";
  return (
    <div
      className={`signature-progress ${!unavailable && count === 2 ? "complete" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {!unavailable && count === 2 ? (
        <Check size={20} aria-hidden />
      ) : (
        <Clock3 size={20} aria-hidden />
      )}
      <div>
        <strong>{message}</strong>
        {status &&
          !unavailable &&
          status.released &&
          status.status !== "cancelled" && (
            <small>
              {count}/2 assinaturas · SCALUP:{" "}
              {status.contratante ? "assinado" : "pendente"} · Jeremias Thomaz:{" "}
              {status.contratado ? "assinado" : "pendente"}
            </small>
          )}
      </div>
    </div>
  );
}
export default function SignatureProgress() {
  return <SignatureSummary {...useSignatureStatus()} />;
}
