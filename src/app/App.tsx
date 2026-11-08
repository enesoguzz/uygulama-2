import { useEffect, useRef, useState } from "react";
import { CalendarDays, LayoutList, User } from "lucide-react";
import { eslestir } from "../core/eslestir";
import { bugunMetin } from "../core/tarih";
import { Logo } from "./bilesenler";
import { ORNEK_PROFIL, useUygulama } from "./durum";
import { Baslangic } from "./ekranlar/Baslangic";
import { ProgramDetay } from "./ekranlar/ProgramDetay";
import { Programlar } from "./ekranlar/Programlar";
import { Profil } from "./ekranlar/Profil";
import { Sihirbaz } from "./ekranlar/Sihirbaz";
import { Takvim } from "./ekranlar/Takvim";
import { Yonetim } from "./ekranlar/Yonetim";

// Yönlendirme sadece "#ad" biçimindeki hash ile yapılır (ör. #programlar, #p-marmara-universitesi-isletme-tezli-yl).
function hashOku() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}
function git(ad: string) {
  if (hashOku() === ad) return;
  window.location.hash = ad;
}

const SEKMELER = [
  { ad: "programlar", etiket: "Programlar", Ikon: LayoutList },
  { ad: "takvim", etiket: "Takvim", Ikon: CalendarDays },
  { ad: "profil", etiket: "Profil", Ikon: User },
] as const;

export function App() {
  const u = useUygulama();
  const [rota, setRota] = useState(hashOku);
  const [duzenleAdim, setDuzenleAdim] = useState<number | undefined>(undefined);
  const onceki = useRef("programlar");
  const bugun = bugunMetin();

  useEffect(() => {
    const dinle = () => {
      setRota((eski) => {
        if (!eski.startsWith("p-")) onceki.current = eski || "programlar";
        return hashOku();
      });
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", dinle);
    return () => window.removeEventListener("hashchange", dinle);
  }, []);

  // Profil yoksa öğrenci ekranları başlangıca döner
  let aktif = rota || (u.profil ? "programlar" : "baslangic");
  if (!u.profil && (aktif === "programlar" || aktif === "profil")) aktif = "baslangic";

  useEffect(() => {
    const basliklar: Record<string, string> = { programlar: "Programlar", takvim: "Takvim", profil: "Profil", yonetim: "Yönetim", sihirbaz: "Puanların" };
    document.title = basliklar[aktif] ? `${basliklar[aktif]} · Kademe` : "Kademe";
  }, [aktif]);

  const ornekle = () => {
    const ozet = eslestir(u.veri.ilanlar, ORNEK_PROFIL, { sehirler: ORNEK_PROFIL.sehirler, dil: "farketmez", tur: "farketmez", ogretim: [] }, bugun);
    const takip = [...ozet.uygun.filter((e) => e.durum !== "kapandi").slice(0, 3), ...ozet.azFarkla.slice(0, 1)].map((e) => e.ilan.id);
    u.ornekleBasla(takip);
    git("programlar");
  };

  let icerik: JSX.Element;
  const kabuksuz = aktif === "baslangic" || aktif === "sihirbaz";

  if (aktif === "baslangic") {
    icerik = (
      <Baslangic
        veri={u.veri}
        bugun={bugun}
        basla={() => {
          setDuzenleAdim(undefined);
          git("sihirbaz");
        }}
        ornekle={ornekle}
      />
    );
  } else if (aktif === "sihirbaz") {
    icerik = (
      <Sihirbaz
        key={duzenleAdim ?? "yeni"}
        profil={u.profil}
        ilanlar={u.veri.ilanlar}
        buYil={Number(bugun.slice(0, 4))}
        tekAdim={duzenleAdim}
        kaydet={(p) => {
          u.profilKaydet(p);
          git(duzenleAdim !== undefined ? "profil" : "programlar");
          setDuzenleAdim(undefined);
        }}
        vazgec={() => {
          const hedef = duzenleAdim !== undefined ? "profil" : u.profil ? "programlar" : "baslangic";
          setDuzenleAdim(undefined);
          git(hedef);
        }}
      />
    );
  } else if (aktif === "programlar" && u.profil) {
    icerik = (
      <Programlar profil={u.profil} ilanlar={u.veri.ilanlar} bugun={bugun} takip={u.takip} takipDegistir={u.takipDegistir} tercihKaydet={u.profilKaydet} />
    );
  } else if (aktif === "takvim") {
    icerik = (
      <Takvim
        takipEdilenler={u.takip.map((id) => u.ilanHaritasi.get(id)).filter((i) => i !== undefined)}
        bugun={bugun}
        hatirlat={u.hatirlat}
        hatirlatDegistir={u.hatirlatDegistir}
      />
    );
  } else if (aktif === "profil" && u.profil) {
    icerik = (
      <Profil
        profil={u.profil}
        programSayisi={u.veri.ilanlar.length}
        duzenle={(adim) => {
          setDuzenleAdim(adim);
          git("sihirbaz");
        }}
        sil={() => {
          u.profilSil();
          git("baslangic");
        }}
      />
    );
  } else if (aktif === "yonetim") {
    icerik = <Yonetim veri={u.veri} bugun={bugun} yayinla={u.veriYayinla} />;
  } else if (aktif.startsWith("p-") && u.ilanHaritasi.has(aktif.slice(2))) {
    const ilan = u.ilanHaritasi.get(aktif.slice(2))!;
    const geriHedef = !u.profil
      ? { hash: "baslangic", ad: "Başlangıç" }
      : onceki.current === "takvim"
        ? { hash: "takvim", ad: "Takvim" }
        : { hash: "programlar", ad: "Programlar" };
    icerik = (
      <ProgramDetay
        ilan={ilan}
        profil={u.profil}
        bugun={bugun}
        takipte={u.takip.includes(ilan.id)}
        takipDegistir={() => u.takipDegistir(ilan.id)}
        geriHedef={geriHedef}
      />
    );
  } else {
    icerik = (
      <main className="sayfa">
        <div className="bos">
          <h2>Bu sayfa bulunamadı</h2>
          <p>İlan kaldırılmış ya da bağlantı eksik olabilir.</p>
          <a className="dugme ikincil kucuk-d" href={u.profil ? "#programlar" : "#baslangic"}>
            Programlara dön
          </a>
        </div>
      </main>
    );
  }

  const seciliSekme = aktif.startsWith("p-") ? (onceki.current === "takvim" ? "takvim" : "programlar") : aktif;

  return (
    <>
      {!kabuksuz && (
        <header className="ust">
          <div className="ust-ic">
            <Logo href={u.profil ? "#programlar" : "#baslangic"} />
            <nav aria-label="Ana menü">
              {SEKMELER.map((s) => (
                <a key={s.ad} href={u.profil || s.ad === "takvim" ? `#${s.ad}` : "#baslangic"} aria-current={seciliSekme === s.ad ? "page" : undefined}>
                  {s.etiket}
                </a>
              ))}
            </nav>
          </div>
        </header>
      )}
      {!kabuksuz && (
        <div className="mobil-logo" style={{ padding: "18px 16px 0", marginBottom: 0 }}>
          <Logo href={u.profil ? "#programlar" : "#baslangic"} />
        </div>
      )}
      {icerik}
      {!kabuksuz && (
        <nav className="alt-menu" aria-label="Ana menü">
          {SEKMELER.map(({ ad, etiket, Ikon }) => (
            <a key={ad} href={u.profil || ad === "takvim" ? `#${ad}` : "#baslangic"} aria-current={seciliSekme === ad ? "page" : undefined}>
              <Ikon size={22} strokeWidth={seciliSekme === ad ? 2.2 : 1.8} />
              {etiket}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
