import { useMemo, useState } from "react";
import { Check, CircleAlert, Search, SlidersHorizontal, X } from "lucide-react";
import { eslestir, type Tercihler } from "../../core/eslestir";
import { aramaAnahtari } from "../../core/metin";
import { SEVIYE_KISA } from "../../core/sabitler";
import type { BasvuruDurumu, ElemeNedeni, Eslesme, Ilan, OgretimTuru, Profil } from "../../core/types";
import { Bolumlu, Cip, DurumEtiketi, YerImi } from "../bilesenler";
import { metaParcalari, profilOzetParcalari } from "../bicim";

const ELEME_METNI: Record<ElemeNedeni, (n: number) => string> = {
  bolum: (n) => `${n} program yalnızca başka bölümlerin mezunlarını kabul ediyor.`,
  ales_yok: (n) => `${n} program, sonucunu girmediğin bir ALES puan türünü istiyor.`,
  ales_dusuk: (n) => `${n} programın ALES şartı puanının 10'dan fazla üstünde.`,
  ales_suresi: (n) => `ALES sonucunun süresi dolduğu için ${n} program listede yok.`,
  dil_yok: (n) => `${n} program yabancı dil puanı istiyor.`,
  dil_dusuk: (n) => `${n} programın dil şartı puanının 15'ten fazla üstünde.`,
  gno: (n) => `${n} program daha yüksek not ortalaması istiyor.`,
  mezuniyet: (n) => `${n} program lisans diplomasıyla doktora başvurusu almıyor.`,
};

export function Programlar({
  profil,
  ilanlar,
  bugun,
  takip,
  takipDegistir,
  tercihKaydet,
}: {
  profil: Profil;
  ilanlar: Ilan[];
  bugun: string;
  takip: string[];
  takipDegistir: (id: string) => void;
  tercihKaydet: (p: Profil) => void;
}) {
  const [sekme, setSekme] = useState<"uygun" | "az">("uygun");
  const [durumlar, setDurumlar] = useState<BasvuruDurumu[]>(["acik", "yakinda"]);
  const [ara, setAra] = useState("");
  const [cekmece, setCekmece] = useState(false);

  const tercih: Tercihler = { sehirler: profil.sehirler, dil: profil.dilTercihi, tur: profil.turTercihi, ogretim: profil.ogretimTercihi };
  // tercih profilden türetildiği için profil bağımlılığı yeterli
  const ozet = useMemo(() => eslestir(ilanlar, profil, tercih, bugun), [ilanlar, profil, bugun]);

  const kaynak = sekme === "uygun" ? ozet.uygun : ozet.azFarkla;
  const anahtar = aramaAnahtari(ara);
  const aranan = anahtar
    ? kaynak.filter((e) => aramaAnahtari(`${e.ilan.program} ${e.ilan.universite} ${e.ilan.sehir} ${e.ilan.enstitu}`).includes(anahtar))
    : kaynak;
  const durumSayisi = (d: BasvuruDurumu) => aranan.filter((e) => e.durum === d).length;
  const liste = aranan.filter((e) => durumlar.includes(e.durum));
  const uygunAcik = ozet.uygun.filter((e) => e.durum !== "kapandi").length;
  const azAcik = ozet.azFarkla.filter((e) => e.durum !== "kapandi").length;

  const aktifFiltre =
    (profil.sehirler.length ? 1 : 0) + (profil.dilTercihi !== "farketmez" ? 1 : 0) + (profil.turTercihi !== "farketmez" ? 1 : 0) + (profil.ogretimTercihi.length ? 1 : 0);

  const durumDegistir = (d: BasvuruDurumu) =>
    setDurumlar((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]));

  const elenenler = Object.entries(ozet.elenen) as Array<[ElemeNedeni, number]>;

  return (
    <main className="sayfa">
      <div className="sayfa-bas">
        <h1>{sekme === "uygun" ? "Sana uygun programlar" : "Az farkla kaçanlar"}</h1>
        <p className="ozet-satir">
          {profilOzetParcalari(profil).map((p, i) => (
            <span key={p} style={{ display: "contents" }}>
              {i > 0 && <span className="nokta" aria-hidden="true" />}
              <span>{p}</span>
            </span>
          ))}
          <a href="#profil" className="kucuk">
            Düzenle
          </a>
        </p>
      </div>

      <div className="programlar-duzen">
        <aside className="yan" aria-label="Filtreler">
          <FiltrePaneli profil={profil} ilanlar={ilanlar} kaydet={tercihKaydet} />
        </aside>

        <section>
          <div className="liste-ust">
            <Bolumlu
              etiket="Liste"
              deger={sekme}
              degistir={setSekme}
              secenekler={[
                { deger: "uygun", ad: "Şartları tutanlar", adet: uygunAcik },
                { deger: "az", ad: "Az farkla", adet: azAcik },
              ]}
            />
            <div className="arama-satir">
              <div className="arama">
                <Search size={18} />
                <label htmlFor="program-ara" className="sr">
                  Program ara
                </label>
                <input id="program-ara" className="girdi" placeholder="Program veya üniversite ara" value={ara} onChange={(e) => setAra(e.target.value)} />
              </div>
              <button type="button" className="dugme ikincil filtre-ac" onClick={() => setCekmece(true)} aria-label="Filtreler">
                <SlidersHorizontal size={18} />
                {aktifFiltre > 0 && <span className="rozet">{aktifFiltre}</span>}
              </button>
            </div>
            <div className="cip-grup" role="group" aria-label="Başvuru durumu">
              <Cip secili={durumlar.includes("acik")} onClick={() => durumDegistir("acik")} adet={durumSayisi("acik")}>
                Açık
              </Cip>
              <Cip secili={durumlar.includes("yakinda")} onClick={() => durumDegistir("yakinda")} adet={durumSayisi("yakinda")}>
                Yakında açılacak
              </Cip>
              <Cip secili={durumlar.includes("kapandi")} onClick={() => durumDegistir("kapandi")} adet={durumSayisi("kapandi")}>
                Kapanan
              </Cip>
            </div>
          </div>

          {sekme === "az" && liste.length > 0 && (
            <p className="soluk kucuk" style={{ marginBottom: 12 }}>
              Bu programlarda bir ya da iki puan şartı tutmuyor. Puanını yükseltirsen başvurabilirsin.
            </p>
          )}

          {liste.length ? (
            <div className="liste">
              {liste.map((e) => (
                <ProgramKarti key={e.ilan.id} e={e} takipte={takip.includes(e.ilan.id)} takipDegistir={() => takipDegistir(e.ilan.id)} />
              ))}
            </div>
          ) : (
            <div className="bos">
              <h2>Bu filtrelerle program yok</h2>
              <p>
                {kaynak.length
                  ? "Başvuru durumu seçimini genişletmeyi ya da aramayı temizlemeyi dene."
                  : aktifFiltre
                    ? "Şehir veya diğer tercihlerini genişletirsen daha fazla program görebilirsin."
                    : "Şu an yüklü ilanlar arasında puanlarına uyan program yok."}
              </p>
              {aktifFiltre > 0 && !kaynak.length && (
                <button
                  type="button"
                  className="dugme ikincil kucuk-d"
                  onClick={() => tercihKaydet({ ...profil, sehirler: [], dilTercihi: "farketmez", turTercihi: "farketmez", ogretimTercihi: [] })}
                >
                  Tercihleri temizle
                </button>
              )}
            </div>
          )}

          {sekme === "uygun" && elenenler.length > 0 && (
            <div className="elenen-not">
              {elenenler.map(([n, adet]) => (
                <p key={n}>{ELEME_METNI[n](adet)}</p>
              ))}
            </div>
          )}
        </section>
      </div>

      {cekmece && (
        <>
          <div className="cekmece-arka" onClick={() => setCekmece(false)} />
          <div className="cekmece" role="dialog" aria-modal="true" aria-label="Filtreler">
            <div className="cekmece-tutamak" />
            <div className="cekmece-ust">
              <h2>Filtreler</h2>
              <button type="button" className="ikon-dugme" onClick={() => setCekmece(false)} aria-label="Kapat">
                <X size={18} />
              </button>
            </div>
            <FiltrePaneli profil={profil} ilanlar={ilanlar} kaydet={tercihKaydet} />
            <div className="cekmece-alt">
              <button type="button" className="dugme ana tam" onClick={() => setCekmece(false)}>
                {liste.length} programı göster
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export function ProgramKarti({ e, takipte, takipDegistir }: { e: Eslesme; takipte: boolean; takipDegistir: () => void }) {
  const kisalar = e.kontroller.filter((k) => k.kisa && (k.alan === "ales" || k.alan === "dil" || k.alan === "gno"));
  return (
    <article className="kart">
      <div className="kart-ust">
        <DurumEtiketi e={e} />
        <YerImi takipte={takipte} onClick={takipDegistir} ad={`${e.ilan.universite} ${e.ilan.program}`} />
      </div>
      <div>
        <h2 className="kart-uni">
          <a href={`#p-${e.ilan.id}`}>{e.ilan.universite}</a>
        </h2>
        <p className="kart-program">
          {e.ilan.program} <span className="soluk">· {SEVIYE_KISA[e.ilan.seviye]}</span>
        </p>
      </div>
      <p className="kart-meta">
        {metaParcalari(e.ilan).map((m) => (
          <span key={m}>{m}</span>
        ))}
      </p>
      <div className="kisa-liste">
        {kisalar.map((k, i) => (
          <span key={i} className={`kisa ${k.sonuc}`}>
            {k.sonuc === "eksik" ? <CircleAlert size={15} /> : <Check size={15} strokeWidth={2.5} />}
            {k.kisa}
          </span>
        ))}
      </div>
    </article>
  );
}

function FiltrePaneli({ profil, ilanlar, kaydet }: { profil: Profil; ilanlar: Ilan[]; kaydet: (p: Profil) => void }) {
  const sehirler = useMemo(() => {
    const m = new Map<string, { n: number; ulke: string }>();
    for (const i of ilanlar) {
      if (i.seviye !== profil.seviye) continue;
      const x = m.get(i.sehir) ?? { n: 0, ulke: i.ulke };
      x.n++;
      m.set(i.sehir, x);
    }
    return [...m.entries()].sort((a, b) => Number(a[1].ulke !== "Türkiye") - Number(b[1].ulke !== "Türkiye") || b[1].n - a[1].n || a[0].localeCompare(b[0], "tr"));
  }, [ilanlar, profil.seviye]);

  const sehirDegistir = (s: string) =>
    kaydet({ ...profil, sehirler: profil.sehirler.includes(s) ? profil.sehirler.filter((x) => x !== s) : [...profil.sehirler, s] });
  const ogretimDegistir = (o: OgretimTuru) =>
    kaydet({ ...profil, ogretimTercihi: profil.ogretimTercihi.includes(o) ? profil.ogretimTercihi.filter((x) => x !== o) : [...profil.ogretimTercihi, o] });

  return (
    <div className="filtre-panel">
      <div>
        <span className="alan-baslik">Şehir</span>
        <div className="cip-grup">
          <Cip secili={profil.sehirler.length === 0} onClick={() => kaydet({ ...profil, sehirler: [] })}>
            Hepsi
          </Cip>
          {sehirler.map(([s, { n, ulke }]) => (
            <Cip key={s} secili={profil.sehirler.includes(s)} onClick={() => sehirDegistir(s)} adet={n}>
              {ulke === "Türkiye" ? s : `${s}, ${ulke}`}
            </Cip>
          ))}
        </div>
      </div>
      <div>
        <span className="alan-baslik">Eğitim dili</span>
        <Bolumlu
          etiket="Eğitim dili"
          deger={profil.dilTercihi}
          degistir={(d) => kaydet({ ...profil, dilTercihi: d })}
          secenekler={[
            { deger: "farketmez", ad: "Hepsi" },
            { deger: "tr", ad: "Türkçe" },
            { deger: "en", ad: "İngilizce" },
          ]}
        />
      </div>
      <div>
        <span className="alan-baslik">Üniversite</span>
        <Bolumlu
          etiket="Üniversite türü"
          deger={profil.turTercihi}
          degistir={(d) => kaydet({ ...profil, turTercihi: d })}
          secenekler={[
            { deger: "farketmez", ad: "Hepsi" },
            { deger: "devlet", ad: "Devlet" },
            { deger: "vakif", ad: "Vakıf" },
          ]}
        />
      </div>
      <div>
        <span className="alan-baslik">Öğretim şekli</span>
        <div className="cip-grup">
          {(
            [
              ["orgun", "Örgün"],
              ["ikinci", "İkinci öğretim"],
              ["uzaktan", "Uzaktan"],
            ] as Array<[OgretimTuru, string]>
          ).map(([o, ad]) => (
            <Cip key={o} secili={profil.ogretimTercihi.includes(o)} onClick={() => ogretimDegistir(o)}>
              {ad}
            </Cip>
          ))}
        </div>
      </div>
    </div>
  );
}
