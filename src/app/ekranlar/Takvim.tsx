import { ChevronRight } from "lucide-react";
import { SEVIYE_KISA } from "../../core/sabitler";
import { ayBaslik, ayGun, gunAdi, gunFarki } from "../../core/tarih";
import type { Ilan } from "../../core/types";
import { Anahtar } from "../bilesenler";

type OlayTuru = "acilis" | "son" | "sinav";
const TUR_ADI: Record<OlayTuru, string> = { acilis: "Başvuru açılıyor", son: "Son başvuru", sinav: "Sınav / mülakat" };

export function Takvim({
  takipEdilenler,
  bugun,
  hatirlat,
  hatirlatDegistir,
}: {
  takipEdilenler: Ilan[];
  bugun: string;
  hatirlat: boolean;
  hatirlatDegistir: (a: boolean) => void;
}) {
  const olaylar = takipEdilenler
    .flatMap((ilan) => [
      { ilan, tur: "acilis" as OlayTuru, tarih: ilan.basvuruBaslangic },
      { ilan, tur: "son" as OlayTuru, tarih: ilan.basvuruBitis },
      ...(ilan.sinavTarihi ? [{ ilan, tur: "sinav" as OlayTuru, tarih: ilan.sinavTarihi }] : []),
    ])
    .filter((o) => o.tarih >= bugun)
    .sort((a, b) => a.tarih.localeCompare(b.tarih));

  const aylar = new Map<string, typeof olaylar>();
  for (const o of olaylar) {
    const k = ayBaslik(o.tarih);
    aylar.set(k, [...(aylar.get(k) ?? []), o]);
  }
  const bitenler = takipEdilenler.filter((i) => (i.sinavTarihi ?? i.basvuruBitis) < bugun).length;

  return (
    <main className="sayfa">
      <div className="sayfa-bas">
        <h1>Takvim</h1>
        <p className="soluk">Takip ettiğin programların önemli günleri.</p>
      </div>

      <div className="kutu hatirlatma" style={{ maxWidth: 720 }}>
        <Anahtar id="hatirlat" acik={hatirlat} degistir={hatirlatDegistir}>
          <span className="satir-baslik">Son başvurudan 3 gün önce hatırlat</span>
        </Anahtar>
        <p className="ipucu">Hatırlatmalar mobil uygulamada bildirim, web'de e-posta olarak gelir.</p>
      </div>

      {olaylar.length === 0 ? (
        <div className="bos" style={{ maxWidth: 720 }}>
          <h2>Yaklaşan bir tarih yok</h2>
          <p>Programlar listesinde yer imi simgesine dokunarak takip etmeye başla; başvuru ve sınav günleri burada sıralanır.</p>
          <a className="dugme ikincil kucuk-d" href="#programlar">
            Programlara git
          </a>
        </div>
      ) : (
        <div style={{ maxWidth: 720 }}>
          {[...aylar.entries()].map(([ay, liste]) => (
            <section className="ay" key={ay} aria-label={ay}>
              <h2 className="ay-bas">{ay}</h2>
              <div className="kutu">
                {liste.map((o) => {
                  const t = ayGun(o.tarih);
                  const kalan = gunFarki(bugun, o.tarih);
                  return (
                    <a className="olay" key={`${o.ilan.id}-${o.tur}`} href={`#p-${o.ilan.id}`}>
                      <div className="tarih-blok sayi">
                        <span className="g">{t.gun}</span>
                        <span className="a">{gunAdi(o.tarih).slice(0, 3)}</span>
                      </div>
                      <div>
                        <div className={`olay-tur ${o.tur}`}>{TUR_ADI[o.tur]}</div>
                        <div className="satir-baslik">
                          {o.ilan.program} <span className="soluk">· {SEVIYE_KISA[o.ilan.seviye]}</span>
                        </div>
                        <div className="satir-alt">{o.ilan.universite}</div>
                      </div>
                      <div className="olay-kalan sayi">
                        {kalan === 0 ? "Bugün" : kalan === 1 ? "Yarın" : `${kalan} gün`}
                        <ChevronRight size={16} style={{ verticalAlign: "-3px", marginLeft: 4 }} aria-hidden="true" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
          {bitenler > 0 && (
            <p className="veri-notu">
              Takip ettiğin {bitenler} programın tarihleri geçti. Yeni dönem ilanı yüklendiğinde tekrar burada görünür.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
