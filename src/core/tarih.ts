// Türkçe tarih biçimleri. Tarihler "YYYY-AA-GG" metni olarak tutulur, saat dilimi sorunu çıkmasın diye
// hesaplamalar UTC gün sayısı üzerinden yapılır.

export const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const AY_EKI = ["'ta", "'ta", "'ta", "'da", "'ta", "'da", "'da", "'ta", "'de", "'de", "'da", "'ta"];
const AY_DEN = ["'tan", "'tan", "'tan", "'dan", "'tan", "'dan", "'dan", "'tan", "'den", "'den", "'dan", "'tan"];
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function parcala(t: string): [number, number, number] {
  const [y, a, g] = t.split("-").map(Number);
  return [y, a, g];
}

export function gunNo(t: string): number {
  const [y, a, g] = parcala(t);
  return Math.round(Date.UTC(y, a - 1, g) / 86_400_000);
}

export function bugunMetin(simdi: Date = new Date()): string {
  const y = simdi.getFullYear();
  const a = String(simdi.getMonth() + 1).padStart(2, "0");
  const g = String(simdi.getDate()).padStart(2, "0");
  return `${y}-${a}-${g}`;
}

export function gunFarki(bas: string, son: string): number {
  return gunNo(son) - gunNo(bas);
}

/** "5 Ocak" */
export function kisaTarih(t: string): string {
  const [, a, g] = parcala(t);
  return `${g} ${AYLAR[a - 1]}`;
}

/** "5 Ocak'ta" */
export function kisaTarihTa(t: string): string {
  const [, a, g] = parcala(t);
  return `${g} ${AYLAR[a - 1]}${AY_EKI[a - 1]}`;
}

/** "5 Ocak'tan" */
export function kisaTarihTan(t: string): string {
  const [, a, g] = parcala(t);
  return `${g} ${AYLAR[a - 1]}${AY_DEN[a - 1]}`;
}

/** "5 Ocak 2027" */
export function uzunTarih(t: string): string {
  const [y, a, g] = parcala(t);
  return `${g} ${AYLAR[a - 1]} ${y}`;
}

export function gunAdi(t: string): string {
  const [y, a, g] = parcala(t);
  return GUNLER[new Date(Date.UTC(y, a - 1, g)).getUTCDay()];
}

export function ayBaslik(t: string): string {
  const [y, a] = parcala(t);
  return `${AYLAR[a - 1]} ${y}`;
}

export function ayGun(t: string): { ay: string; gun: number } {
  const [, a, g] = parcala(t);
  return { ay: AYLAR[a - 1].slice(0, 3), gun: g };
}

/** "21.11.2026" veya "2026-11-21" kabul eder, "2026-11-21" döner. Geçersizse null. */
export function tarihCoz(girdi: string): string | null {
  const s = girdi.trim();
  let y: number, a: number, g: number;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    [y, a, g] = [Number(m[1]), Number(m[2]), Number(m[3])];
  } else {
    m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (!m) return null;
    [g, a, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  const d = new Date(Date.UTC(y, a - 1, g));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== a - 1 || d.getUTCDate() !== g) return null;
  return `${y}-${String(a).padStart(2, "0")}-${String(g).padStart(2, "0")}`;
}
