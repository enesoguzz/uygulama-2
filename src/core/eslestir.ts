import { ALES_GECERLILIK_YIL, DIL_SINAVI_ADI, PUAN_TURU_ADI, TOEFL_YDS } from "./sabitler";
import { ondalik, puanMetni } from "./metin";
import { gunFarki } from "./tarih";
import type { BasvuruDurumu, ElemeNedeni, Eslesme, Ilan, Kontrol, Profil } from "./types";

/** "Az farkla" sayılacak en büyük açıklar. Bunun üstü listede gösterilmez. */
export const AZ_FARK = { ales: 10, dil: 15 };

/** Öğrencinin dil puanının YDS karşılığı. Bilinmiyorsa null. */
export function ydsKarsiligi(p: Pick<Profil, "dilSinavi" | "dilPuani">): number | null {
  if (!p.dilSinavi || p.dilPuani === null || Number.isNaN(p.dilPuani)) return null;
  if (p.dilSinavi === "TOEFL") {
    const satir = TOEFL_YDS.find(([toefl]) => p.dilPuani! >= toefl);
    return satir ? satir[1] : null; // tablonun altı: eşdeğer yok
  }
  return p.dilPuani;
}

export function basvuruDurumu(ilan: Ilan, bugun: string): { durum: BasvuruDurumu; gun: number } {
  if (bugun < ilan.basvuruBaslangic) return { durum: "yakinda", gun: gunFarki(bugun, ilan.basvuruBaslangic) };
  if (bugun > ilan.basvuruBitis) return { durum: "kapandi", gun: gunFarki(ilan.basvuruBitis, bugun) };
  return { durum: "acik", gun: gunFarki(bugun, ilan.basvuruBitis) };
}

const p2 = puanMetni;

/**
 * Bir ilanı öğrenci profiline göre değerlendirir.
 * Seviye uymuyorsa null döner (program hiç gösterilmez).
 * Şehir, dil, üniversite türü gibi tercihler burada değil, liste filtrelerinde uygulanır.
 */
export function degerlendir(ilan: Ilan, profil: Profil, bugun: string): Eslesme | null {
  if (ilan.seviye !== profil.seviye) return null;

  const kontroller: Kontrol[] = [];
  let eleme: ElemeNedeni | undefined;
  const ele = (n: ElemeNedeni) => {
    if (!eleme) eleme = n;
  };
  const { durum, gun } = basvuruDurumu(ilan, bugun);
  const sonuc = (): Eslesme => {
    const eksikler = kontroller.filter((k) => k.sonuc === "eksik");
    let kategori: Eslesme["kategori"] = "uygun";
    if (eleme) kategori = "kapsam_disi";
    else if (eksikler.length) kategori = "az_farkla";
    return { ilan, kategori, kontroller, elemeNedeni: eleme, durum, gun };
  };

  // 1) Bölüm
  if (ilan.kabulBolumler.length) {
    if (!profil.bolum || !ilan.kabulBolumler.includes(profil.bolum)) {
      ele("bolum");
      kontroller.push({ alan: "bolum", sonuc: "eksik", metin: `Sadece şu bölümlerin mezunlarını kabul ediyor: ${ilan.kabulBolumler.join(", ")}.` });
    } else {
      kontroller.push({ alan: "bolum", sonuc: "tamam", metin: `${profil.bolum} mezunlarını kabul ediyor.` });
    }
  } else {
    kontroller.push({ alan: "bolum", sonuc: "tamam", metin: "Tüm bölümlerin mezunlarına açık." });
  }

  // 2) Doktora: hangi diplomayla
  let alesAlt = ilan.alesMin;
  if (ilan.seviye === "doktora") {
    if (profil.mezuniyet === "lisans") {
      if (ilan.alesMinLisans === null) {
        ele("mezuniyet");
        kontroller.push({ alan: "mezuniyet", sonuc: "eksik", metin: "Lisans diplomasıyla doktora başvurusu kabul etmiyor; tezli yüksek lisans gerekiyor." });
      } else {
        alesAlt = ilan.alesMinLisans;
        kontroller.push({ alan: "mezuniyet", sonuc: "tamam", metin: "Lisans diplomasıyla başvuru kabul ediyor." });
      }
    } else {
      kontroller.push({ alan: "mezuniyet", sonuc: "tamam", metin: "Tezli yüksek lisans diplomasıyla başvurabilirsin." });
    }
  }

  // 3) ALES
  if (ilan.alesTuru && alesAlt !== null) {
    const tur = PUAN_TURU_ADI[ilan.alesTuru];
    const puan = profil.alesYok ? undefined : profil.ales[ilan.alesTuru];
    if (puan === undefined) {
      ele("ales_yok");
      kontroller.push({ alan: "ales", sonuc: "eksik", metin: `ALES-${tur} puanı istiyor (en az ${p2(alesAlt)}). Bu puan türünde sonucun yok.`, kisa: `ALES-${tur} ${p2(alesAlt)} isteniyor`, fark: alesAlt });
    } else {
      const yas = profil.alesYili !== null ? Number(bugun.slice(0, 4)) - profil.alesYili : 0;
      if (yas > ALES_GECERLILIK_YIL) {
        ele("ales_suresi");
        kontroller.push({ alan: "ales", sonuc: "eksik", metin: `ALES sonucunun ${ALES_GECERLILIK_YIL} yıllık geçerlilik süresi dolmuş.`, kisa: "ALES süresi dolmuş" });
      } else if (puan < alesAlt) {
        const fark = alesAlt - puan;
        if (fark > AZ_FARK.ales) ele("ales_dusuk");
        kontroller.push({ alan: "ales", sonuc: "eksik", metin: `ALES-${tur} en az ${p2(alesAlt)} istiyor, seninki ${p2(puan)}. ${p2(fark)} puan eksik.`, kisa: `ALES-${tur} ${p2(puan)}, ${p2(alesAlt)} isteniyor`, fark });
      } else {
        kontroller.push({ alan: "ales", sonuc: "tamam", metin: `ALES-${tur} puanın ${p2(puan)}, program en az ${p2(alesAlt)} istiyor.`, kisa: `ALES-${tur} ${p2(puan)} · en az ${p2(alesAlt)}` });
        if (yas === ALES_GECERLILIK_YIL) {
          kontroller.push({ alan: "ales", sonuc: "bilgi", metin: "ALES sonucunun süresi bu yıl doluyor; belgedeki sınav tarihini kontrol et." });
        }
      }
    }
  } else {
    kontroller.push({ alan: "ales", sonuc: "tamam", metin: "ALES şartı yok.", kisa: "ALES istemiyor" });
  }

  // 4) Yabancı dil
  if (ilan.dilMin !== null) {
    const yds = ydsKarsiligi(profil);
    if (yds === null) {
      ele("dil_yok");
      kontroller.push({ alan: "dil", sonuc: "eksik", metin: `YDS veya eşdeğeri en az ${p2(ilan.dilMin)} istiyor. Geçerli bir dil puanın yok.`, kisa: `Dil ${p2(ilan.dilMin)} isteniyor`, fark: ilan.dilMin });
    } else {
      const kaynak = profil.dilSinavi === "TOEFL" ? `TOEFL iBT ${profil.dilPuani} puanının YDS karşılığı ${yds}` : `${DIL_SINAVI_ADI[profil.dilSinavi!]} puanın ${p2(yds)}`;
      if (yds < ilan.dilMin) {
        const fark = ilan.dilMin - yds;
        if (fark > AZ_FARK.dil) ele("dil_dusuk");
        kontroller.push({ alan: "dil", sonuc: "eksik", metin: `Dil puanı en az ${p2(ilan.dilMin)} istiyor; ${kaynak}. ${p2(fark)} puan eksik.`, kisa: `Dil ${p2(yds)}, ${p2(ilan.dilMin)} isteniyor`, fark });
      } else {
        kontroller.push({ alan: "dil", sonuc: "tamam", metin: `${kaynak}, program en az ${p2(ilan.dilMin)} istiyor.`, kisa: `Dil ${p2(yds)} · en az ${p2(ilan.dilMin)}` });
      }
    }
  } else {
    kontroller.push({ alan: "dil", sonuc: "tamam", metin: "Yabancı dil puanı istemiyor.", kisa: "Dil puanı istemiyor" });
  }

  // 5) Not ortalaması (sonradan yükseltilemez, bu yüzden eksikse eler)
  if (ilan.gnoMin !== null) {
    if (profil.gno === null) {
      kontroller.push({ alan: "gno", sonuc: "bilgi", metin: `En az ${ondalik(ilan.gnoMin)} not ortalaması istiyor.` });
    } else if (profil.gno < ilan.gnoMin) {
      ele("gno");
      kontroller.push({ alan: "gno", sonuc: "eksik", metin: `En az ${ondalik(ilan.gnoMin)} ortalama istiyor, seninki ${ondalik(profil.gno)}.` });
    } else {
      kontroller.push({ alan: "gno", sonuc: "tamam", metin: `Ortalaman ${ondalik(profil.gno)}, en az ${ondalik(ilan.gnoMin)} isteniyor.`, kisa: `Ortalama ${ondalik(profil.gno)} · en az ${ondalik(ilan.gnoMin)}` });
    }
  }

  // 6) İlandaki özel not
  if (ilan.ozelNot) kontroller.push({ alan: "not", sonuc: "bilgi", metin: ilan.ozelNot });

  // Az farkla: en fazla iki eksik ve hepsi puanla kapatılabilir olmalı
  const s = sonuc();
  if (s.kategori === "az_farkla" && s.kontroller.filter((k) => k.sonuc === "eksik").length > 2) {
    return { ...s, kategori: "kapsam_disi" };
  }
  return s;
}

const DURUM_SIRASI: Record<BasvuruDurumu, number> = { acik: 0, yakinda: 1, kapandi: 2 };

export function sirala(a: Eslesme, b: Eslesme): number {
  if (a.durum !== b.durum) return DURUM_SIRASI[a.durum] - DURUM_SIRASI[b.durum];
  if (a.gun !== b.gun) return a.gun - b.gun;
  return a.ilan.universite.localeCompare(b.ilan.universite, "tr");
}

export interface Tercihler {
  sehirler: string[];
  dil: Profil["dilTercihi"];
  tur: Profil["turTercihi"];
  ogretim: Profil["ogretimTercihi"];
}

export function tercihlereUyar(ilan: Ilan, t: Tercihler): boolean {
  if (t.sehirler.length && !t.sehirler.includes(ilan.sehir)) return false;
  if (t.dil !== "farketmez" && ilan.dil !== t.dil) return false;
  if (t.tur !== "farketmez" && ilan.tur !== t.tur) return false;
  if (t.ogretim.length && !t.ogretim.includes(ilan.ogretim)) return false;
  return true;
}

export interface EslesmeOzeti {
  uygun: Eslesme[];
  azFarkla: Eslesme[];
  elenen: Partial<Record<ElemeNedeni, number>>;
}

export function eslestir(ilanlar: Ilan[], profil: Profil, tercih: Tercihler, bugun: string): EslesmeOzeti {
  const uygun: Eslesme[] = [];
  const azFarkla: Eslesme[] = [];
  const elenen: EslesmeOzeti["elenen"] = {};
  for (const ilan of ilanlar) {
    if (!tercihlereUyar(ilan, tercih)) continue;
    const e = degerlendir(ilan, profil, bugun);
    if (!e) continue;
    if (e.kategori === "uygun") uygun.push(e);
    else if (e.kategori === "az_farkla") azFarkla.push(e);
    else if (e.elemeNedeni) elenen[e.elemeNedeni] = (elenen[e.elemeNedeni] ?? 0) + 1;
  }
  uygun.sort(sirala);
  azFarkla.sort((a, b) => {
    const fa = a.kontroller.reduce((t, k) => t + (k.fark ?? 0), 0);
    const fb = b.kontroller.reduce((t, k) => t + (k.fark ?? 0), 0);
    return DURUM_SIRASI[a.durum] - DURUM_SIRASI[b.durum] || fa - fb || sirala(a, b);
  });
  return { uygun, azFarkla, elenen };
}
