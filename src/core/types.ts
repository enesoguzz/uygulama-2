export type Seviye = "tezli_yl" | "tezsiz_yl" | "doktora";
export type PuanTuru = "SAY" | "SOZ" | "EA";
export type UniTuru = "devlet" | "vakif";
export type OgretimDili = "tr" | "en";
export type OgretimTuru = "orgun" | "ikinci" | "uzaktan";
export type DilSinavi = "YDS" | "YOKDIL" | "EYDS" | "TOEFL" | "DIGER";

/** Bir lisansüstü programın bir dönemdeki ilanı. CSV'deki her satır bir ilandır. */
export interface Ilan {
  id: string;
  universite: string;
  sehir: string;
  /** "Türkiye" ya da yurt dışı programlar için ülke adı. */
  ulke: string;
  tur: UniTuru;
  enstitu: string;
  program: string;
  seviye: Seviye;
  dil: OgretimDili;
  ogretim: OgretimTuru;
  /** Dönemlik ücret (TL). Boşsa ücret bilgisi yok ya da ücretsiz. */
  ucret: number | null;
  donem: string;
  basvuruBaslangic: string; // YYYY-AA-GG
  basvuruBitis: string;
  sinavTarihi: string | null;
  kontenjan: number | null;
  alesTuru: PuanTuru | null;
  /** Yüksek lisans için alt sınır; doktorada yüksek lisans diplomasıyla başvuranlar için. */
  alesMin: number | null;
  /** Sadece doktora: lisans diplomasıyla başvuranlar için alt sınır. Boşsa lisansla başvuru kabul edilmez. */
  alesMinLisans: number | null;
  /** YDS veya eşdeğeri alt sınır. */
  dilMin: number | null;
  /** 4'lük sistemde not ortalaması alt sınırı. */
  gnoMin: number | null;
  /** Boş liste: tüm bölümlerin mezunları başvurabilir. */
  kabulBolumler: string[];
  ozelNot: string;
  kaynakUrl: string;
}

export interface Profil {
  seviye: Seviye;
  /** Doktora için: hangi diplomayla başvuruyor. */
  mezuniyet: "lisans" | "yl";
  alesYok: boolean;
  ales: Partial<Record<PuanTuru, number>>;
  alesYili: number | null;
  dilSinavi: DilSinavi | null; // null = dil puanı yok
  dilPuani: number | null;
  bolum: string;
  gno: number | null;
  sehirler: string[]; // boş = fark etmez
  dilTercihi: OgretimDili | "farketmez";
  turTercihi: UniTuru | "farketmez";
  ogretimTercihi: OgretimTuru[]; // boş = hepsi
}

export type KontrolSonuc = "tamam" | "eksik" | "bilgi";
export type KontrolAlani = "ales" | "dil" | "gno" | "bolum" | "mezuniyet" | "not";

export interface Kontrol {
  alan: KontrolAlani;
  sonuc: KontrolSonuc;
  metin: string;
  /** Kartlarda gösterilen kısa hali. */
  kisa?: string;
  /** Eksik puan farkı (varsa). */
  fark?: number;
}

export type BasvuruDurumu = "acik" | "yakinda" | "kapandi";
export type Kategori = "uygun" | "az_farkla" | "kapsam_disi";

/** Bir program listede neden yok: öğrenciye tek satırlık özet göstermek için. */
export type ElemeNedeni = "ales_yok" | "ales_dusuk" | "ales_suresi" | "dil_yok" | "dil_dusuk" | "gno" | "bolum" | "mezuniyet";

export interface Eslesme {
  ilan: Ilan;
  kategori: Kategori;
  kontroller: Kontrol[];
  elemeNedeni?: ElemeNedeni;
  durum: BasvuruDurumu;
  /** acik: son güne kalan gün, yakinda: açılışa kalan gün, kapandi: kapanalı geçen gün */
  gun: number;
}

export interface VeriSeti {
  ilanlar: Ilan[];
  kaynak: "ornek" | "yuklenen";
  yuklemeTarihi: string; // YYYY-AA-GG
}
