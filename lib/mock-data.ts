// lib/mock-data.ts
// Mock data for demo mode when database is unavailable

import type { ListingCard, CategoryItem } from '@/contracts/api';

export const MOCK_CATEGORIES: CategoryItem[] = [
  { id: 'vehicles', name: 'Vozila', icon: 'Car', listingCount: 5 },
  { id: 'electronics', name: 'Elektronika', icon: 'Smartphone', listingCount: 4 },
  { id: 'home', name: 'Kuća i bašta', icon: 'Home', listingCount: 5 },
  { id: 'fashion', name: 'Moda', icon: 'Shirt', listingCount: 3 },
  { id: 'sports', name: 'Sport i rekreacija', icon: 'Dumbbell', listingCount: 3 },
  { id: 'kids', name: 'Deca i bebe', icon: 'Baby', listingCount: 2 },
  { id: 'pets', name: 'Ljubimci', icon: 'PawPrint', listingCount: 2 },
  { id: 'services', name: 'Usluge', icon: 'Wrench', listingCount: 2 },
];

export const MOCK_LISTINGS: ListingCard[] = [
  {
    id: 'mock-1',
    slug: 'bmw-320d-m-sport-2019-mock-1',
    title: 'BMW 320d M-Sport (2019)',
    price: 32500,
    currency: 'EUR',
    isNegotiable: true,
    city: 'Beograd',
    condition: 'GOOD',
    categoryId: 'vehicles',
    createdAt: new Date('2024-01-15'),
    heroImage: {
      thumbUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
      mediumUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
    },
    seller: {
      id: 'demo-seller-1',
      name: 'Ana Marković',
      avatarUrl: null,
      isVerified: true,
    },
    attributes: {
      brand: 'BMW',
      model: '320d G20',
      year: 2019,
    },
  },
  {
    id: 'mock-2',
    slug: 'macbook-pro-14-m3-pro-2024-mock-2',
    title: 'MacBook Pro 14" M3 Pro (2024)',
    price: 245000,
    currency: 'RSD',
    isNegotiable: false,
    city: 'Beograd',
    condition: 'LIKE_NEW',
    categoryId: 'electronics',
    createdAt: new Date('2024-01-20'),
    heroImage: {
      thumbUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      mediumUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    },
    seller: {
      id: 'demo-seller-2',
      name: 'Marko Petrović',
      avatarUrl: null,
      isVerified: true,
    },
    attributes: {
      brand: 'Apple',
      model: 'MacBook Pro 14"',
    },
  },
  {
    id: 'mock-3',
    slug: 'trosoban-stan-vracar-85m2-mock-3',
    title: 'Trosoban stan - Vračar, 85m²',
    price: 185000,
    currency: 'EUR',
    isNegotiable: true,
    city: 'Beograd',
    condition: 'LIKE_NEW',
    categoryId: 'home',
    createdAt: new Date('2024-01-18'),
    heroImage: {
      thumbUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      mediumUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    },
    seller: {
      id: 'demo-seller-1',
      name: 'Ana Marković',
      avatarUrl: null,
      isVerified: true,
    },
    attributes: {
      type: 'Stan',
      sqm: 85,
    },
  },
  {
    id: 'mock-4',
    slug: 'iphone-15-pro-256gb-mock-4',
    title: 'iPhone 15 Pro 256GB - Blue Titanium',
    price: 125000,
    currency: 'RSD',
    isNegotiable: false,
    city: 'Novi Sad',
    condition: 'NEW',
    categoryId: 'electronics',
    createdAt: new Date('2024-01-22'),
    heroImage: {
      thumbUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d256e?w=400',
      mediumUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d256e?w=800',
    },
    seller: {
      id: 'demo-seller-2',
      name: 'Marko Petrović',
      avatarUrl: null,
      isVerified: true,
    },
    attributes: {
      brand: 'Apple',
      model: 'iPhone 15 Pro',
    },
  },
  {
    id: 'mock-5',
    slug: 'volkswagen-golf-7-mock-5',
    title: 'Volkswagen Golf 7 1.6 TDI',
    price: 11500,
    currency: 'EUR',
    isNegotiable: true,
    city: 'Novi Sad',
    condition: 'GOOD',
    categoryId: 'vehicles',
    createdAt: new Date('2024-01-10'),
    heroImage: {
      thumbUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400',
      mediumUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
    },
    seller: {
      id: 'demo-seller-2',
      name: 'Marko Petrović',
      avatarUrl: null,
      isVerified: true,
    },
    attributes: {
      brand: 'Volkswagen',
      model: 'Golf 7',
      year: 2016,
    },
  },
  {
    id: 'mock-6',
    slug: 'nike-air-max-90-mock-6',
    title: 'Nike Air Max 90 - br. 43',
    price: 12000,
    currency: 'RSD',
    isNegotiable: false,
    city: 'Novi Sad',
    condition: 'LIKE_NEW',
    categoryId: 'fashion',
    createdAt: new Date('2024-01-19'),
    heroImage: {
      thumbUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      mediumUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    },
    seller: {
      id: 'demo-seller-2',
      name: 'Marko Petrović',
      avatarUrl: null,
      isVerified: true,
    },
    attributes: {
      brand: 'Nike',
    },
  },
  {
    id: 'mock-7',
    slug: 'playstation-5-mock-7',
    title: 'PlayStation 5 + 2 kontrolera',
    price: 55000,
    currency: 'RSD',
    isNegotiable: true,
    city: 'Niš',
    condition: 'GOOD',
    categoryId: 'electronics',
    createdAt: new Date('2024-01-16'),
    heroImage: {
      thumbUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400',
      mediumUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800',
    },
    seller: {
      id: 'demo-seller-3',
      name: 'Jovana Nikolić',
      avatarUrl: null,
      isVerified: false,
    },
    attributes: {
      brand: 'Sony',
      model: 'PlayStation 5',
    },
  },
  {
    id: 'mock-8',
    slug: 'trek-marlin-7-bicikl-mock-8',
    title: 'Trek Marlin 7 MTB bicikl',
    price: 75000,
    currency: 'RSD',
    isNegotiable: true,
    city: 'Novi Sad',
    condition: 'GOOD',
    categoryId: 'sports',
    createdAt: new Date('2024-01-14'),
    heroImage: {
      thumbUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
      mediumUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
    },
    seller: {
      id: 'demo-seller-2',
      name: 'Marko Petrović',
      avatarUrl: null,
      isVerified: true,
    },
    attributes: {
      brand: 'Trek',
    },
  },
];

// Filter mock listings by category
export function getMockListings(filters?: { categoryId?: string; query?: string; limit?: number }): ListingCard[] {
  let results = [...MOCK_LISTINGS];

  if (filters?.categoryId) {
    results = results.filter(l => l.categoryId === filters.categoryId);
  }

  if (filters?.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q)
    );
  }

  if (filters?.limit) {
    results = results.slice(0, filters.limit);
  }

  return results;
}
