import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ilanlariOku, sablonMetni } from "./csv";
import { degerlendir, eslestir, ydsKarsiligi } from "./eslestir";
import { kisaTarihTa, tarihCoz } from "./tarih";
import type { Profil } from "./types";

const csv = readFileSync(new URL("../data/ornek-ilanlar.csv", import.meta.url), "utf8");
const BUGUN = "2026-11-08";

const profil: Profil = {
  seviye: "tezli_yl",
  mezuniyet: "lisans",
  alesYok: false,
  ales: { SAY: 61, SOZ: 68, EA: 72 },
  alesYili: 2025,
  dilSinavi: "YDS",
  dilPuani: 62,
  bolum: "Psikoloji",
  gno: 3.12,
  sehirler: ["İstanbul", "Ankara"],
  dilTercihi: "farketmez",
  turTercihi: "farketmez",
  ogretimTercihi: [],
};
const tercih = { sehirler: profil.sehirler, dil: profil.dilTercihi, tur: profil.turTercihi, ogretim: profil.ogretimTercihi };

describe("CSV", () => {
  const sonuc = ilanlariOku(csv);
  it("örnek veri hatasız okunur", () => {
    expect(sonuc.sorunlar).toEqual([]);
    expect(sonuc.ilanlar.length).toBe(sonuc.satirSayisi);
  });
  it("kimlikler tekildir ve hash için güvenlidir", () => {
    const ids = sonuc.ilanlar.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });
  it("hatalı satırları satır numarasıyla bildirir", () => {
    const bozuk = [
      sablonMetni().split("\n")[0],
      "A Üni;İzmir;;özel;E;P;yüksek lisans;türkçe;örgün;;2026-2027 Bahar;31.02.2026;01.03.2026;;;EA;;;;5;Psikolji;;https://a.edu.tr",
    ].join("\n");
    const s = ilanlariOku(bozuk);
    expect(s.ilanlar).toHaveLength(0);
    expect(s.hataliSatirlar).toEqual([2]);
    const sutunlar = s.sorunlar.map((x) => x.sutun);
    expect(sutunlar).toEqual(expect.arrayContaining(["tur", "seviye", "basvuru_baslangic", "ales_min", "gno_min", "kabul_bolumler"]));
  });
  it("şablon kendi kendini doğrular", () => {
    expect(ilanlariOku(sablonMetni()).sorunlar).toEqual([]);
  });
});

describe("eşleştirme", () => {
  const { ilanlar } = ilanlariOku(csv);
  const ozet = eslestir(ilanlar, profil, tercih, BUGUN);
  const ad = (e: { ilan: { universite: string; program: string } }) => `${e.ilan.universite} / ${e.ilan.program}`;

  it("uygun programlar", () => {
    expect(ozet.uygun.map(ad)).toEqual([
      "Hacettepe Üniversitesi / Sosyal Psikoloji",
      "Marmara Üniversitesi / İşletme",
      "İstanbul Bilgi Üniversitesi / Klinik Psikoloji",
      "Ankara Hacı Bayram Veli Üniversitesi / Kamu Yönetimi",
      "Gazi Üniversitesi / Eğitim Yönetimi",
      "İstanbul Üniversitesi / Uluslararası İlişkiler",
      "Gazi Üniversitesi / Rehberlik ve Psikolojik Danışmanlık",
    ]);
    expect(ozet.uygun[0].durum).toBe("acik");
    expect(ozet.uygun[0].gun).toBe(8);
    expect(ozet.uygun.at(-1)!.durum).toBe("kapandi");
  });

  it("az farkla kaçanlar", () => {
    expect(ozet.azFarkla.map(ad)).toEqual([
      "Özyeğin Üniversitesi / Deneysel Psikoloji",
      "İstanbul Teknik Üniversitesi / Veri Bilimi",
      "Boğaziçi Üniversitesi / Klinik Psikoloji",
      "Bilkent Üniversitesi / Uluslararası İlişkiler",
    ]);
    const itu = ozet.azFarkla[1];
    expect(itu.kontroller.find((k) => k.alan === "ales")).toMatchObject({ sonuc: "eksik", fark: 4 });
  });

  it("bölüm şartıyla elenenleri sayar", () => {
    expect(ozet.elenen.bolum).toBe(6);
  });

  it("doktora: lisans diplomasıyla 80 ALES ister", () => {
    const sabanci = ilanlar.find((i) => i.universite.startsWith("Sabancı"))!;
    const dr: Profil = { ...profil, seviye: "doktora", bolum: "Bilgisayar Mühendisliği", ales: { SAY: 78 }, dilSinavi: "TOEFL", dilPuani: 100 };
    const e = degerlendir(sabanci, dr, BUGUN)!;
    expect(e.kategori).toBe("az_farkla");
    expect(e.kontroller.find((k) => k.alan === "ales")?.fark).toBe(2);
    expect(e.kontroller.find((k) => k.alan === "dil")?.sonuc).toBe("tamam");
    const ylIle = degerlendir(sabanci, { ...dr, mezuniyet: "yl" }, BUGUN)!;
    expect(ylIle.kategori).toBe("uygun");
  });

  it("ALES süresi dolmuşsa eler", () => {
    const marmara = ilanlar.find((i) => i.universite.startsWith("Marmara") && i.seviye === "tezli_yl")!;
    expect(degerlendir(marmara, { ...profil, alesYili: 2020 }, BUGUN)?.elemeNedeni).toBe("ales_suresi");
  });
});

describe("yardımcılar", () => {
  it("TOEFL iBT -> YDS", () => {
    expect(ydsKarsiligi({ dilSinavi: "TOEFL", dilPuani: 84 })).toBe(70);
    expect(ydsKarsiligi({ dilSinavi: "TOEFL", dilPuani: 89 })).toBe(70);
    expect(ydsKarsiligi({ dilSinavi: "TOEFL", dilPuani: 40 })).toBeNull();
  });
  it("tarih", () => {
    expect(tarihCoz("05.01.2027")).toBe("2027-01-05");
    expect(tarihCoz("31.02.2026")).toBeNull();
    expect(kisaTarihTa("2027-01-05")).toBe("5 Ocak'ta");
    expect(kisaTarihTa("2026-09-09")).toBe("9 Eylül'de");
  });
});
