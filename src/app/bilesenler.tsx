import type { ReactNode } from "react";
import { Bookmark, BookmarkCheck, Check, CircleAlert, Info } from "lucide-react";
import type { Eslesme, KontrolSonuc } from "../core/types";
import { durumMetni } from "./bicim";

export function Logo({ href = "#programlar" }: { href?: string }) {
  return (
    <a className="logo" href={href} aria-label="Kademe ana sayfa">
      {/* Üç basamak: kademe */}
      <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
        <rect x="0" y="11" width="6" height="7" rx="1.5" fill="var(--ink)" opacity=".35" />
        <rect x="8" y="6" width="6" height="12" rx="1.5" fill="var(--ink)" opacity=".6" />
        <rect x="16" y="0" width="6" height="18" rx="1.5" fill="var(--accent)" />
      </svg>
      <span className="logo-yazi">kademe</span>
    </a>
  );
}

export function DurumEtiketi({ e }: { e: Pick<Eslesme, "durum" | "gun" | "ilan"> }) {
  return <span className={`etiket ${e.durum}`}>{durumMetni(e.durum, e.gun, e.ilan)}</span>;
}

export function SartIkonu({ sonuc }: { sonuc: KontrolSonuc }) {
  const Ikon = sonuc === "tamam" ? Check : sonuc === "eksik" ? CircleAlert : Info;
  return (
    <span className={`sart-ikon ${sonuc}`} aria-hidden="true">
      <Ikon size={14} strokeWidth={2.5} />
    </span>
  );
}

export function YerImi({ takipte, onClick, ad }: { takipte: boolean; onClick: () => void; ad: string }) {
  return (
    <button
      type="button"
      className="yer-imi"
      aria-pressed={takipte}
      aria-label={takipte ? `${ad}: takipten çıkar` : `${ad}: takip et`}
      onClick={onClick}
    >
      {takipte ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
    </button>
  );
}

export function Cip({ secili, onClick, children, adet }: { secili: boolean; onClick: () => void; children: ReactNode; adet?: number }) {
  return (
    <button type="button" className="cip" aria-pressed={secili} onClick={onClick}>
      {children}
      {adet !== undefined && <span className="adet">{adet}</span>}
    </button>
  );
}

export function Bolumlu<T extends string>({
  secenekler,
  deger,
  degistir,
  etiket,
}: {
  secenekler: Array<{ deger: T; ad: string; adet?: number }>;
  deger: T;
  degistir: (d: T) => void;
  etiket: string;
}) {
  return (
    <div className="bolumlu" role="group" aria-label={etiket}>
      {secenekler.map((s) => (
        <button key={s.deger} type="button" aria-pressed={s.deger === deger} onClick={() => degistir(s.deger)}>
          {s.ad}
          {s.adet !== undefined && <span className="adet">{s.adet}</span>}
        </button>
      ))}
    </div>
  );
}

export function Anahtar({ acik, degistir, id, children }: { acik: boolean; degistir: (a: boolean) => void; id: string; children: ReactNode }) {
  return (
    <div className="anahtar">
      <label htmlFor={id}>{children}</label>
      <button id={id} type="button" role="switch" aria-checked={acik} className="anahtar-dugme" onClick={() => degistir(!acik)} />
    </div>
  );
}

export function Secenek({
  secili,
  onClick,
  baslik,
  alt,
}: {
  secili: boolean;
  onClick: () => void;
  baslik: string;
  alt?: string;
}) {
  return (
    <button type="button" role="radio" aria-checked={secili} className="secenek" onClick={onClick}>
      <span>
        <span className="secenek-baslik">{baslik}</span>
        {alt && (
          <>
            <br />
            <span className="secenek-alt">{alt}</span>
          </>
        )}
      </span>
      <span className="radyo" aria-hidden="true" />
    </button>
  );
}
