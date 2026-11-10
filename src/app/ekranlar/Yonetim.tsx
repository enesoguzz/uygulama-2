import { useState } from "react";
import { Check, Copy, FileSpreadsheet, RotateCcw, Upload } from "lucide-react";
import ornekCsv from "../../data/ornek-ilanlar.csv?raw";
import { ilanlariOku, sablonMetni, SUTUNLAR, type CsvSonucu } from "../../core/csv";
import { basvuruDurumu } from "../../core/eslestir";
import { PUAN_TURU_ADI, SEVIYE_KISA } from "../../core/sabitler";
import { kisaTarih, uzunTarih } from "../../core/tarih";
import type { Ilan, VeriSeti } from "../../core/types";
import { DurumEtiketi } from "../bilesenler";

async function dosyaMetni(f: File): Promise<string> {
  const buf = await f.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    // Türkçe Windows'ta Excel'in "CSV" çıktısı Windows-1254 kodlamasıyla gelir
    return new TextDecoder("windows-1254").decode(buf);
  }
}

/** Doğrulamayı göstermek için içinde iki hatalı satır olan örnek dosya. */
function hataliOrnek(): string {
  const satirlar = ornekCsv.trim().split("\n");
  satirlar.splice(
    4,
    0,
    "Yeditepe Üniversitesi;İstanbul;vakif;Sosyal Bilimler Enstitüsü;Psikoloji;tezli yl;türkçe;örgün;185.000;2026-2027 Bahar;15.11.2026;10.11.2026;;12;EA;;;55;;Psikoloji;;https://yeditepe.edu.tr;",
    "Ankara Üniversitesi;Ankara;devlet;Eğitim Bilimleri Enstitüsü;Eğitim Programları;yüksek lisans;türkçe;örgün;;2026-2027 Bahar;01.12.2026;12.12.2026;;10;EA;55;;50;;Eğitim Bilimleri;;https://www.ankara.edu.tr;",
  );
  return satirlar.join("\n");
}

function alesKisa(i: Ilan) {
  if (!i.alesTuru) return "—";
  return `${PUAN_TURU_ADI[i.alesTuru]} ${i.alesMin ?? ""}${i.alesMinLisans !== null ? ` / ${i.alesMinLisans}` : ""}`;
}

export function Yonetim({ veri, bugun, yayinla }: { veri: VeriSeti; bugun: string; yayinla: (v: VeriSeti | null) => void }) {
  const [sonuc, setSonuc] = useState<CsvSonucu | null>(null);
  const [dosyaAdi, setDosyaAdi] = useState("");
  const [kopya, setKopya] = useState<"" | "tamam" | "olmadi">("");
  const [uzerinde, setUzerinde] = useState(false);
  const [yayinlandi, setYayinlandi] = useState(false);

  const oku = async (f: File | undefined) => {
    if (!f) return;
    setDosyaAdi(f.name);
    setYayinlandi(false);
    setSonuc(ilanlariOku(await dosyaMetni(f)));
  };

  const donemler = new Map<string, number>();
  for (const i of veri.ilanlar) donemler.set(i.donem, (donemler.get(i.donem) ?? 0) + 1);
  const hatalar = sonuc?.sorunlar.filter((s) => s.seviye === "hata") ?? [];
  const uyarilar = sonuc?.sorunlar.filter((s) => s.seviye === "uyari") ?? [];

  return (
    <main className="sayfa">
      <div className="yonetim">
        <div className="sayfa-bas" style={{ marginBottom: 0 }}>
          <h1>İlan verisi</h1>
          <p className="soluk">Her dönem başında ilanları tabloya gir, buradan yükle. Öğrenciler yeni listeyi hemen görür.</p>
        </div>

        <section className="kutu yayinda" aria-labelledby="yayinda-baslik">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h2 id="yayinda-baslik">Yayındaki veri</h2>
            <span className="soluk kucuk">
              {veri.kaynak === "ornek" ? "Örnek veri (gerçek ilanlar değil)" : "Senin yüklediğin dosya"} · {uzunTarih(veri.yuklemeTarihi)}
            </span>
          </div>
          <div className="yayinda-sayilar">
            <div>
              <b>{veri.ilanlar.length}</b>
              <span>program</span>
            </div>
            <div>
              <b>{new Set(veri.ilanlar.map((i) => i.universite)).size}</b>
              <span>üniversite</span>
            </div>
            <div>
              <b>{veri.ilanlar.filter((i) => basvuruDurumu(i, bugun).durum === "acik").length}</b>
              <span>başvurusu açık</span>
            </div>
          </div>
          <p className="soluk kucuk">
            {[...donemler.entries()].map(([d, n]) => `${d}: ${n}`).join(" · ")}
          </p>
          {veri.kaynak === "yuklenen" && (
            <div>
              <button type="button" className="dugme ikincil kucuk-d" onClick={() => yayinla(null)}>
                <RotateCcw size={16} /> Örnek veriye dön
              </button>
            </div>
          )}
        </section>

        <section className="kutu adim" aria-labelledby="adim1">
          <div className="adim-bas">
            <span className="adim-no">1</span>
            <div style={{ display: "grid", gap: 4 }}>
              <h2 id="adim1">Tabloyu hazırla</h2>
              <p className="soluk">
                Her satır bir program. Başlıkları değiştirme. Excel veya Google E-Tablolar'da doldurup <b>CSV</b> olarak kaydet. Tarihleri <code>GG.AA.YYYY</code>, birden fazla bölümü{" "}
                <code>|</code> ile ayırarak yaz.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              className="dugme ikincil kucuk-d"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(sablonMetni());
                  setKopya("tamam");
                } catch {
                  setKopya("olmadi");
                }
              }}
            >
              {kopya === "tamam" ? <Check size={16} /> : <Copy size={16} />}
              {kopya === "tamam" ? "Şablon kopyalandı" : "Şablonu kopyala"}
            </button>
            {kopya === "tamam" && <span className="ipucu">Boş bir tabloya yapıştır; ilk satır başlıklar.</span>}
            {kopya === "olmadi" && <span className="hata-metni">Kopyalanamadı. Sütun adlarını aşağıdaki listeden alabilirsin.</span>}
          </div>
          <details>
            <summary>{SUTUNLAR.length} sütunun açıklaması</summary>
            <div className="tablo-kap">
              <table>
                <thead>
                  <tr>
                    <th>Sütun</th>
                    <th>Ne yazılır</th>
                    <th>Örnek</th>
                  </tr>
                </thead>
                <tbody>
                  {SUTUNLAR.map((s) => (
                    <tr key={s.ad}>
                      <td>
                        <code>{s.ad}</code>
                        {s.zorunlu && <span className="soluk kucuk"> · zorunlu</span>}
                      </td>
                      <td>{s.aciklama}</td>
                      <td className="soluk">{s.ornek || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <section className="kutu adim" aria-labelledby="adim2">
          <div className="adim-bas">
            <span className="adim-no">2</span>
            <div style={{ display: "grid", gap: 4 }}>
              <h2 id="adim2">Dosyayı yükle ve kontrol et</h2>
              <p className="soluk">Dosya yayına alınmadan önce her satır kontrol edilir. Hatalar Excel'deki satır numarasıyla gösterilir.</p>
            </div>
          </div>
          <label
            className={`birak${uzerinde ? " uzerinde" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setUzerinde(true);
            }}
            onDragLeave={() => setUzerinde(false)}
            onDrop={(e) => {
              e.preventDefault();
              setUzerinde(false);
              oku(e.dataTransfer.files[0]);
            }}
          >
            <Upload size={22} />
            <span>
              <b>CSV dosyasını buraya bırak</b> ya da seçmek için tıkla
            </span>
            <span className="kucuk">UTF-8 ve Excel'in Türkçe CSV çıktısı okunur</span>
            <input type="file" accept=".csv,.txt,text/csv" className="sr" onChange={(e) => oku(e.target.files?.[0])} />
          </label>
          <div>
            <button
              type="button"
              className="dugme duz kucuk"
              onClick={() => {
                setDosyaAdi("hatali-ornek.csv");
                setYayinlandi(false);
                setSonuc(ilanlariOku(hataliOrnek()));
              }}
            >
              Hatalı satırları olan örnek bir dosyayla dene
            </button>
          </div>

          {sonuc && (
            <div style={{ display: "grid", gap: 14 }}>
              <p style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <FileSpreadsheet size={18} /> <b>{dosyaAdi}</b>
              </p>
              <div className="rapor sayi">
                <span>{sonuc.satirSayisi} satır okundu</span>
                <span className="iyi">{sonuc.ilanlar.length} program hazır</span>
                {sonuc.hataliSatirlar.length > 0 && <span className="kotu">{sonuc.hataliSatirlar.length} satır hatalı</span>}
                {uyarilar.length > 0 && <span className="orta">{uyarilar.length} uyarı</span>}
              </div>
              {sonuc.sorunlar.length > 0 && (
                <div className="tablo-kap">
                  <table>
                    <thead>
                      <tr>
                        <th>Satır</th>
                        <th>Sütun</th>
                        <th>Sorun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...hatalar, ...uyarilar].map((s, i) => (
                        <tr key={i}>
                          <td className="sayi">{s.satir}</td>
                          <td>
                            <code>{s.sutun}</code>
                          </td>
                          <td className={s.seviye}>
                            {s.seviye === "hata" ? "Hata: " : "Uyarı: "}
                            <span style={{ fontWeight: 400, color: "var(--ink)" }}>{s.mesaj}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="kutu adim" aria-labelledby="adim3">
          <div className="adim-bas">
            <span className="adim-no">3</span>
            <div style={{ display: "grid", gap: 4 }}>
              <h2 id="adim3">Yayınla</h2>
              <p className="soluk">
                {sonuc
                  ? sonuc.hataliSatirlar.length
                    ? `Hatalı ${sonuc.hataliSatirlar.length} satır yayına alınmaz. İstersen önce düzeltip dosyayı yeniden yükle.`
                    : "Dosyada hata yok. Yayınlayınca mevcut liste bununla değişir."
                  : "Bir dosya yüklediğinde burada yayınlayabilirsin."}
              </p>
            </div>
          </div>
          {yayinlandi ? (
            <p className="basari" role="status">
              <Check size={18} /> Yayınlandı. Öğrenciler {veri.ilanlar.length} programlık yeni listeyi görüyor.
            </p>
          ) : (
            <div>
              <button
                type="button"
                className="dugme ana"
                disabled={!sonuc || sonuc.ilanlar.length === 0}
                onClick={() => {
                  if (!sonuc) return;
                  yayinla({ ilanlar: sonuc.ilanlar, kaynak: "yuklenen", yuklemeTarihi: bugun });
                  setYayinlandi(true);
                }}
              >
                {sonuc ? `${sonuc.ilanlar.length} programı yayınla` : "Yayınla"}
              </button>
            </div>
          )}
        </section>

        <section className="bolum" aria-labelledby="liste-baslik">
          <h2 id="liste-baslik">Yayındaki programlar</h2>
          <div className="tablo-kap">
            <table>
              <thead>
                <tr>
                  <th>Üniversite</th>
                  <th>Program</th>
                  <th>Başvuru</th>
                  <th>ALES</th>
                  <th>Dil</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {veri.ilanlar.map((i) => {
                  const d = basvuruDurumu(i, bugun);
                  return (
                    <tr key={i.id}>
                      <td>{i.universite}</td>
                      <td>
                        {i.program} <span className="soluk">· {SEVIYE_KISA[i.seviye]}</span>
                      </td>
                      <td className="sayi" style={{ whiteSpace: "nowrap" }}>
                        {kisaTarih(i.basvuruBaslangic)} – {kisaTarih(i.basvuruBitis)}
                      </td>
                      <td className="sayi" style={{ whiteSpace: "nowrap" }}>{alesKisa(i)}</td>
                      <td className="sayi">{i.dilMin ?? "—"}</td>
                      <td>
                        <DurumEtiketi e={{ ...d, ilan: i }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
