import { useState } from "react";
import { DIL_ADI, OGRETIM_ADI, SEVIYE_ADI, TUR_ADI } from "../../core/sabitler";
import type { Profil as ProfilT } from "../../core/types";
import { alesOzeti, dilOzeti, gnoMetni } from "../bicim";
import { ADIMLAR } from "./Sihirbaz";

export function Profil({ profil, duzenle, sil, programSayisi }: { profil: ProfilT; duzenle: (adim: number) => void; sil: () => void; programSayisi: number }) {
  const [silOnay, setSilOnay] = useState(false);

  const tercihler = [
    profil.sehirler.length ? profil.sehirler.join(", ") : "Tüm şehirler",
    profil.dilTercihi === "farketmez" ? "Dil fark etmez" : `${DIL_ADI[profil.dilTercihi]} eğitim`,
    profil.turTercihi === "farketmez" ? "Devlet ve vakıf" : TUR_ADI[profil.turTercihi],
    profil.ogretimTercihi.length ? profil.ogretimTercihi.map((o) => OGRETIM_ADI[o]).join(", ") : "Tüm öğretim şekilleri",
  ];

  const satirlar: Array<{ ad: string; deger: string; adim: number }> = [
    {
      ad: ADIMLAR[0],
      deger: SEVIYE_ADI[profil.seviye] + (profil.seviye === "doktora" ? (profil.mezuniyet === "lisans" ? " · lisans diplomasıyla" : " · yüksek lisans diplomasıyla") : ""),
      adim: 0,
    },
    { ad: ADIMLAR[1], deger: alesOzeti(profil), adim: 1 },
    { ad: ADIMLAR[2], deger: dilOzeti(profil), adim: 2 },
    { ad: ADIMLAR[3], deger: `${profil.bolum} · ortalama ${gnoMetni(profil.gno)}`, adim: 3 },
    { ad: ADIMLAR[4], deger: tercihler.join(" · "), adim: 4 },
  ];

  return (
    <main className="sayfa">
      <div className="sayfa-bas">
        <h1>Profilin</h1>
        <p className="soluk">Eşleştirme bu bilgilere göre yapılıyor. Puanın değişince güncellemen yeterli.</p>
      </div>
      <ul className="kutu profil-liste" style={{ maxWidth: 720 }}>
        {satirlar.map((s) => (
          <li key={s.ad}>
            <div>
              <div className="profil-ad">{s.ad}</div>
              <div className="profil-deger sayi">{s.deger}</div>
            </div>
            <button type="button" className="dugme duz" onClick={() => duzenle(s.adim)}>
              Değiştir
            </button>
          </li>
        ))}
      </ul>

      <div className="alt-baglantilar" style={{ maxWidth: 720 }}>
        {silOnay ? (
          <>
            <span className="kucuk">Profilin ve takip listen silinecek.</span>
            <button type="button" className="dugme ikincil kucuk-d" onClick={sil}>
              Evet, sil
            </button>
            <button type="button" className="dugme duz kucuk" onClick={() => setSilOnay(false)}>
              Vazgeç
            </button>
          </>
        ) : (
          <button type="button" className="dugme duz kucuk" style={{ color: "var(--short)" }} onClick={() => setSilOnay(true)}>
            Profili sil
          </button>
        )}
      </div>

      <p className="veri-notu">
        Prototip · {programSayisi} örnek ilan · <a href="#yonetim">Yönetim paneli</a>
      </p>
    </main>
  );
}
