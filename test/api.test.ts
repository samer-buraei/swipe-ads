import { describe, it, expect } from 'vitest';
import { toListingCard } from '../server/api/helpers';

describe('toListingCard', () => {
    it('correctly maps a full database row to a ListingCard', () => {
        const mockDbRow = {
            id: '123',
            slug: 'listing-123',
            title: 'Zimski kaput',
            price: 5000,
            currency: 'RSD',
            is_negotiable: true,
            city: 'Novi Sad',
            condition: 'LIKE_NEW',
            category_id: 'odeca',
            created_at: '2025-01-01T10:00:00Z',
            status: 'ACTIVE',
            attributes: { size: 'XL', brand: 'Zara' },
            is_premium: false,
            seller_id: 'user-001',
            listing_images: [
                { thumb_url: 'thumb1.jpg', medium_url: 'med1.jpg', order: 2 },
                { thumb_url: 'thumb2.jpg', medium_url: 'med2.jpg', order: 1 }
            ],
            users: {
                id: 'user-001',
                name: 'Ana',
                image: 'ana.jpg',
                is_verified: true
            }
        };

        const currentUserId = 'user-999';
        const card = toListingCard(mockDbRow, currentUserId, { isFavorited: true });

        expect(card.id).toBe('123');
        expect(card.slug).toBe('listing-123');
        expect(card.title).toBe('Zimski kaput');
        expect(card.price).toBe(5000);
        expect(card.currency).toBe('RSD');
        expect(card.isNegotiable).toBe(true);
        expect(card.city).toBe('Novi Sad');
        expect(card.condition).toBe('LIKE_NEW');

        // It picks the first one returned without deep sorting in the helper
        expect(card.heroImage).toEqual({
            thumbUrl: 'thumb1.jpg',
            mediumUrl: 'med1.jpg'
        });

        expect(card.seller).toEqual({
            id: 'user-001',
            name: 'Ana',
            avatarUrl: 'ana.jpg',
            isVerified: true
        });

        expect(card.isFavorited).toBe(true);
        expect(card.status).toBe('ACTIVE');
        expect(card.attributes).toEqual({ size: 'XL', brand: 'Zara' });
    });

    it('handles listings with no images gently', () => {
        const mockDbRow = {
            id: '124',
            slug: 'listing-124',
            title: 'Stara knjiga',
            price: 500,
            currency: 'RSD',
            is_negotiable: false,
            city: 'Beograd',
            condition: 'FAIR',
            category_id: 'knjige',
            created_at: '2025-01-02T10:00:00Z',
            status: 'ACTIVE',
            attributes: null,
            is_premium: false,
            seller_id: 'user-002',
            listing_images: [],
            users: { id: 'user-002', name: 'Marko', image: null, is_verified: false }
        };

        const card = toListingCard(mockDbRow, 'user-999');
        expect(card.heroImage).toBeNull();
        expect(card.isFavorited).toBeUndefined();
    });
});
