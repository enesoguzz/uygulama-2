import { useMemo, useState } from "react";
import { ArrowLeft, Check, Search } from "lucide-react";
import { ydsKarsiligi } from "../../core/eslestir";
import { aramaAnahtari, ondalik, sayiCoz } from "../../core/metin";
import { ALES_GECERLILIK_YIL, BOLUMLER, DIL_SINAVI_ADI } from "../../core/sabitler";
import type { DilSinavi, Ilan, OgretimTuru, Profil, PuanTuru, Seviye } from "../../core/types";
import { Bolumlu, Cip, Secenek } from "../bilesenler";

export const ADIMLAR = ["Program türü", "ALES", "Yabancı dil", "Lisans", "Konum ve tercihler"] as const;

interface Taslak {
  seviye: Seviye | null;
  mezuniyet: "lisans" | "yl";
  alesYok: boolean;
  ales: Record<PuanTuru, string>;
  alesYili: number | null;
  dilSinavi: DilSinavi | null;
  dilYok: boolean;
  dilPuani: string;
  bolum: string;
  gno: string;
  sehirler: string[];
  dilTercihi: Profil["dilTercihi"];
  turTercihi: Profil["turTercihi"];
  ogretimTercihi: OgretimTuru[];
}

function taslakYap(p: Profil | null): Taslak {
  return {
    seviye: p?.seviye ?? null,
    mezuniyet: p?.mezuniyet ?? "yl",
    alesYok: p?.alesYok ?? false,
    ales: {
      SAY: p?.ales.SAY?.toString().replace(".", ",") ?? "",
      SOZ: p?.ales.SOZ?.toString().replace(".", ",") ?? "",
      EA: p?.ales.EA?.toString().replace(".", ",") ?? "",
    },
    alesYili: p?.alesYili ?? null,
    dilSinavi: p?.dilSinavi ?? null,
    dilYok: p ? p.dilSinavi === null : false,
    dilPuani: p?.dilPuani?.toString().replace(".", ",") ?? "",
    bolum: p?.bolum ?? "",
    gno: p?.gno !== null && p?.gno !== undefined ? ondalik(p.gno) : "",
    sehirler: p?.sehirler ?? [],
    dilTercihi: p?.dilTercihi ?? "farketmez",
    turTercihi: p?.turTercihi ?? "farketmez",
    ogretimTercihi: p?.ogretimTercihi ?? [],
  };
}

type Hatalar = Record<string, string>;

function dogrula(adim: number, t: Taslak): Hatalar {
  const h: Hatalar = {};
  if (adim === 0 && !t.seviye) h.seviye = "Devam etmek için bir program türü seç.";
  if (adim === 1 && !t.alesYok) {
    const dolu = (Object.keys(t.ales) as PuanTuru[]).filter((k) => t.ales[k].trim() !== "");
    if (!dolu.length) h.ales = "En az bir puan gir ya da “ALES'e girmedim” seçeneğini işaretle.";
    for (const k of dolu) {
      const n = sayiCoz(t.ales[k]);
      if (n === null || Number.isNaN(n) || n < 0 || n > 100) h[`ales-${k}`] = "0 ile 100 arasında olmalı.";
    }
    if (dolu.length && !t.alesYili) h.alesYili = "Sınava girdiğin yılı seç.";
  }
  if (adim === 2 && !t.dilYok) {
    if (!t.dilSinavi) h.dil = "Sınav türünü seç ya da “Dil puanım yok” de.";
    else {
      const n = sayiCoz(t.dilPuani);
      const ust = t.dilSinavi === "TOEFL" ? 120 : 100;
      if (n === null) h.dilPuani = "Puanını gir.";
      else if (Number.isNaN(n) || n < 0 || n > ust) h.dilPuani = `0 ile ${ust} arasında olmalı.`;
    }
  }
  if (adim === 3) {
    if (!t.bolum) h.bolum = "Mezun olduğun (ya da okuduğun) bölümü seç.";
    if (t.gno.trim()) {
      const n = sayiCoz(t.gno);
      if (n === null || Number.isNaN(n) || n < 0 || n > 4) h.gno = "4'lük sistemde gir; 0 ile 4 arasında olmalı.";
    }
  }
  return h;
}

function profilYap(t: Taslak): Profil {
  const ales: Partial<Record<PuanTuru, number>> = {};
  if (!t.alesYok) for (const k of ["SAY", "SOZ", "EA"] as PuanTuru[]) if (t.ales[k].trim()) ales[k] = sayiCoz(t.ales[k])!;
  return {
    seviye: t.seviye!,
    mezuniyet: t.mezuniyet,
    alesYok: t.alesYok || Object.keys(ales).length === 0,
    ales,
    alesYili: t.alesYok ? null : t.alesYili,
    dilSinavi: t.dilYok ? null : t.dilSinavi,
    dilPuani: t.dilYok || !t.dilSinavi ? null : sayiCoz(t.dilPuani),
    bolum: t.bolum,
    gno: t.gno.trim() ? sayiCoz(t.gno) : null,
    sehirler: t.sehirler,
    dilTercihi: t.dilTercihi,
    turTercihi: t.turTercihi,
    ogretimTercihi: t.ogretimTercihi,
  };
}

export function Sihirbaz({
  profil,
  ilanlar,
  buYil,
  tekAdim,
  kaydet,
  vazgec,
}: {
  profil: Profil | null;
  ilanlar: Ilan[];
  buYil: number;
  tekAdim?: number;
  kaydet: (p: Profil) => void;
  vazgec: () => void;
}) {
  const [t, setT] = useState<Taslak>(() => taslakYap(profil));
  const [adim, setAdim] = useState(tekAdim ?? 0);
  const [hatalar, setHatalar] = useState<Hatalar>({});
  const duzenleme = tekAdim !== undefined;
  const sonAdim = adim === ADIMLAR.length - 1;

  const guncelle = (parca: Partial<Taslak>) => {
    setT((x) => ({ ...x, ...parca }));
    setHatalar({});
  };

  const ileri = () => {
    const h = dogrula(adim, t);
    setHatalar(h);
    if (Object.keys(h).length) return;
    if (duzenleme || sonAdim) kaydet(profilYap(t));
    else {
      setAdim(adim + 1);
      window.scrollTo({ top: 0 });
    }
  };
  const geri = () => {
    if (duzenleme || adim === 0) vazgec();
    else {
      setAdim(adim - 1);
      setHatalar({});
    }
  };

  return (
    <main className="sayfa menusuz">
      <form
        className="sihirbaz"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          ileri();
        }}
      >
        <div className="ilerleme">
          <div className="ilerleme-ust">
            <button type="button" className="geri" onClick={geri}>
              <ArrowLeft size={16} /> {duzenleme || adim === 0 ? "Vazgeç" : "Geri"}
            </button>
            {!duzenleme && (
              <span className="kucuk soluk sayi">
                Adım {adim + 1} / {ADIMLAR.length}
              </span>
            )}
          </div>
          {!duzenleme && (
            <div className="ilerleme-cubuk" aria-hidden="true">
              <span style={{ width: `${((adim + 1) / ADIMLAR.length) * 100}%` }} />
            </div>
          )}
        </div>

        {adim === 0 && <AdimSeviye t={t} guncelle={guncelle} hatalar={hatalar} />}
        {adim === 1 && <AdimAles t={t} guncelle={guncelle} hatalar={hatalar} buYil={buYil} />}
        {adim === 2 && <AdimDil t={t} guncelle={guncelle} hatalar={hatalar} />}
        {adim === 3 && <AdimLisans t={t} guncelle={guncelle} hatalar={hatalar} />}
        {adim === 4 && <AdimKonum t={t} guncelle={guncelle} ilanlar={ilanlar} />}

        <div className="sihirbaz-alt">
          <span />
          <button type="submit" className="dugme ana">
            {duzenleme ? "Kaydet" : sonAdim ? "Programları göster" : "Devam"}
          </button>
        </div>
      </form>
    </main>
  );
}

type AdimProps = { t: Taslak; guncelle: (p: Partial<Taslak>) => void; hatalar: Hatalar };

function AdimSeviye({ t, guncelle, hatalar }: AdimProps) {
  return (
    <>
      <div className="soru">
        <h1>Hangi programa başvurmak istiyorsun?</h1>
      </div>
      <div className="secenekler" role="radiogroup" aria-label="Program türü">
        <Secenek secili={t.seviye === "tezli_yl"} onClick={() => guncelle({ seviye: "tezli_yl" })} baslik="Tezli yüksek lisans" alt="Tez yazarsın; akademik kariyer ve doktora için gerekir." />
        <Secenek secili={t.seviye === "tezsiz_yl"} onClick={() => guncelle({ seviye: "tezsiz_yl" })} baslik="Tezsiz yüksek lisans" alt="Ders ve dönem projesiyle biter; çoğu ALES istemez." />
        <Secenek secili={t.seviye === "doktora"} onClick={() => guncelle({ seviye: "doktora" })} baslik="Doktora" />
      </div>
      {t.seviye === "doktora" && (
        <div className="alan">
          <span className="alan-baslik">Doktoraya hangi diplomayla başvuracaksın?</span>
          <Bolumlu
            etiket="Diploma"
            deger={t.mezuniyet}
            degistir={(m) => guncelle({ mezuniyet: m })}
            secenekler={[
              { deger: "yl", ad: "Tezli yüksek lisans" },
              { deger: "lisans", ad: "Lisans" },
            ]}
          />
          <p className="ipucu">Lisansla doktoraya başvuranlardan genelde daha yüksek ALES puanı istenir.</p>
        </div>
      )}
      {hatalar.seviye && <p className="hata-metni" role="alert">{hatalar.seviye}</p>}
    </>
  );
}

function AdimAles({ t, guncelle, hatalar, buYil }: AdimProps & { buYil: number }) {
  const yillar = Array.from({ length: ALES_GECERLILIK_YIL + 1 }, (_, i) => buYil - i);
  return (
    <>
      <div className="soru">
        <h1>ALES puanların</h1>
        <p className="soluk">
          ALES sonuç belgende üç puan türü yazar. Hepsini girersen her programın istediği türle karşılaştırırız.
          {t.seviye === "tezsiz_yl" && " Tezsiz programların çoğu ALES istemez; varsa yine de gir."}
        </p>
      </div>
      {!t.alesYok && (
        <>
          <div className="puanlar">
            {(["SAY", "SOZ", "EA"] as PuanTuru[]).map((k) => (
              <div className="puan-kutu" key={k} aria-invalid={!!hatalar[`ales-${k}`]}>
                <label htmlFor={`ales-${k}`}>{k === "SOZ" ? "SÖZ" : k}</label>
                <input
                  id={`ales-${k}`}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="—"
                  value={t.ales[k]}
                  onChange={(e) => guncelle({ ales: { ...t.ales, [k]: e.target.value } })}
                />
              </div>
            ))}
          </div>
          {(["SAY", "SOZ", "EA"] as PuanTuru[]).map((k) =>
            hatalar[`ales-${k}`] ? (
              <p key={k} className="hata-metni" role="alert">
                {k === "SOZ" ? "SÖZ" : k}: {hatalar[`ales-${k}`]}
              </p>
            ) : null,
          )}
          <div className="alan">
            <span className="alan-baslik">Sınava girdiğin yıl</span>
            <div className="cip-grup">
              {yillar.map((y) => (
                <Cip key={y} secili={t.alesYili === y} onClick={() => guncelle({ alesYili: y })}>
                  <span className="sayi">{y}</span>
                </Cip>
              ))}
            </div>
            {hatalar.alesYili ? (
              <p className="hata-metni" role="alert">{hatalar.alesYili}</p>
            ) : (
              <p className="ipucu">ALES sonucu {ALES_GECERLILIK_YIL} yıl geçerlidir.</p>
            )}
          </div>
        </>
      )}
      <div className="cip-grup">
        <Cip secili={t.alesYok} onClick={() => guncelle({ alesYok: !t.alesYok })}>
          ALES'e girmedim
        </Cip>
      </div>
      {hatalar.ales && <p className="hata-metni" role="alert">{hatalar.ales}</p>}
    </>
  );
}

const DIL_SECENEKLERI: DilSinavi[] = ["YDS", "YOKDIL", "EYDS", "TOEFL", "DIGER"];

function AdimDil({ t, guncelle, hatalar }: AdimProps) {
  const puan = sayiCoz(t.dilPuani);
  const yds = t.dilSinavi === "TOEFL" && puan !== null && !Number.isNaN(puan) ? ydsKarsiligi({ dilSinavi: "TOEFL", dilPuani: puan }) : null;
  return (
    <>
      <div className="soru">
        <h1>Yabancı dil puanın var mı?</h1>
        <p className="soluk">Programların çoğu YDS veya eşdeğeri bir puan ister. TOEFL puanını ÖSYM'nin eşdeğerlik tablosuyla çeviririz.</p>
      </div>
      <div className="alan">
        <span className="alan-baslik">Sınav</span>
        <div className="cip-grup">
          {DIL_SECENEKLERI.map((s) => (
            <Cip key={s} secili={!t.dilYok && t.dilSinavi === s} onClick={() => guncelle({ dilSinavi: s, dilYok: false })}>
              {DIL_SINAVI_ADI[s]}
            </Cip>
          ))}
          <Cip secili={t.dilYok} onClick={() => guncelle({ dilYok: !t.dilYok, dilSinavi: null })}>
            Dil puanım yok
          </Cip>
        </div>
        {hatalar.dil && <p className="hata-metni" role="alert">{hatalar.dil}</p>}
      </div>
      {!t.dilYok && t.dilSinavi && (
        <div className="alan">
          <label htmlFor="dil-puani">{t.dilSinavi === "DIGER" ? "Sonuç belgendeki YDS karşılığı" : `${DIL_SINAVI_ADI[t.dilSinavi]} puanın`}</label>
          <input
            id="dil-puani"
            className="girdi sayi"
            inputMode="decimal"
            autoComplete="off"
            value={t.dilPuani}
            aria-invalid={!!hatalar.dilPuani}
            onChange={(e) => guncelle({ dilPuani: e.target.value })}
            style={{ maxWidth: 200 }}
          />
          {hatalar.dilPuani && <p className="hata-metni" role="alert">{hatalar.dilPuani}</p>}
          {t.dilSinavi === "TOEFL" && puan !== null && !Number.isNaN(puan) && (
            <p className="cevirme">
              {yds !== null ? (
                <>
                  YDS karşılığı <b className="sayi">{yds}</b>
                </>
              ) : (
                "Bu puanın ÖSYM tablosunda YDS karşılığı yok (en düşük 48)."
              )}
            </p>
          )}
        </div>
      )}
    </>
  );
}

function AdimLisans({ t, guncelle, hatalar }: AdimProps) {
  const [ara, setAra] = useState("");
  const liste = useMemo(() => {
    const a = aramaAnahtari(ara);
    return a ? BOLUMLER.filter((b) => aramaAnahtari(b).includes(a)) : BOLUMLER;
  }, [ara]);
  return (
    <>
      <div className="soru">
        <h1>Lisans bölümün</h1>
        <p className="soluk">Birçok program sadece belirli bölümlerin mezunlarını kabul ediyor.</p>
      </div>
      <div className="alan">
        <label htmlFor="bolum-ara">Bölüm</label>
        <div className="arama">
          <Search size={18} />
          <input id="bolum-ara" className="girdi" placeholder="Bölüm ara" value={ara} onChange={(e) => setAra(e.target.value)} autoComplete="off" />
        </div>
        <div className="bolum-liste" role="listbox" aria-label="Bölümler">
          {liste.map((b) => (
            <button key={b} type="button" role="option" aria-selected={t.bolum === b} onClick={() => guncelle({ bolum: b })}>
              {b}
              {t.bolum === b && <Check size={18} />}
            </button>
          ))}
          {!liste.length && <p className="ipucu" style={{ padding: 14 }}>Bu adla bir bölüm bulamadık.</p>}
        </div>
        {hatalar.bolum ? <p className="hata-metni" role="alert">{hatalar.bolum}</p> : t.bolum && <p className="ipucu">Seçili: {t.bolum}</p>}
      </div>
      <div className="alan">
        <label htmlFor="gno">Not ortalaman (isteğe bağlı)</label>
        <input
          id="gno"
          className="girdi sayi"
          inputMode="decimal"
          placeholder="ör. 3,10"
          value={t.gno}
          aria-invalid={!!hatalar.gno}
          onChange={(e) => guncelle({ gno: e.target.value })}
          style={{ maxWidth: 200 }}
        />
        {hatalar.gno ? <p className="hata-metni" role="alert">{hatalar.gno}</p> : <p className="ipucu">4'lük sistemde. Bazı programlar en düşük ortalama şartı koyuyor.</p>}
      </div>
    </>
  );
}

function AdimKonum({ t, guncelle, ilanlar }: { t: Taslak; guncelle: (p: Partial<Taslak>) => void; ilanlar: Ilan[] }) {
  const sayac = (filtre: (i: Ilan) => boolean) => {
    const m = new Map<string, number>();
    for (const i of ilanlar) if (filtre(i) && (!t.seviye || i.seviye === t.seviye)) m.set(i.sehir, (m.get(i.sehir) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"));
  };
  const yurtici = sayac((i) => i.ulke === "Türkiye");
  const yurtdisi = sayac((i) => i.ulke !== "Türkiye");
  const ulkeOf = new Map(ilanlar.map((i) => [i.sehir, i.ulke]));
  const sehirDegistir = (s: string) =>
    guncelle({ sehirler: t.sehirler.includes(s) ? t.sehirler.filter((x) => x !== s) : [...t.sehirler, s] });
  const ogretimDegistir = (o: OgretimTuru) =>
    guncelle({ ogretimTercihi: t.ogretimTercihi.includes(o) ? t.ogretimTercihi.filter((x) => x !== o) : [...t.ogretimTercihi, o] });

  return (
    <>
      <div className="soru">
        <h1>Nerede okumak istersin?</h1>
        <p className="soluk">Birden fazla şehir seçebilirsin. Sonra liste ekranından da değiştirebilirsin.</p>
      </div>
      <div className="alan">
        <span className="alan-baslik">Türkiye</span>
        <div className="cip-grup">
          <Cip secili={t.sehirler.length === 0} onClick={() => guncelle({ sehirler: [] })}>
            Fark etmez
          </Cip>
          {yurtici.map(([s, n]) => (
            <Cip key={s} secili={t.sehirler.includes(s)} onClick={() => sehirDegistir(s)} adet={n}>
              {s}
            </Cip>
          ))}
        </div>
      </div>
      {yurtdisi.length > 0 && (
        <div className="alan">
          <span className="alan-baslik">Yurt dışı</span>
          <div className="cip-grup">
            {yurtdisi.map(([s, n]) => (
              <Cip key={s} secili={t.sehirler.includes(s)} onClick={() => sehirDegistir(s)} adet={n}>
                {s}, {ulkeOf.get(s)}
              </Cip>
            ))}
          </div>
        </div>
      )}
      <div className="alan">
        <span className="alan-baslik">Eğitim dili</span>
        <Bolumlu
          etiket="Eğitim dili"
          deger={t.dilTercihi}
          degistir={(d) => guncelle({ dilTercihi: d })}
          secenekler={[
            { deger: "farketmez", ad: "Fark etmez" },
            { deger: "tr", ad: "Türkçe" },
            { deger: "en", ad: "İngilizce" },
          ]}
        />
      </div>
      <div className="alan">
        <span className="alan-baslik">Üniversite</span>
        <Bolumlu
          etiket="Üniversite türü"
          deger={t.turTercihi}
          degistir={(d) => guncelle({ turTercihi: d })}
          secenekler={[
            { deger: "farketmez", ad: "Fark etmez" },
            { deger: "devlet", ad: "Devlet" },
            { deger: "vakif", ad: "Vakıf" },
          ]}
        />
      </div>
      <div className="alan">
        <span className="alan-baslik">Öğretim şekli</span>
        <div className="cip-grup">
          {(
            [
              ["orgun", "Örgün"],
              ["ikinci", "İkinci öğretim"],
              ["uzaktan", "Uzaktan"],
            ] as Array<[OgretimTuru, string]>
          ).map(([o, ad]) => (
            <Cip key={o} secili={t.ogretimTercihi.includes(o)} onClick={() => ogretimDegistir(o)}>
              {ad}
            </Cip>
          ))}
        </div>
        <p className="ipucu">Hiçbirini seçmezsen hepsi gösterilir.</p>
      </div>
    </>
  );
}
