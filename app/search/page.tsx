'use client'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { api } from '@/lib/trpc'
import { SearchBar } from '@/components/search/SearchBar'
import { ListingCard } from '@/components/listings/ListingCard'
import { SlidersHorizontal, X } from 'lucide-react'

const CONDITIONS = [
    { value: 'NEW', label: 'Novo' },
    { value: 'LIKE_NEW', label: 'Kao novo' },
    { value: 'GOOD', label: 'Dobro' },
    { value: 'FAIR', label: 'Korišćeno' },
]

function SearchContent() {
    const searchParams = useSearchParams()

    const [query, setQuery] = useState(searchParams.get('q') ?? '')
    const [categoryId, setCategoryId] = useState(searchParams.get('category') ?? '')
    const [condition, setCondition] = useState(searchParams.get('condition') ?? '')
    const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') ?? '')
    const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') ?? '')
    const [city, setCity] = useState(searchParams.get('city') ?? '')
    const [showFilters, setShowFilters] = useState(false)

    const { data: categories } = api.category.list.useQuery()
    const { data: results, isLoading } = api.listing.list.useQuery({
        query: query || undefined,
        categoryId: categoryId || undefined,
        conditions: condition ? [condition as any] : undefined,
        minPrice: priceMin ? Number(priceMin) : undefined,
        maxPrice: priceMax ? Number(priceMax) : undefined,
        city: city || undefined,
        limit: 20,
    })

    const activeFilterCount = [categoryId, condition, priceMin, priceMax, city].filter(Boolean).length

    const clearAllFilters = () => {
        setCategoryId('')
        setCondition('')
        setPriceMin('')
        setPriceMax('')
        setCity('')
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            {/* Search bar */}
            <SearchBar
                defaultValue={query}
                onSearch={setQuery}
                autoFocus={!query}
            />

            {/* Results header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {isLoading ? 'Pretraga...' : `${results?.items?.length ?? 0} oglasa`}
                    {query && <span className="font-medium text-foreground"> za &quot;{query}&quot;</span>}
                </p>
                <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border transition-colors ${activeFilterCount > 0
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'border-border text-muted-foreground'
                        }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filteri
                    {activeFilterCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2">
                    {categoryId && (
                        <FilterChip
                            label={categories?.find((c: any) => c.id === categoryId)?.name ?? categoryId}
                            onRemove={() => setCategoryId('')}
                        />
                    )}
                    {condition && (
                        <FilterChip
                            label={CONDITIONS.find(c => c.value === condition)?.label ?? condition}
                            onRemove={() => setCondition('')}
                        />
                    )}
                    {(priceMin || priceMax) && (
                        <FilterChip
                            label={`${priceMin || '0'} – ${priceMax || '∞'} RSD`}
                            onRemove={() => { setPriceMin(''); setPriceMax('') }}
                        />
                    )}
                    {city && (
                        <FilterChip
                            label={city}
                            onRemove={() => setCity('')}
                        />
                    )}
                    <button onClick={clearAllFilters} className="text-xs text-red-500 underline">
                        Obriši sve
                    </button>
                </div>
            )}

            {/* Filter panel */}
            {showFilters && (
                <div className="bg-secondary/30 rounded-2xl p-4 space-y-4 border border-border">
                    {/* Category */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kategorija</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {categories?.map((cat: any) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${cat.id === categoryId
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-border text-muted-foreground hover:border-primary/30'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Condition */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stanje</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {CONDITIONS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setCondition(c.value === condition ? '' : c.value)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${c.value === condition
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-border text-muted-foreground'
                                        }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* City */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grad</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                placeholder="Pr. Beograd"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="w-full text-sm border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 bg-card"
                            />
                        </div>
                    </div>

                    {/* Price range */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cena (RSD)</label>
                        <div className="flex gap-2 mt-2">
                            <input
                                type="number"
                                placeholder="Od"
                                value={priceMin}
                                onChange={e => setPriceMin(e.target.value)}
                                className="flex-1 text-sm border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 bg-card"
                            />
                            <input
                                type="number"
                                placeholder="Do"
                                value={priceMax}
                                onChange={e => setPriceMax(e.target.value)}
                                className="flex-1 text-sm border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 bg-card"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Results grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-secondary animate-pulse" />
                    ))}
                </div>
            ) : results?.items?.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="font-semibold text-foreground mb-1">Nema rezultata</h3>
                    <p className="text-sm text-muted-foreground">
                        Pokušaj sa drugačijim pojmom ili ukloni filtere
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {results?.items?.map(listing => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            )}
        </div>
    )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full border border-primary/20">
            {label}
            <button onClick={onRemove}>
                <X className="w-3 h-3" />
            </button>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                <div className="h-12 bg-secondary rounded-2xl animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-secondary animate-pulse" />
                    ))}
                </div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    )
}
