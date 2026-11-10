import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { basvuruDurumu, degerlendir } from "../../core/eslestir";
import { ondalik } from "../../core/metin";
import { DIL_ADI, OGRETIM_ADI, PUAN_TURU_ADI, SEVIYE_ADI, TUR_ADI } from "../../core/sabitler";
import { gunAdi, kisaTarih, uzunTarih } from "../../core/tarih";
import type { Ilan, Kontrol, Profil } from "../../core/types";
import { DurumEtiketi, SartIkonu } from "../bilesenler";
import { konum, ucretMetni } from "../bicim";

/** Profil yoksa ya da program türü farklıysa şartları karşılaştırmasız listeler. */
function duzSartlar(ilan: Ilan): Kontrol[] {
  const k: Kontrol[] = [];
  if (ilan.alesTuru && ilan.alesMin !== null) {
    let m = `ALES-${PUAN_TURU_ADI[ilan.alesTuru]} en az ${ilan.alesMin}`;
    if (ilan.alesMinLisans !== null) m += ` (lisans diplomasıyla başvuranlar için ${ilan.alesMinLisans})`;
    k.push({ alan: "ales", sonuc: "bilgi", metin: m + "." });
  } else k.push({ alan: "ales", sonuc: "bilgi", metin: "ALES şartı yok." });
  k.push({ alan: "dil", sonuc: "bilgi", metin: ilan.dilMin !== null ? `YDS veya eşdeğeri en az ${ilan.dilMin}.` : "Yabancı dil puanı istemiyor." });
  if (ilan.gnoMin !== null) k.push({ alan: "gno", sonuc: "bilgi", metin: `En az ${ondalik(ilan.gnoMin)} not ortalaması.` });
  if (ilan.ozelNot) k.push({ alan: "not", sonuc: "bilgi", metin: ilan.ozelNot });
  return k;
}

export function ProgramDetay({
  ilan,
  profil,
  bugun,
  takipte,
  takipDegistir,
  geriHedef,
}: {
  ilan: Ilan;
  profil: Profil | null;
  bugun: string;
  takipte: boolean;
  takipDegistir: () => void;
  geriHedef: { hash: string; ad: string };
}) {
  const e = profil ? degerlendir(ilan, profil, bugun) : null;
  const { durum, gun } = basvuruDurumu(ilan, bugun);
  const kontroller = e ? e.kontroller : duzSartlar(ilan);
  const eksikSayisi = kontroller.filter((k) => k.sonuc === "eksik").length;

  const olaylar = [
    { ad: "Başvurular açılıyor", tarih: ilan.basvuruBaslangic },
    { ad: "Son başvuru günü", tarih: ilan.basvuruBitis },
    ...(ilan.sinavTarihi ? [{ ad: "Bilim sınavı / mülakat", tarih: ilan.sinavTarihi }] : []),
  ];
  const siradaki = olaylar.findIndex((o) => o.tarih >= bugun);

  const buyukSatir =
    durum === "acik"
      ? { ust: "Son başvuru", tarih: `${kisaTarih(ilan.basvuruBitis)}, ${gunAdi(ilan.basvuruBitis)}`, alt: gun === 0 ? "Bugün son gün" : `${gun} gün kaldı` }
      : durum === "yakinda"
        ? { ust: "Başvurular açılıyor", tarih: `${kisaTarih(ilan.basvuruBaslangic)}, ${gunAdi(ilan.basvuruBaslangic)}`, alt: `${gun} gün sonra · ${kisaTarih(ilan.basvuruBitis)} tarihine kadar açık` }
        : { ust: "Başvurular kapandı", tarih: uzunTarih(ilan.basvuruBitis), alt: "Bir sonraki dönem ilanı yüklendiğinde burada görünür." };

  const ucret = ucretMetni(ilan);

  return (
    <main className="sayfa">
      <a className="geri" href={`#${geriHedef.hash}`} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> {geriHedef.ad}
      </a>
      <div className="detay" style={{ marginTop: 14 }}>
        <header className="detay-bas">
          <p className="detay-ust-satir">
            {SEVIYE_ADI[ilan.seviye]} · {ilan.donem}
          </p>
          <h1>{ilan.program}</h1>
          <p className="detay-uni">{ilan.universite}</p>
          <p className="soluk kucuk">
            {[konum(ilan), DIL_ADI[ilan.dil], OGRETIM_ADI[ilan.ogretim], ilan.ulke === "Türkiye" ? TUR_ADI[ilan.tur] : null].filter(Boolean).join(" · ")}
          </p>
        </header>

        <aside className="detay-yan">
          <div className="kutu durum-kutu">
            <DurumEtiketi e={{ durum, gun, ilan }} />
            <div className="durum-buyuk">
              <span className="soluk kucuk">{buyukSatir.ust}</span>
              <span className="tarih">{buyukSatir.tarih}</span>
              <span className="soluk kucuk">{buyukSatir.alt}</span>
            </div>
            <div className="durum-eylem">
              <button type="button" className={`dugme tam ${takipte ? "secili" : "ana"}`} aria-pressed={takipte} onClick={takipDegistir}>
                {takipte ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                {takipte ? "Takip ediliyor" : "Takip et"}
              </button>
              <a className="dugme ikincil tam" href={ilan.kaynakUrl} target="_blank" rel="noreferrer">
                Resmi ilanı aç <ExternalLink size={16} />
              </a>
            </div>
            <p className="ipucu">Takip ettiğin programların tarihleri Takvim'de toplanır.</p>
          </div>
        </aside>

        <div className="detay-ana">
          <section className="bolum" aria-labelledby="sartlar">
            <h2 id="sartlar">{e ? "Şartlar ve senin durumun" : "Başvuru şartları"}</h2>
            {e && (
              <p className={`sart-ozet ${eksikSayisi ? "eksik" : "tamam"}`}>
                {eksikSayisi === 0
                  ? "Puan ve bölüm şartlarının hepsini karşılıyorsun."
                  : eksikSayisi === 1
                    ? "Bir şart tutmuyor."
                    : `${eksikSayisi} şart tutmuyor.`}
              </p>
            )}
            {profil && !e && (
              <p className="ipucu">Bu program {SEVIYE_ADI[ilan.seviye].toLocaleLowerCase("tr")}; profilinde başka bir program türü seçili olduğu için karşılaştırma yapılmadı.</p>
            )}
            <ul className="sart-liste">
              {kontroller.map((k, i) => (
                <li key={i}>
                  <SartIkonu sonuc={k.sonuc} />
                  <span>{k.metin}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bolum" aria-labelledby="tarihler">
            <h2 id="tarihler">Tarihler</h2>
            <ol className="zaman">
              {olaylar.map((o, i) => (
                <li key={o.ad} className={o.tarih < bugun ? "gecti" : i === siradaki ? "simdi" : ""}>
                  <span className="im" aria-hidden="true" />
                  <div>
                    <div className="zaman-ad">{o.ad}</div>
                    <div className="zaman-tarih">
                      {uzunTarih(o.tarih)}, {gunAdi(o.tarih)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="bolum" aria-labelledby="ilan">
            <h2 id="ilan">İlan bilgileri</h2>
            <dl className="bilgi-tablo">
              <dt>Enstitü</dt>
              <dd>{ilan.enstitu}</dd>
              <dt>Dönem</dt>
              <dd>{ilan.donem}</dd>
              {ilan.kontenjan !== null && (
                <>
                  <dt>Kontenjan</dt>
                  <dd className="sayi">{ilan.kontenjan} kişi</dd>
                </>
              )}
              {ucret && (
                <>
                  <dt>Ücret</dt>
                  <dd className="sayi">{ucret}</dd>
                </>
              )}
              <dt>Kabul edilen bölümler</dt>
              <dd>{ilan.kabulBolumler.length ? ilan.kabulBolumler.join(", ") : "Tüm bölümler"}</dd>
            </dl>
            <div className="kaynak-not">
              <p>Bu bilgiler enstitünün yayımladığı ilandan aktarıldı. Başvurmadan önce resmi ilanı mutlaka oku.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
