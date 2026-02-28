import { useQuery } from '@tanstack/react-query';

export function useExchangeRate() {
    return useQuery({
        queryKey: ['exchange-rate'],
        queryFn: async () => {
            const res = await fetch('/api/exchange-rate');
            if (!res.ok) throw new Error('Failed to fetch exchange rate');
            return res.json() as Promise<{ rate: number; updatedAt: string }>;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}
