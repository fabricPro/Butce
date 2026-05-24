import {
  Wallet, Landmark, CreditCard,
  Briefcase, Gift, TrendingUp, MoreHorizontal,
  ShoppingCart, Car, Home, Coffee, Zap, Film, Shirt, BookOpen,
} from 'lucide-react';

export const CURRENCIES = {
  TRY: { code: 'TRY', symbol: '₺', label: 'Türk Lirası' },
  USD: { code: 'USD', symbol: '$', label: 'Amerikan Doları' },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro' },
};
export const CURRENCY_LIST = ['TRY', 'USD', 'EUR'];

export const ACCOUNT_TYPES = {
  nakit: { label: 'Nakit', Icon: Wallet },
  banka: { label: 'Banka', Icon: Landmark },
  kredi_karti: { label: 'Kredi Kartı', Icon: CreditCard },
};

export const ACCOUNT_COLORS = [
  '#D4A574', '#A8C886', '#DC8A6E', '#7FB3D5',
  '#B58968', '#C9B89F', '#9A8FBE', '#E0A98B',
];

export const CATS = {
  gelir: [
    { id: 'maas', label: 'Maaş', Icon: Briefcase },
    { id: 'ek_gelir', label: 'Ek Gelir', Icon: Gift },
    { id: 'yatirim', label: 'Yatırım', Icon: TrendingUp },
    { id: 'diger_g', label: 'Diğer', Icon: MoreHorizontal },
  ],
  gider: [
    { id: 'market', label: 'Market', Icon: ShoppingCart },
    { id: 'yemek', label: 'Yemek', Icon: Coffee },
    { id: 'ulasim', label: 'Ulaşım', Icon: Car },
    { id: 'fatura', label: 'Fatura', Icon: Zap },
    { id: 'kira', label: 'Kira', Icon: Home },
    { id: 'eglence', label: 'Eğlence', Icon: Film },
    { id: 'giyim', label: 'Giyim', Icon: Shirt },
    { id: 'egitim', label: 'Eğitim', Icon: BookOpen },
    { id: 'diger', label: 'Diğer', Icon: MoreHorizontal },
  ],
};

export const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
export const AY_KISA = AYLAR.map(a => a.slice(0, 3));

export const PIE_COLORS = [
  '#DC8A6E', '#D4A574', '#C9966F', '#E0A98B',
  '#B58968', '#CC9772', '#A87559', '#BF8E5E', '#8E7560',
];

export const FREQUENCIES = {
  aylik: { label: 'Aylık', short: 'ay' },
  haftalik: { label: 'Haftalık', short: 'hf' },
  yillik: { label: 'Yıllık', short: 'yıl' },
};

export const WEEKDAYS = [
  { id: 1, label: 'Pzt', full: 'Pazartesi' },
  { id: 2, label: 'Sal', full: 'Salı' },
  { id: 3, label: 'Çar', full: 'Çarşamba' },
  { id: 4, label: 'Per', full: 'Perşembe' },
  { id: 5, label: 'Cum', full: 'Cuma' },
  { id: 6, label: 'Cmt', full: 'Cumartesi' },
  { id: 0, label: 'Paz', full: 'Pazar' },
];

// Fallback FX rates if Frankfurter API fails and no cached rates available.
export const FX_FALLBACK = { TRY: 1, USD: 32.5, EUR: 35.2 };
export const FX_TTL = 24 * 60 * 60 * 1000;

export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getCat(type, id) {
  return CATS[type]?.find(c => c.id === id) || { label: 'Diğer', Icon: MoreHorizontal };
}

export function getAccount(accounts, id) {
  return accounts.find(a => a.id === id);
}
