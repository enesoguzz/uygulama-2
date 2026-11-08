import type { DilSinavi, OgretimDili, OgretimTuru, PuanTuru, Seviye, UniTuru } from "./types";

export const SEVIYE_ADI: Record<Seviye, string> = {
  tezli_yl: "Tezli yüksek lisans",
  tezsiz_yl: "Tezsiz yüksek lisans",
  doktora: "Doktora",
};

export const SEVIYE_KISA: Record<Seviye, string> = {
  tezli_yl: "Tezli YL",
  tezsiz_yl: "Tezsiz YL",
  doktora: "Doktora",
};

export const PUAN_TURU_ADI: Record<PuanTuru, string> = { SAY: "SAY", SOZ: "SÖZ", EA: "EA" };

export const DIL_ADI: Record<OgretimDili, string> = { tr: "Türkçe", en: "İngilizce" };
export const OGRETIM_ADI: Record<OgretimTuru, string> = { orgun: "Örgün", ikinci: "İkinci öğretim", uzaktan: "Uzaktan" };
export const TUR_ADI: Record<UniTuru, string> = { devlet: "Devlet", vakif: "Vakıf" };

export const DIL_SINAVI_ADI: Record<DilSinavi, string> = {
  YDS: "YDS",
  YOKDIL: "YÖKDİL",
  EYDS: "e-YDS",
  TOEFL: "TOEFL iBT",
  DIGER: "Diğer",
};

/**
 * ALES sonuç belgeleri 5 yıl geçerlidir.
 */
export const ALES_GECERLILIK_YIL = 5;

/**
 * ÖSYM Yabancı Dil Sınavları Eşdeğerlikleri, İngilizce, TOEFL iBT -> YDS.
 * Kaynak: ÖSYM eşdeğerlik dokümanı (11.03.2025 güncellemesi).
 * Tablo her yıl yönetim tarafından kontrol edilip güncellenmeli.
 */
export const TOEFL_YDS: Array<[toefl: number, yds: number]> = [
  [120, 100], [114, 95], [108, 90], [102, 85], [96, 80], [90, 75],
  [84, 70], [78, 65], [72, 60], [66, 55], [60, 50], [54, 45], [48, 40],
];

/**
 * Lisans bölümleri: öğrencinin seçtiği bölüm ile ilanlardaki "kabul_bolumler"
 * bu listeden gelir. CSV'de listede olmayan bir ad yazılırsa yükleme ekranı uyarır.
 */
export const BOLUMLER: string[] = [
  "Arkeoloji",
  "Beslenme ve Diyetetik",
  "Bilgisayar Mühendisliği",
  "Biyoloji",
  "Coğrafya",
  "Diş Hekimliği",
  "Eczacılık",
  "Ekonometri",
  "Elektrik-Elektronik Mühendisliği",
  "Endüstri Mühendisliği",
  "Felsefe",
  "Fizik",
  "Fizyoterapi ve Rehabilitasyon",
  "Gazetecilik",
  "Grafik Tasarım",
  "Halkla İlişkiler ve Reklamcılık",
  "Hemşirelik",
  "Hukuk",
  "İç Mimarlık",
  "İktisat",
  "İngiliz Dili ve Edebiyatı",
  "İngilizce Öğretmenliği",
  "İnşaat Mühendisliği",
  "İstatistik",
  "İşletme",
  "Kimya",
  "Kimya Mühendisliği",
  "Makine Mühendisliği",
  "Maliye",
  "Matematik",
  "Matematik Öğretmenliği",
  "Mimarlık",
  "Moleküler Biyoloji ve Genetik",
  "Mütercim-Tercümanlık",
  "Okul Öncesi Öğretmenliği",
  "Psikoloji",
  "Radyo, Televizyon ve Sinema",
  "Rehberlik ve Psikolojik Danışmanlık",
  "Sınıf Öğretmenliği",
  "Siyaset Bilimi ve Kamu Yönetimi",
  "Sosyal Hizmet",
  "Sosyoloji",
  "Şehir ve Bölge Planlama",
  "Tarih",
  "Tıp",
  "Turizm İşletmeciliği",
  "Türk Dili ve Edebiyatı",
  "Uluslararası İlişkiler",
  "Yazılım Mühendisliği",
  "Yönetim Bilişim Sistemleri",
];
