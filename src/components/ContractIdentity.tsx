"use client";
import { useState } from "react";
import type { ContractSettings } from "@/lib/contract-settings";
export function ContractIdentity({
  value,
  onChange,
  providerLogo,
  fallbackLogo,
  disabled = false,
}: {
  value: ContractSettings;
  onChange: (v: ContractSettings) => void;
  providerLogo: string | null;
  fallbackLogo?: string | null;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 1000000
    ) {
      setError("Escolha um PNG, JPG ou WebP de até 1 MB.");
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      onChange({ ...value, clientLogo: data });
    } catch {
      setError("Não foi possível abrir a imagem. Tente outro arquivo.");
    }
  }
  return (
    <div className="contract-identity">
      <div className="form-grid">
        <label className="field">
          Título do contrato
          <input
            required
            minLength={3}
            maxLength={160}
            value={value.title}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="Ex.: Identidade visual e conteúdo mensal"
          />
        </label>
        <label className="field">
          Nome do cliente / marca
          <input
            required
            minLength={2}
            maxLength={120}
            value={value.clientName}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, clientName: e.target.value })}
            placeholder="Nome da empresa parceira"
          />
        </label>
        <label className="field">
          E-mail do cliente para assinatura
          <input
            required
            type="email"
            maxLength={254}
            value={value.clientEmail}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...value, clientEmail: e.target.value })
            }
            placeholder="responsavel@empresa.com"
          />
        </label>
        <label className="field">
          Logo do cliente
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled}
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          <small>
            PNG, JPG ou WebP · até 1 MB. Pode ser adicionado antes da liberação.
          </small>
        </label>
      </div>
      <div className="identity-preview">
        <div>
          {value.clientLogo || fallbackLogo ? (
            <img
              src={value.clientLogo || fallbackLogo!}
              alt={`Logo ${value.clientName || "do cliente"}`}
            />
          ) : (
            <span>Logo do cliente</span>
          )}
          <small>{value.clientName || "Cliente parceiro"}</small>
        </div>
        <span aria-hidden>×</span>
        <div>
          {providerLogo && (
            <img src={providerLogo} alt="Logo J de Jeremias Thomaz" />
          )}
          <small>Jeremias Thomaz · fixo</small>
        </div>
      </div>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
    </div>
  );
}
