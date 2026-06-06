/**
 * Detect a shop's province/city from a free-text Vietnamese address so the
 * storefront region filter groups correctly — e.g. "Cầu Giấy, Hà Nội",
 * "Q. Cầu Giấy", "TP. Hà Nội" and "Hanoi" all resolve to "Hà Nội".
 *
 * Matching is diacritic-insensitive and scans the whole address (not just the
 * last comma segment), with a district→city fallback for the big cities.
 */

/** Lowercase + strip Vietnamese diacritics for fuzzy matching. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

/** Canonical city → alias keywords (already diacritic-stripped, lowercase). */
const PROVINCES: { name: string; aliases: string[] }[] = [
  { name: 'Hà Nội', aliases: ['ha noi', 'hanoi'] },
  { name: 'TP. Hồ Chí Minh', aliases: ['ho chi minh', 'tphcm', 'tp hcm', 'hcm', 'sai gon', 'saigon'] },
  { name: 'Đà Nẵng', aliases: ['da nang', 'danang'] },
  { name: 'Hải Phòng', aliases: ['hai phong', 'haiphong'] },
  { name: 'Cần Thơ', aliases: ['can tho'] },
  { name: 'Bình Dương', aliases: ['binh duong'] },
  { name: 'Đồng Nai', aliases: ['dong nai', 'bien hoa'] },
  { name: 'Khánh Hòa', aliases: ['khanh hoa', 'nha trang'] },
  { name: 'Quảng Ninh', aliases: ['quang ninh', 'ha long'] },
  { name: 'Thừa Thiên Huế', aliases: ['thua thien', 'hue'] },
  { name: 'Lâm Đồng', aliases: ['lam dong', 'da lat', 'dalat'] },
  { name: 'Bà Rịa - Vũng Tàu', aliases: ['ba ria', 'vung tau'] },
];

/** District keyword (diacritic-stripped) → canonical city. */
const DISTRICT_TO_CITY: Record<string, string> = {};
const addDistricts = (city: string, districts: string[]) =>
  districts.forEach((d) => { DISTRICT_TO_CITY[d] = city; });

addDistricts('Hà Nội', [
  'ba dinh', 'hoan kiem', 'dong da', 'hai ba trung', 'thanh xuan', 'cau giay',
  'tay ho', 'hoang mai', 'long bien', 'ha dong', 'nam tu liem', 'bac tu liem',
  'thanh tri', 'gia lam', 'dong anh', 'soc son', 'hoai duc', 'thanh oai',
]);
addDistricts('TP. Hồ Chí Minh', [
  'thu duc', 'binh thanh', 'go vap', 'phu nhuan', 'tan binh', 'tan phu',
  'binh tan', 'nha be', 'hoc mon', 'cu chi', 'can gio', 'binh chanh',
]);

/** Resolve an address to its canonical city, or "Khác" when unknown. */
export function detectRegion(address?: string): string {
  if (!address || !address.trim()) return 'Khác';
  const norm = normalize(address);

  // 1) Explicit province name anywhere in the address.
  for (const p of PROVINCES) {
    if (p.aliases.some((a) => norm.includes(a))) return p.name;
  }
  // 2) Known district → its city.
  for (const [district, city] of Object.entries(DISTRICT_TO_CITY)) {
    if (norm.includes(district)) return city;
  }
  // 3) Fallback: the segment after the last comma, as written.
  const parts = address.split(',');
  return parts[parts.length - 1].trim() || 'Khác';
}
