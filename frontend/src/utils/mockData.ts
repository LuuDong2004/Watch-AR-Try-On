// Mock Database system using localStorage for high-fidelity state simulation.
import { WATCHES, WatchConfig } from '../config/watches';

// A "Shop" is a seller on the marketplace (was previously framed as a showroom).
export interface Showroom {
  id: string;
  name: string;
  address: string; // city / area — no branch map
  phone: string;
  zalo: string;
  messenger: string;
  hours: string;
  mapCoords?: { lat: number; lng: number };
  manager: string; // shop owner / representative
  email: string;
  image: string;
  services: string[]; // specialties
  rating?: number;
  reviewCount?: number;
  since?: string;
  description?: string;
  ownerId?: string; // the shop owner (manager) who controls this store
  status?: 'active' | 'locked';
}
export type Shop = Showroom;

// The currently signed-in shop owner (manager). In this MVP we simulate one
// logged-in owner who may own several stores and can only manage their own.
export const CURRENT_OWNER_ID = 'owner-1';
export const OWNERS: Record<string, { id: string; name: string; email: string; avatar: string }> = {
  'owner-1': { id: 'owner-1', name: 'Henry Nguyễn', email: 'henry@aventus.luxury', avatar: 'HN' },
  'owner-2': { id: 'owner-2', name: 'Selena Trần', email: 'selena@heritagetime.vn', avatar: 'ST' },
};

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  watchId: string;
  watchName: string;
  watchBrand: string;
  shopId: string;
  shopName: string;
  type: 'contact' | 'appointment';
  date?: string;
  time?: string;
  message: string;
  status: 'new' | 'responded' | 'booked' | 'closed';
  timestamp: string;
  channel: 'form' | 'call' | 'zalo' | 'messenger';
  hasTriedOn: boolean;
  triedOnImage?: string; // dataUrl of AR photo
}

export interface ClosetItem {
  id: string;
  watchId: string;
  watchName: string;
  watchBrand: string;
  price: number;
  imageUrl: string;
  date: string;
}

// Seller shops on the marketplace. Each watch belongs to one shop (watch.shopId).
const INITIAL_SHOWROOMS: Showroom[] = [
  {
    id: 'shop-1',
    name: 'Aventus Luxury Watches',
    address: 'Quận 1, TP. Hồ Chí Minh',
    phone: '0901 234 567',
    zalo: 'https://zalo.me/0901234567',
    messenger: 'https://m.me/aventus.luxury',
    hours: '09:00 - 21:30 · cả tuần',
    manager: 'Henry Nguyễn',
    email: 'sales@aventus.luxury',
    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1200',
    rating: 4.9,
    reviewCount: 326,
    since: '2019',
    description: 'Cửa hàng chuyên đồng hồ cơ Thụy Sĩ chính hãng. Hỗ trợ thử AR trực tuyến, giao toàn quốc và bảo hành 5 năm.',
    ownerId: 'owner-1',
    status: 'active',
    services: [
      'Đại lý uỷ quyền Rolex & Omega',
      'Hỗ trợ thử AR & tư vấn online',
      'Bảo hành chính hãng 5 năm',
      'Thu mua, ký gửi có thẩm định'
    ]
  },
  {
    id: 'shop-2',
    name: 'Heritage Time Gallery',
    address: 'Hoàn Kiếm, Hà Nội',
    phone: '0909 876 543',
    zalo: 'https://zalo.me/0909876543',
    messenger: 'https://m.me/heritage.time',
    hours: '09:00 - 21:00 · cả tuần',
    manager: 'Selena Trần',
    email: 'care@heritagetime.vn',
    image: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&q=80&w=1200',
    rating: 4.8,
    reviewCount: 214,
    since: '2021',
    description: 'Chuyên đồng hồ thể thao & smartwatch cao cấp. Đổi trả trong 7 ngày, hỗ trợ trả góp 0%.',
    ownerId: 'owner-2',
    status: 'active',
    services: [
      'Hàng chính hãng nguyên seal',
      'Trả góp 0% qua thẻ',
      'Đổi trả trong 7 ngày',
      'Khắc laser cá nhân hoá'
    ]
  },
  {
    id: 'shop-3',
    name: 'Aventus Smart Hub',
    address: 'Quận 3, TP. Hồ Chí Minh',
    phone: '0902 555 888',
    zalo: 'https://zalo.me/0902555888',
    messenger: 'https://m.me/aventus.smart',
    hours: '08:30 - 22:00 · cả tuần',
    manager: 'Henry Nguyễn',
    email: 'smart@aventus.luxury',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=1200',
    rating: 4.7,
    reviewCount: 98,
    since: '2023',
    description: 'Chi nhánh chuyên smartwatch & phụ kiện công nghệ của Aventus.',
    ownerId: 'owner-1',
    status: 'active',
    services: ['Đồng hồ thông minh chính hãng', 'Cài đặt & hướng dẫn miễn phí', 'Bảo hành 1 đổi 1']
  }
];

// Bump when any seed (watches/shops/leads) shape changes — forces a re-seed.
const WATCH_SCHEMA_VERSION = '6';

const SEED_WATCHES = [
  {
    id: 'chrono',
    name: 'Chronograph Surgical White 42mm',
    brand: 'Aventus',
    model: '/models/chronograph_watch.glb',
    hasAR: true,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=900',
    gallery: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&q=80&w=900'
    ],
    style: 'steel-sport' as const,
    scale: 1.25,
    offset: [0, 0.0, 0] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    spin: [0, 0, (3 * Math.PI) / 2] as [number, number, number],
    metal: '#f3f4f6',
    dial: '#ffffff',
    accent: '#B8924A',
    price: 48900000,
    originalPrice: 56000000,
    description: 'Phiên bản giới hạn Surgical White — vỏ và dây ceramic trắng tinh khôi, mặt số ba kim đếm giờ phụ, sapphire phủ AR coating. Máy chronograph Thụy Sĩ Sellita SW500, hoàn thiện tay thủ công đẳng cấp haute horlogerie.',
    specs: {
      'Đường kính mặt': '42 mm',
      'Độ dày vỏ': '13.2 mm',
      'Chất liệu vỏ': 'Ceramic trắng cao cấp',
      'Chất liệu dây': 'Ceramic kết hợp Thép 316L',
      'Chất liệu kính': 'Sapphire phủ chống chói AR',
      'Bộ máy': 'Sellita SW500 Automatic (Thụy Sĩ)',
      'Chống nước': '200 m (20 ATM)',
      'Bảo hành': '5 năm chính hãng'
    },
    status: 'active',
    reviewCount: 18,
    rating: 4.9,
    shopId: 'shop-1'
  },
  {
    id: 'wrist',
    name: 'Classic Heritage Gold 39mm',
    brand: 'Omega',
    model: '',
    hasAR: false,
    image: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&q=80&w=900',
    gallery: [
      'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&q=80&w=900'
    ],
    style: 'dress' as const,
    scale: 1.15,
    offset: [0, 0.0, 0] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    metal: '#d7c08a',
    dial: '#0a0a0c',
    accent: '#B8924A',
    price: 185000000,
    originalPrice: 198000000,
    description: 'Chiếc đồng hồ Dress Watch đỉnh cao với vỏ vàng nguyên khối 18k, kim cọc số dát vàng, dây da cá sấu tự nhiên. Mang lại vẻ lịch lãm sang trọng tối thượng cho quý ông trong các buổi tiệc dạ hội.',
    specs: {
      'Đường kính mặt': '39 mm',
      'Độ dày vỏ': '10.5 mm',
      'Chất liệu vỏ': 'Vàng nguyên khối 18K Gold',
      'Chất liệu dây': 'Da cá sấu Alligator Mỹ',
      'Chất liệu kính': 'Sapphire vòm chống trầy xước',
      'Bộ máy': 'Calibre 8900 Co-Axial Master Chronometer',
      'Chống nước': '50 m (5 ATM)',
      'Bảo hành': '5 năm toàn cầu'
    },
    status: 'active',
    reviewCount: 12,
    rating: 4.8,
    shopId: 'shop-1'
  },
  {
    id: 'classic',
    name: 'Submariner Deep Blue 41mm',
    brand: 'Rolex',
    model: '',
    hasAR: false,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=900',
    gallery: [
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1548171915-e79a380a2a4b?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&q=80&w=900'
    ],
    style: 'dive' as const,
    scale: 1.2,
    offset: [0, 0.0, 0] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    metal: '#cfd3d8',
    dial: '#0b2a4a',
    accent: '#B8924A',
    price: 295000000,
    originalPrice: 310000000,
    description: 'Biểu tượng của đồng hồ lặn biển cao cấp. Vỏ Oystersteel siêu bền kết hợp niềng gốm Cerachrom xanh dương sâu thẳm, kim dạ quang phát sáng cực mạnh Chromalight. Đẳng cấp thể thao vượt thời gian.',
    specs: {
      'Đường kính mặt': '41 mm',
      'Độ dày vỏ': '12.3 mm',
      'Chất liệu vỏ': 'Thép Oystersteel 904L',
      'Chất liệu dây': 'Thép Oystersteel 3 dải khóa an toàn Oysterlock',
      'Chất liệu kính': 'Sapphire lúp ngày Cyclops chống lóa',
      'Bộ máy': 'Calibre 3235 Automatic (Rolex in-house)',
      'Chống nước': '300 m (30 ATM)',
      'Bảo hành': '5 năm quốc tế'
    },
    status: 'active',
    reviewCount: 34,
    rating: 5.0,
    shopId: 'shop-2'
  },
  {
    id: 'gshock',
    name: 'Tactical Sport Resilient',
    brand: 'G-Shock',
    model: '',
    hasAR: false,
    image: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&q=80&w=900',
    gallery: [
      'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1495856458515-0637185db551?auto=format&fit=crop&q=80&w=900'
    ],
    style: 'g-shock' as const,
    scale: 1.3,
    offset: [0, 0.02, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    metal: '#1c1c1f',
    dial: '#101216',
    accent: '#ff3333',
    price: 6800000,
    originalPrice: 8500000,
    description: 'Mẫu đồng hồ thể thao hầm hố, chống va đập, chống sốc và chống nước cực hạn. Tích hợp cảm biến la bàn, đo độ cao, đo nhiệt độ và kết nối Bluetooth thông minh với điện thoại. Thích hợp cho dã ngoại khám phá.',
    specs: {
      'Đường kính mặt': '45.5 mm',
      'Độ dày vỏ': '14.8 mm',
      'Chất liệu vỏ': 'Nhựa Resin kết hợp sợi Carbon',
      'Chất liệu dây': 'Nhựa Urethane siêu bền bỉ',
      'Chất liệu kính': 'Kính khoáng cường lực Mineral Glass',
      'Bộ máy': 'Quartz Tough Solar (năng lượng mặt trời)',
      'Chống nước': '200 m (20 ATM)',
      'Bảo hành': '2 năm chính hãng'
    },
    status: 'active',
    reviewCount: 9,
    rating: 4.7,
    shopId: 'shop-2'
  },
  {
    id: 'smart',
    name: 'Smart Titanium Ultra',
    brand: 'Aventus Smart',
    model: '',
    hasAR: false,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=900',
    gallery: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&q=80&w=900'
    ],
    style: 'smart' as const,
    scale: 1.1,
    offset: [0, 0.01, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    metal: '#b9a78c',
    dial: '#050505',
    accent: '#ff7a1a',
    price: 19900000,
    originalPrice: 22000000,
    description: 'Đồng hồ thông minh sang trọng bậc nhất với vỏ Titanium cấp hàng không vũ trụ đánh bóng thủ công. Màn hình AMOLED độ sáng cao 2000 nits, theo dõi nhịp tim, điện tâm đồ ECG và thời lượng pin ấn tượng lên đến 14 ngày.',
    specs: {
      'Đường kính mặt': '44 mm',
      'Độ dày vỏ': '11.8 mm',
      'Chất liệu vỏ': 'Titanium Grade 5 vũ trụ',
      'Chất liệu dây': 'Silicone thể thao cao cấp + dây Titanium tặng kèm',
      'Chất liệu kính': 'Kính Sapphire phẳng chống xước tối đa',
      'Bộ máy': 'Aventus OS thông minh đa nhân',
      'Chống nước': '100 m (10 ATM)',
      'Bảo hành': '2 năm 1 đổi 1'
    },
    status: 'active',
    reviewCount: 22,
    rating: 4.6,
    shopId: 'shop-3'
  }
];

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Nguyễn Minh Anh',
    phone: '0912 345 678',
    email: 'minhanh.nguyen@gmail.com',
    watchId: 'chrono',
    watchName: 'Chronograph Surgical White 42mm',
    watchBrand: 'Aventus',
    shopId: 'shop-1',
    shopName: 'Aventus Luxury Watches',
    type: 'appointment',
    date: '2026-06-02',
    time: '14:30',
    message: 'Tôi muốn qua thử trực tiếp mẫu Surgical White này tại showroom Quận 1. Đã xem thử AR qua webcam thấy rất ưng ý.',
    status: 'new',
    timestamp: '2026-05-30T09:15:00+07:00',
    channel: 'form',
    hasTriedOn: true
  },
  {
    id: 'lead-2',
    name: 'Trần Đức Hòa',
    phone: '0988 777 666',
    watchId: 'classic',
    watchName: 'Submariner Deep Blue 41mm',
    watchBrand: 'Rolex',
    shopId: 'shop-2',
    shopName: 'Heritage Time Gallery',
    type: 'contact',
    message: 'Mẫu Deep Blue này có sẵn hàng ở showroom Tràng Tiền Hà Nội không shop? Có ưu đãi gì thêm nếu mua trực tiếp không?',
    status: 'responded',
    timestamp: '2026-05-29T16:40:00+07:00',
    channel: 'zalo',
    hasTriedOn: false
  },
  {
    id: 'lead-3',
    name: 'Phạm Thanh Thủy',
    phone: '0905 111 222',
    email: 'thanhthuy@yahoo.com',
    watchId: 'wrist',
    watchName: 'Classic Heritage Gold 39mm',
    watchBrand: 'Omega',
    shopId: 'shop-1',
    shopName: 'Aventus Luxury Watches',
    type: 'appointment',
    date: '2026-06-05',
    time: '10:00',
    message: 'Lịch hẹn xem đồng hồ kỷ niệm ngày cưới. Nhờ cửa hàng chuẩn bị hộp quà tặng và gói sang trọng giúp tôi.',
    status: 'booked',
    timestamp: '2026-05-29T10:12:00+07:00',
    channel: 'form',
    hasTriedOn: true
  },
  {
    id: 'lead-4',
    name: 'Lê Hoàng Hải',
    phone: '0977 444 555',
    watchId: 'gshock',
    watchName: 'Tactical Sport Resilient',
    watchBrand: 'G-Shock',
    shopId: 'shop-2',
    shopName: 'Heritage Time Gallery',
    type: 'contact',
    message: 'Đồng hồ này có chống sốc khi đi xe địa hình không? Tư vấn thêm qua điện thoại giúp mình.',
    status: 'closed',
    timestamp: '2026-05-28T14:20:00+07:00',
    channel: 'call',
    hasTriedOn: true
  }
];

const INITIAL_CLOSET: ClosetItem[] = [
  {
    id: 'closet-1',
    watchId: 'chrono',
    watchName: 'Chronograph Surgical White 42mm',
    watchBrand: 'Aventus',
    price: 48900000,
    imageUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=600',
    date: '30/05/2026'
  },
  {
    id: 'closet-2',
    watchId: 'classic',
    watchName: 'Submariner Deep Blue 41mm',
    watchBrand: 'Rolex',
    price: 295000000,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
    date: '29/05/2026'
  }
];

// Seed databases if they do not exist
export function initDatabase() {
  if (typeof window === 'undefined') return;

  // A single data version stamp. Bump it whenever any seed shape changes
  // (watches, shops, leads) so existing localStorage re-seeds in lockstep —
  // important because watches now reference shops by id (shopId).
  const reseed = localStorage.getItem('ar_data_ver') !== WATCH_SCHEMA_VERSION;
  if (reseed || !localStorage.getItem('ar_watches')) {
    localStorage.setItem('ar_watches', JSON.stringify(SEED_WATCHES));
    localStorage.setItem('ar_showrooms', JSON.stringify(INITIAL_SHOWROOMS));
    localStorage.setItem('ar_leads', JSON.stringify(INITIAL_LEADS));
    localStorage.setItem('ar_data_ver', WATCH_SCHEMA_VERSION);
  }
  if (!localStorage.getItem('ar_closet')) {
    localStorage.setItem('ar_closet', JSON.stringify(INITIAL_CLOSET));
  }
  if (!localStorage.getItem('ar_favorites')) {
    localStorage.setItem('ar_favorites', JSON.stringify(['chrono']));
  }
}

// Reset data to defaults
export function resetDatabase() {
  localStorage.removeItem('ar_watches');
  localStorage.removeItem('ar_showrooms');
  localStorage.removeItem('ar_leads');
  localStorage.removeItem('ar_closet');
  localStorage.removeItem('ar_favorites');
  initDatabase();
  window.location.reload();
}

// Watch Operations
export function getDbWatches(): any[] {
  initDatabase();
  return JSON.parse(localStorage.getItem('ar_watches') || '[]');
}

export function saveDbWatch(watch: any) {
  const watches = getDbWatches();
  const idx = watches.findIndex((w) => w.id === watch.id);
  if (idx > -1) {
    watches[idx] = watch;
  } else {
    watches.push(watch);
  }
  localStorage.setItem('ar_watches', JSON.stringify(watches));
}

export function deleteDbWatch(id: string) {
  const watches = getDbWatches();
  const filtered = watches.filter((w) => w.id !== id);
  localStorage.setItem('ar_watches', JSON.stringify(filtered));
}

// Showroom Operations
export function getDbShowrooms(): Showroom[] {
  initDatabase();
  return JSON.parse(localStorage.getItem('ar_showrooms') || '[]');
}

export function saveDbShowroom(showroom: Showroom) {
  const showrooms = getDbShowrooms();
  const idx = showrooms.findIndex((s) => s.id === showroom.id);
  if (idx > -1) {
    showrooms[idx] = showroom;
  } else {
    showrooms.push(showroom);
  }
  localStorage.setItem('ar_showrooms', JSON.stringify(showrooms));
}

// Leads Operations
export function getDbLeads(): Lead[] {
  initDatabase();
  return JSON.parse(localStorage.getItem('ar_leads') || '[]');
}

export function addDbLead(lead: Omit<Lead, 'id' | 'timestamp' | 'status'>) {
  const leads = getDbLeads();
  const newLead: Lead = {
    ...lead,
    id: `lead-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: 'new'
  };
  leads.unshift(newLead);
  localStorage.setItem('ar_leads', JSON.stringify(leads));
  return newLead;
}

export function updateLeadStatus(id: string, status: Lead['status']) {
  const leads = getDbLeads();
  const lead = leads.find((l) => l.id === id);
  if (lead) {
    lead.status = status;
    localStorage.setItem('ar_leads', JSON.stringify(leads));
  }
}

export function deleteDbLead(id: string) {
  const leads = getDbLeads();
  const filtered = leads.filter((l) => l.id !== id);
  localStorage.setItem('ar_leads', JSON.stringify(filtered));
}

// Closet Operations
export function getDbCloset(): ClosetItem[] {
  initDatabase();
  return JSON.parse(localStorage.getItem('ar_closet') || '[]');
}

export function addToCloset(watchId: string, imageUrl: string) {
  const closet = getDbCloset();
  const watches = getDbWatches();
  const watch = watches.find((w) => w.id === watchId);
  if (!watch) return;

  const newItem: ClosetItem = {
    id: `closet-${Date.now()}`,
    watchId,
    watchName: watch.name,
    watchBrand: watch.brand,
    price: watch.price,
    imageUrl,
    date: new Date().toLocaleDateString('vi-VN')
  };

  closet.unshift(newItem);
  localStorage.setItem('ar_closet', JSON.stringify(closet));
  
  // also track this try-on in leads if there was a recent lead or just for statistics
  return newItem;
}

export function removeFromCloset(id: string) {
  const closet = getDbCloset();
  const filtered = closet.filter((item) => item.id !== id);
  localStorage.setItem('ar_closet', JSON.stringify(filtered));
}

// Favorites Operations
export function getDbFavorites(): string[] {
  initDatabase();
  return JSON.parse(localStorage.getItem('ar_favorites') || '[]');
}

export function toggleFavorite(watchId: string): boolean {
  const favs = getDbFavorites();
  const idx = favs.indexOf(watchId);
  let favorited = false;
  if (idx > -1) {
    favs.splice(idx, 1);
  } else {
    favs.push(watchId);
    favorited = true;
  }
  localStorage.setItem('ar_favorites', JSON.stringify(favs));
  return favorited;
}

// --- Shop (seller) helpers ---------------------------------------------------
// Marketplace model: each watch is posted by exactly one shop (watch.shopId).
export const getDbShops = getDbShowrooms;

/** The shop that sells a given watch (falls back to the first shop). */
export function getShopForWatch(watchId: string): Shop | undefined {
  const shops = getDbShops();
  const watch = getDbWatches().find((w) => w.id === watchId);
  return shops.find((s) => s.id === watch?.shopId) || shops[0];
}

/** All watches posted by a given shop. */
export function getWatchesForShop(shopId: string): any[] {
  return getDbWatches().filter((w) => w.shopId === shopId);
}

// --- Owner (manager) scoping ------------------------------------------------
/** Stores owned by the given owner (defaults to the signed-in owner). */
export function getMyShops(ownerId: string = CURRENT_OWNER_ID): Shop[] {
  return getDbShops().filter((s) => s.ownerId === ownerId);
}

/** Ids of the stores the owner is allowed to manage. */
export function getMyShopIds(ownerId: string = CURRENT_OWNER_ID): string[] {
  return getMyShops(ownerId).map((s) => s.id);
}

/**
 * Resolve a scope to the concrete store ids it covers.
 * scope === 'all' → every store the owner controls; otherwise that single store
 * (only if the owner actually owns it — guards against managing others' stores).
 */
export function resolveScopeShopIds(scope: string, ownerId: string = CURRENT_OWNER_ID): string[] {
  const mine = getMyShopIds(ownerId);
  if (scope === 'all' || !scope) return mine;
  return mine.includes(scope) ? [scope] : mine;
}

/** Watches belonging to any of the given store ids. */
export function getWatchesForShopIds(shopIds: string[]): any[] {
  const set = new Set(shopIds);
  return getDbWatches().filter((w) => set.has(w.shopId));
}

/** Leads addressed to any of the given store ids. */
export function getLeadsForShopIds(shopIds: string[]): Lead[] {
  const set = new Set(shopIds);
  return getDbLeads().filter((l) => set.has(l.shopId));
}

/** Back-compat shim: returns the watch's shop as a single-element list. */
export function getShowroomsForWatch(watchId: string): Showroom[] {
  const shop = getShopForWatch(watchId);
  return shop ? [shop] : getDbShops();
}

// --- Feedback (góp ý) -------------------------------------------------------
export interface Feedback {
  id: string;
  target: 'shop' | 'website';
  shopId?: string;
  shopName?: string;
  rating: number; // 1..5
  topic?: string;
  message: string;
  name: string;
  contact?: string;
  timestamp: string;
}

export function getDbFeedback(): Feedback[] {
  initDatabase();
  return JSON.parse(localStorage.getItem('ar_feedback') || '[]');
}

export function addDbFeedback(fb: Omit<Feedback, 'id' | 'timestamp'>) {
  const list = getDbFeedback();
  const entry: Feedback = {
    ...fb,
    id: `fb-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  list.unshift(entry);
  localStorage.setItem('ar_feedback', JSON.stringify(list));
  return entry;
}
