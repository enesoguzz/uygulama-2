import { useCallback, useEffect, useMemo, useState } from "react";
import ornekCsv from "../data/ornek-ilanlar.csv?raw";
import { ilanlariOku } from "../core/csv";
import type { Ilan, Profil, VeriSeti } from "../core/types";

// Prototipte veri tarayıcıda tutulur. Gerçek sürümde profil ve takip listesi kullanıcı hesabında,
// ilanlar ise sunucuda (ör. Supabase/Postgres) durur; bu dosyanın arayüzü aynı kalır.

const ANAHTAR = "kademe.v1";
const ORNEK_YUKLEME_TARIHI = "2026-11-08";

export const ORNEK_PROFIL: Profil = {
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

export function ornekVeri(): VeriSeti {
  return { ilanlar: ilanlariOku(ornekCsv).ilanlar, kaynak: "ornek", yuklemeTarihi: ORNEK_YUKLEME_TARIHI };
}

interface Kayit {
  profil: Profil | null;
  takip: string[];
  hatirlat: boolean;
  veri: VeriSeti | null; // null: örnek veri
}

function oku(): Kayit {
  const bos: Kayit = { profil: null, takip: [], hatirlat: true, veri: null };
  try {
    const ham = localStorage.getItem(ANAHTAR);
    return ham ? { ...bos, ...JSON.parse(ham) } : bos;
  } catch {
    return bos;
  }
}

function yaz(k: Kayit) {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(k));
  } catch {
    /* depolama kapalıysa uygulama yine çalışır */
  }
}

export function useUygulama() {
  const [kayit, setKayit] = useState<Kayit>(oku);
  useEffect(() => yaz(kayit), [kayit]);

  const veri = useMemo(() => kayit.veri ?? ornekVeri(), [kayit.veri]);
  const ilanHaritasi = useMemo(() => new Map<string, Ilan>(veri.ilanlar.map((i) => [i.id, i])), [veri]);

  const profilKaydet = useCallback((profil: Profil) => setKayit((k) => ({ ...k, profil })), []);
  const profilSil = useCallback(() => setKayit((k) => ({ ...k, profil: null, takip: [] })), []);
  const takipDegistir = useCallback(
    (id: string) => setKayit((k) => ({ ...k, takip: k.takip.includes(id) ? k.takip.filter((t) => t !== id) : [...k.takip, id] })),
    [],
  );
  const hatirlatDegistir = useCallback((hatirlat: boolean) => setKayit((k) => ({ ...k, hatirlat })), []);
  const veriYayinla = useCallback((v: VeriSeti | null) => setKayit((k) => ({ ...k, veri: v })), []);
  const ornekleBasla = useCallback(
    (takip: string[]) => setKayit((k) => ({ ...k, profil: ORNEK_PROFIL, takip })),
    [],
  );

  return {
    profil: kayit.profil,
    takip: kayit.takip,
    hatirlat: kayit.hatirlat,
    veri,
    ilanHaritasi,
    profilKaydet,
    profilSil,
    takipDegistir,
    hatirlatDegistir,
    veriYayinla,
    ornekleBasla,
  };
}

export type Uygulama = ReturnType<typeof useUygulama>;
