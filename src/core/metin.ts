/** Türkçe karakterleri ASCII'ye çevirir; kimlik ve karşılaştırma için. */
export function asciiYap(s: string): string {
  return s
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[âà]/g, "a")
    .replace(/[îì]/g, "i")
    .replace(/[ûù]/g, "u");
}

export function slug(s: string): string {
  return asciiYap(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Arama için: büyük/küçük harf ve Türkçe karakter farkını yok sayar. */
export function aramaAnahtari(s: string): string {
  return asciiYap(s).replace(/\s+/g, " ").trim();
}

/** ALES/YDS puanı: tam sayıysa olduğu gibi, değilse en fazla iki ondalık ve virgülle. */
export function puanMetni(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

export function ondalik(n: number, basamak = 2): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: basamak, maximumFractionDigits: basamak });
}

export function tamsayi(n: number): string {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

/** "2,50" veya "2.50" -> 2.5 */
export function sayiCoz(s: string): number | null {
  const t = s.trim().replace(/\s/g, "");
  if (!t) return null;
  // Binlik ayırıcı olarak nokta + ondalık virgül: "145.000" veya "145.000,50"
  let n: string;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) n = t.replace(/\./g, "").replace(",", ".");
  else n = t.replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(n)) return NaN;
  return Number(n);
}
