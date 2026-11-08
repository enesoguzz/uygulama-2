import { DIL_ADI, DIL_SINAVI_ADI, OGRETIM_ADI, PUAN_TURU_ADI, SEVIYE_ADI, TUR_ADI } from "../core/sabitler";
import { ondalik, puanMetni, tamsayi } from "../core/metin";
import { kisaTarih, kisaTarihTa } from "../core/tarih";
import type { BasvuruDurumu, Ilan, Profil, PuanTuru } from "../core/types";
import { ydsKarsiligi } from "../core/eslestir";

export function durumMetni(durum: BasvuruDurumu, gun: number, ilan: Ilan): string {
  if (durum === "acik") {
    if (gun === 0) return "Bugün son gün";
    if (gun === 1) return "Yarın kapanıyor";
    return `Açık · ${gun} gün kaldı`;
  }
  if (durum === "yakinda") {
    if (gun === 1) return "Yarın açılıyor";
    if (gun <= 7) return `${gun} gün sonra açılıyor`;
    return `${kisaTarihTa(ilan.basvuruBaslangic)} açılıyor`;
  }
  return `Kapandı · ${kisaTarih(ilan.basvuruBitis)}`;
}

export function ucretMetni(ilan: Ilan): string | null {
  if (ilan.ucret === null) return null;
  if (ilan.ucret === 0) return "Ücretsiz";
  return `${tamsayi(ilan.ucret)} TL / dönem`;
}

export function konum(ilan: Pick<Ilan, "sehir" | "ulke">): string {
  return ilan.ulke === "Türkiye" ? ilan.sehir : `${ilan.sehir}, ${ilan.ulke}`;
}

export function metaParcalari(ilan: Ilan): string[] {
  const p = [konum(ilan), DIL_ADI[ilan.dil], OGRETIM_ADI[ilan.ogretim]];
  if (ilan.ulke === "Türkiye") p.push(TUR_ADI[ilan.tur]);
  return p;
}

export function alesOzeti(p: Profil): string {
  if (p.alesYok) return "ALES yok";
  const turler: PuanTuru[] = ["SAY", "SOZ", "EA"];
  const parcalar = turler.filter((t) => p.ales[t] !== undefined).map((t) => `${PUAN_TURU_ADI[t]} ${puanMetni(p.ales[t]!)}`);
  if (!parcalar.length) return "ALES yok";
  return `ALES ${parcalar.join(" · ")}${p.alesYili ? ` (${p.alesYili})` : ""}`;
}

export function dilOzeti(p: Profil): string {
  if (!p.dilSinavi || p.dilPuani === null) return "Dil puanı yok";
  const ad = DIL_SINAVI_ADI[p.dilSinavi];
  if (p.dilSinavi === "TOEFL") {
    const y = ydsKarsiligi(p);
    return `${ad} ${p.dilPuani}${y !== null ? ` (YDS ${y})` : ""}`;
  }
  if (p.dilSinavi === "DIGER") return `YDS karşılığı ${puanMetni(p.dilPuani)}`;
  return `${ad} ${puanMetni(p.dilPuani)}`;
}

/** Programlar sayfasının üstündeki tek satırlık özet için en anlamlı ALES puanı. */
export function enYuksekAles(p: Profil): string | null {
  if (p.alesYok) return null;
  const turler: PuanTuru[] = ["SAY", "SOZ", "EA"];
  let en: PuanTuru | null = null;
  for (const t of turler) if (p.ales[t] !== undefined && (en === null || p.ales[t]! > p.ales[en]!)) en = t;
  return en ? `ALES-${PUAN_TURU_ADI[en]} ${puanMetni(p.ales[en]!)}` : null;
}

export function profilOzetParcalari(p: Profil): string[] {
  const parcalar = [SEVIYE_ADI[p.seviye]];
  const ales = enYuksekAles(p);
  if (ales) parcalar.push(ales);
  if (p.dilSinavi && p.dilPuani !== null) parcalar.push(dilOzeti(p));
  if (p.bolum) parcalar.push(p.bolum);
  return parcalar;
}

export function gnoMetni(n: number | null): string {
  return n === null ? "Girilmedi" : ondalik(n);
}
