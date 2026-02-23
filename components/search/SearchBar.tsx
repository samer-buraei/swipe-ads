'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock } from 'lucide-react'

const STORAGE_KEY = 'swipemarket_recent_searches'
const MAX_RECENT = 5

function getRecentSearches(): string[] {
    if (typeof window === 'undefined') return []
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    } catch {
        return []
    }
}

function saveSearch(query: string) {
    if (typeof window === 'undefined') return
    const recent = getRecentSearches().filter(s => s !== query)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([query, ...recent].slice(0, MAX_RECENT)))
}

interface SearchBarProps {
    defaultValue?: string
    placeholder?: string
    onSearch?: (query: string) => void
    autoFocus?: boolean
}

export function SearchBar({ defaultValue = '', placeholder = 'Pretraži oglase...', onSearch, autoFocus }: SearchBarProps) {
    const [value, setValue] = useState(defaultValue)
    const [showRecent, setShowRecent] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    useEffect(() => {
        setRecentSearches(getRecentSearches())
    }, [showRecent])

    const handleSubmit = (query: string) => {
        if (!query.trim()) return
        saveSearch(query.trim())
        setShowRecent(false)
        if (onSearch) {
            onSearch(query.trim())
        } else {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        }
    }

    const clearRecentSearch = (term: string) => {
        const updated = recentSearches.filter(s => s !== term)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        setRecentSearches(updated)
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-2xl px-4 py-2.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-md">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onFocus={() => setShowRecent(true)}
                    onBlur={() => setTimeout(() => setShowRecent(false), 150)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit(value)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder-muted-foreground"
                />
                {value && (
                    <button onClick={() => setValue('')} className="hover:text-foreground text-muted-foreground transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Recent searches dropdown */}
            {showRecent && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-2xl shadow-lg border border-border z-50 overflow-hidden">
                    <p className="text-xs text-muted-foreground px-4 pt-3 pb-1">Nedavne pretrage</p>
                    {recentSearches.map(term => (
                        <div key={term} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                            <button
                                className="flex-1 text-sm text-left text-foreground"
                                onMouseDown={() => { setValue(term); handleSubmit(term) }}
                            >
                                {term}
                            </button>
                            <button
                                onMouseDown={() => clearRecentSearch(term)}
                                className="text-muted-foreground/50 hover:text-foreground transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
