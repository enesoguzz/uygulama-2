import { ArrowRight } from "lucide-react";
import { basvuruDurumu } from "../../core/eslestir";
import { SEVIYE_KISA } from "../../core/sabitler";
import { ayGun } from "../../core/tarih";
import type { VeriSeti } from "../../core/types";
import { Logo } from "../bilesenler";

export function Baslangic({ veri, bugun, basla, ornekle }: { veri: VeriSeti; bugun: string; basla: () => void; ornekle: () => void }) {
  const universiteSayisi = new Set(veri.ilanlar.map((i) => i.universite)).size;
  const sehirSayisi = new Set(veri.ilanlar.map((i) => i.sehir)).size;
  const kapanacak = veri.ilanlar
    .map((ilan) => ({ ilan, ...basvuruDurumu(ilan, bugun) }))
    .filter((x) => x.durum === "acik")
    .sort((a, b) => a.gun - b.gun)
    .slice(0, 5);

  return (
    <main className="sayfa menusuz">
      <div className="mobil-logo">
        <Logo href="#baslangic" />
      </div>
      <div className="giris">
        <section className="giris-metin">
          <h1>Yüksek lisans ve doktora ilanları, tek listede.</h1>
          <p className="giris-alt">
            ALES ve dil puanını, mezun olduğun bölümü gir. Şartlarını karşıladığın programları ve başvuru tarihlerini birlikte gör.
          </p>
          <p className="giris-sayilar sayi">
            <span>
              <b>{veri.ilanlar.length}</b> program
            </span>
            <span>
              <b>{universiteSayisi}</b> üniversite
            </span>
            <span>
              <b>{sehirSayisi}</b> şehir
            </span>
          </p>
          <div className="giris-eylem">
            <button type="button" className="dugme ana" onClick={basla}>
              Puanlarımı gir <ArrowRight size={18} />
            </button>
            <button type="button" className="dugme duz" onClick={ornekle}>
              Örnek bir profille göz at
            </button>
          </div>
        </section>

        {kapanacak.length > 0 && (
          <section className="kutu yaklasan" aria-labelledby="yaklasan-baslik">
            <div className="yaklasan-bas">
              <h2 id="yaklasan-baslik">Başvurusu yakında kapananlar</h2>
            </div>
            <ol>
              {kapanacak.map(({ ilan, gun }) => {
                const t = ayGun(ilan.basvuruBitis);
                return (
                  <li key={ilan.id}>
                    <div className="yaklasan-satir">
                      <div className="tarih-blok sayi" aria-label={`Son gün ${t.gun} ${t.ay}`}>
                        <span className="g">{t.gun}</span>
                        <span className="a">{t.ay}</span>
                      </div>
                      <div>
                        <div className="satir-baslik">
                          {ilan.program} <span className="soluk">· {SEVIYE_KISA[ilan.seviye]}</span>
                        </div>
                        <div className="satir-alt">
                          {ilan.universite} · {gun === 0 ? "bugün son gün" : `${gun} gün kaldı`}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
