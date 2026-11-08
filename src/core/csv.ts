import { BOLUMLER } from "./sabitler";
import { asciiYap, sayiCoz, slug } from "./metin";
import { tarihCoz } from "./tarih";
import type { Ilan, OgretimDili, OgretimTuru, PuanTuru, Seviye, UniTuru } from "./types";

/** CSV sütunları; şablon ve yükleme ekranındaki açıklamalar buradan gelir. */
export const SUTUNLAR: Array<{ ad: string; zorunlu: boolean; aciklama: string; ornek: string }> = [
  { ad: "universite", zorunlu: true, aciklama: "Üniversitenin tam adı", ornek: "Marmara Üniversitesi" },
  { ad: "sehir", zorunlu: true, aciklama: "Programın verildiği şehir", ornek: "İstanbul" },
  { ad: "ulke", zorunlu: false, aciklama: "Yurt dışı programlar için ülke; Türkiye için boş bırak", ornek: "" },
  { ad: "tur", zorunlu: true, aciklama: "devlet veya vakıf", ornek: "devlet" },
  { ad: "enstitu", zorunlu: true, aciklama: "Enstitü adı", ornek: "Sosyal Bilimler Enstitüsü" },
  { ad: "program", zorunlu: true, aciklama: "Anabilim dalı / program adı", ornek: "İşletme" },
  { ad: "seviye", zorunlu: true, aciklama: "tezli yl, tezsiz yl veya doktora", ornek: "tezli yl" },
  { ad: "ogretim_dili", zorunlu: false, aciklama: "türkçe veya ingilizce (boşsa türkçe)", ornek: "türkçe" },
  { ad: "ogretim_turu", zorunlu: false, aciklama: "örgün, ikinci veya uzaktan (boşsa örgün)", ornek: "örgün" },
  { ad: "ucret", zorunlu: false, aciklama: "Dönemlik ücret, TL", ornek: "32500" },
  { ad: "donem", zorunlu: true, aciklama: "İlanın dönemi", ornek: "2026-2027 Bahar" },
  { ad: "basvuru_baslangic", zorunlu: true, aciklama: "GG.AA.YYYY", ornek: "03.11.2026" },
  { ad: "basvuru_bitis", zorunlu: true, aciklama: "GG.AA.YYYY", ornek: "21.11.2026" },
  { ad: "sinav_tarihi", zorunlu: false, aciklama: "Bilim sınavı / mülakat günü", ornek: "26.11.2026" },
  { ad: "kontenjan", zorunlu: false, aciklama: "T.C. uyruklu kontenjanı", ornek: "25" },
  { ad: "ales_turu", zorunlu: false, aciklama: "SAY, SÖZ veya EA; ALES istenmiyorsa boş", ornek: "EA" },
  { ad: "ales_min", zorunlu: false, aciklama: "En düşük ALES puanı", ornek: "55" },
  { ad: "ales_min_lisans", zorunlu: false, aciklama: "Sadece doktora: lisansla başvuranlar için", ornek: "" },
  { ad: "dil_min", zorunlu: false, aciklama: "YDS veya eşdeğeri en düşük puan", ornek: "50" },
  { ad: "gno_min", zorunlu: false, aciklama: "4'lük sistemde en düşük ortalama", ornek: "2,50" },
  { ad: "kabul_bolumler", zorunlu: false, aciklama: "Kabul edilen lisans bölümleri, | ile ayrılır; boşsa tümü", ornek: "İşletme|İktisat" },
  { ad: "ozel_not", zorunlu: false, aciklama: "Öğrencinin bilmesi gereken ek şart", ornek: "Mülakat yüz yüze yapılır" },
  { ad: "kaynak_url", zorunlu: true, aciklama: "Resmi ilanın bağlantısı", ornek: "https://sbe.marmara.edu.tr/ilanlar" },
];

export type SorunSeviyesi = "hata" | "uyari";
export interface Sorun {
  satir: number; // Excel'deki satır numarası (başlık = 1)
  sutun: string;
  mesaj: string;
  seviye: SorunSeviyesi;
}

export interface CsvSonucu {
  ilanlar: Ilan[];
  sorunlar: Sorun[];
  satirSayisi: number;
  hataliSatirlar: number[];
}

/** RFC 4180 benzeri ayrıştırıcı; ayırıcıyı (virgül / noktalı virgül / sekme) başlık satırından bulur. */
export function csvAyristir(metin: string): string[][] {
  const s = metin.replace(/^﻿/, "");
  const ilkSatir = s.split(/\r?\n/, 1)[0] ?? "";
  const adaylar = [";", ",", "\t"];
  const ayirici = adaylar.reduce((en, a) => (ilkSatir.split(a).length > ilkSatir.split(en).length ? a : en), ",");

  const satirlar: string[][] = [];
  let alan = "";
  let satir: string[] = [];
  let tirnakta = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (tirnakta) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          alan += '"';
          i++;
        } else tirnakta = false;
      } else alan += c;
    } else if (c === '"') {
      tirnakta = true;
    } else if (c === ayirici) {
      satir.push(alan);
      alan = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      satir.push(alan);
      satirlar.push(satir);
      satir = [];
      alan = "";
    } else alan += c;
  }
  if (alan !== "" || satir.length) {
    satir.push(alan);
    satirlar.push(satir);
  }
  return satirlar;
}

function enumCoz<T extends string>(deger: string, harita: Record<string, T>): T | undefined {
  return harita[asciiYap(deger).replace(/[\s_-]+/g, "")];
}

const TUR: Record<string, UniTuru> = { devlet: "devlet", vakif: "vakif" };
const SEVIYE: Record<string, Seviye> = {
  tezliyl: "tezli_yl",
  tezliyukseklisans: "tezli_yl",
  tezsizyl: "tezsiz_yl",
  tezsizyukseklisans: "tezsiz_yl",
  doktora: "doktora",
  dr: "doktora",
};
const DIL: Record<string, OgretimDili> = { turkce: "tr", tr: "tr", ingilizce: "en", en: "en", english: "en" };
const OGRETIM: Record<string, OgretimTuru> = {
  orgun: "orgun",
  normal: "orgun",
  ikinci: "ikinci",
  ikinciogretim: "ikinci",
  io: "ikinci",
  uzaktan: "uzaktan",
  uzaktanegitim: "uzaktan",
  uzaktanogretim: "uzaktan",
};
const PUAN: Record<string, PuanTuru> = { say: "SAY", sayisal: "SAY", soz: "SOZ", sozel: "SOZ", ea: "EA", esitagirlik: "EA" };

const BOLUM_ANAHTAR = new Map(BOLUMLER.map((b) => [asciiYap(b), b]));

export function ilanlariOku(metin: string): CsvSonucu {
  const tablo = csvAyristir(metin).filter((r) => r.some((h) => h.trim() !== ""));
  const sorunlar: Sorun[] = [];
  if (tablo.length === 0) {
    return { ilanlar: [], sorunlar: [{ satir: 1, sutun: "", mesaj: "Dosya boş.", seviye: "hata" }], satirSayisi: 0, hataliSatirlar: [] };
  }

  const baslik = tablo[0].map((h) => asciiYap(h).trim().replace(/\s+/g, "_"));
  const idx = new Map(baslik.map((h, i) => [h, i]));
  const eksikSutunlar = SUTUNLAR.filter((s) => s.zorunlu && !idx.has(s.ad)).map((s) => s.ad);
  if (eksikSutunlar.length) {
    return {
      ilanlar: [],
      sorunlar: [{ satir: 1, sutun: eksikSutunlar.join(", "), mesaj: "Başlık satırında bu sütunlar yok. Şablondaki başlıkları kullan.", seviye: "hata" }],
      satirSayisi: tablo.length - 1,
      hataliSatirlar: [],
    };
  }

  const ilanlar: Ilan[] = [];
  const hataliSatirlar: number[] = [];
  const kullanilanIdler = new Set<string>();
  const anahtarlar = new Map<string, number>();

  tablo.slice(1).forEach((r, i) => {
    const satir = i + 2;
    const al = (ad: string) => (r[idx.get(ad) ?? -1] ?? "").trim();
    const once = sorunlar.length;
    const hata = (sutun: string, mesaj: string) => sorunlar.push({ satir, sutun, mesaj, seviye: "hata" });
    const uyari = (sutun: string, mesaj: string) => sorunlar.push({ satir, sutun, mesaj, seviye: "uyari" });

    for (const s of SUTUNLAR) if (s.zorunlu && !al(s.ad)) hata(s.ad, "Boş bırakılamaz.");

    const tur = enumCoz(al("tur"), TUR);
    if (al("tur") && !tur) hata("tur", `"${al("tur")}" anlaşılmadı. devlet veya vakıf yaz.`);
    const seviye = enumCoz(al("seviye"), SEVIYE);
    if (al("seviye") && !seviye) hata("seviye", `"${al("seviye")}" anlaşılmadı. tezli yl, tezsiz yl veya doktora yaz.`);
    const dil = al("ogretim_dili") ? enumCoz(al("ogretim_dili"), DIL) : "tr";
    if (!dil) hata("ogretim_dili", `"${al("ogretim_dili")}" anlaşılmadı. türkçe veya ingilizce yaz.`);
    const ogretim = al("ogretim_turu") ? enumCoz(al("ogretim_turu"), OGRETIM) : "orgun";
    if (!ogretim) hata("ogretim_turu", `"${al("ogretim_turu")}" anlaşılmadı. örgün, ikinci veya uzaktan yaz.`);

    const tarih = (sutun: string) => {
      const v = al(sutun);
      if (!v) return null;
      const t = tarihCoz(v);
      if (!t) hata(sutun, `"${v}" geçerli bir tarih değil. GG.AA.YYYY biçiminde yaz.`);
      return t;
    };
    const bas = tarih("basvuru_baslangic");
    const bit = tarih("basvuru_bitis");
    const sinav = tarih("sinav_tarihi");
    if (bas && bit && bit < bas) hata("basvuru_bitis", "Bitiş tarihi başlangıçtan önce olamaz.");
    if (sinav && bit && sinav < bit) uyari("sinav_tarihi", "Sınav tarihi son başvurudan önce görünüyor.");

    const sayi = (sutun: string, min: number, max: number, aralikMesaji: string) => {
      const v = al(sutun);
      if (!v) return null;
      const n = sayiCoz(v);
      if (n === null || Number.isNaN(n)) {
        hata(sutun, `"${v}" sayı değil.`);
        return null;
      }
      if (n < min || n > max) {
        hata(sutun, aralikMesaji);
        return null;
      }
      return n;
    };
    const ucret = sayi("ucret", 0, 10_000_000, "Ücret 0 ile 10.000.000 TL arasında olmalı.");
    const kontenjan = sayi("kontenjan", 0, 10_000, "Kontenjan 0 ile 10.000 arasında olmalı.");
    const alesMin = sayi("ales_min", 0, 100, "ALES puanı 0 ile 100 arasında olmalı.");
    const alesMinLisans = sayi("ales_min_lisans", 0, 100, "ALES puanı 0 ile 100 arasında olmalı.");
    const dilMin = sayi("dil_min", 0, 100, "Dil puanı 0 ile 100 arasında olmalı (YDS ölçeği).");
    const gnoMin = sayi("gno_min", 0, 4, "Not ortalaması 4'lük sistemde girilmeli (0 ile 4 arası).");

    let alesTuru: PuanTuru | null = null;
    if (al("ales_turu")) {
      alesTuru = enumCoz(al("ales_turu"), PUAN) ?? null;
      if (!alesTuru) hata("ales_turu", `"${al("ales_turu")}" anlaşılmadı. SAY, SÖZ veya EA yaz.`);
    }
    if (alesTuru && alesMin === null && alesMinLisans === null) hata("ales_min", "ALES türü yazılmış ama en düşük puan yok.");
    if (!alesTuru && (alesMin !== null || alesMinLisans !== null)) hata("ales_turu", "ALES puanı yazılmış ama puan türü yok.");
    if (alesMinLisans !== null && seviye && seviye !== "doktora") uyari("ales_min_lisans", "Sadece doktora için kullanılır; bu satırda dikkate alınmayacak.");

    const kabulBolumler: string[] = [];
    for (const b of al("kabul_bolumler").split("|").map((x) => x.trim()).filter(Boolean)) {
      const bulunan = BOLUM_ANAHTAR.get(asciiYap(b));
      if (bulunan) kabulBolumler.push(bulunan);
      else uyari("kabul_bolumler", `"${b}" bölüm listesinde yok; bu bölümden öğrenci eşleşmez.`);
    }

    const url = al("kaynak_url");
    if (url && !/^https?:\/\/\S+\.\S+/.test(url)) hata("kaynak_url", "Bağlantı http:// veya https:// ile başlamalı.");

    const anahtar = asciiYap([al("universite"), al("enstitu"), al("program"), seviye, ogretim, al("donem")].join("|"));
    if (anahtarlar.has(anahtar)) uyari("program", `${anahtarlar.get(anahtar)}. satırla aynı program ve dönem.`);
    else anahtarlar.set(anahtar, satir);

    const satirHatali = sorunlar.slice(once).some((s) => s.seviye === "hata");
    if (satirHatali || !tur || !seviye || !dil || !ogretim || !bas || !bit) {
      hataliSatirlar.push(satir);
      return;
    }

    let id = slug(`${al("universite")} ${al("program")} ${seviye.replace("_", " ")}${ogretim !== "orgun" ? " " + ogretim : ""}`);
    if (kullanilanIdler.has(id)) id = `${id}-${satir}`;
    kullanilanIdler.add(id);

    ilanlar.push({
      id,
      universite: al("universite"),
      sehir: al("sehir"),
      ulke: al("ulke") || "Türkiye",
      tur,
      enstitu: al("enstitu"),
      program: al("program"),
      seviye,
      dil,
      ogretim,
      ucret,
      donem: al("donem"),
      basvuruBaslangic: bas,
      basvuruBitis: bit,
      sinavTarihi: sinav,
      kontenjan,
      alesTuru,
      alesMin,
      alesMinLisans: seviye === "doktora" ? alesMinLisans : null,
      dilMin,
      gnoMin,
      kabulBolumler,
      ozelNot: al("ozel_not"),
      kaynakUrl: url,
    });
  });

  return { ilanlar, sorunlar, satirSayisi: tablo.length - 1, hataliSatirlar };
}

/** Şablon: başlık + bir örnek satır. */
export function sablonMetni(): string {
  const kacis = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [SUTUNLAR.map((s) => s.ad).join(";"), SUTUNLAR.map((s) => kacis(s.ornek)).join(";")].join("\n");
}
