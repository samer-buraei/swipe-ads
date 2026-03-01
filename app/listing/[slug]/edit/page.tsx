'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/trpc'
import { CONDITIONS } from '@/lib/constants'

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const { data: listing, isLoading } = api.listing.get.useQuery({ slug })
  const utils = api.useUtils()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [condition, setCondition] = useState('GOOD')
  const [error, setError] = useState('')

  useEffect(() => {
    if (listing) {
      setTitle(listing.title)
      setDescription(listing.description)
      setPrice(String(listing.price))
      setCity(listing.city)
      setCondition(listing.condition)
    }
  }, [listing])

  const update = api.listing.update.useMutation({
    onSuccess: () => {
      utils.listing.get.invalidate({ slug })
      router.push(`/listing/${slug}`)
    },
    onError: (err) => setError(err.message),
  })

  if (isLoading) return <div className="p-8 text-center text-gray-500">Učitavanje...</div>
  if (!listing) return <div className="p-8 text-center text-gray-500">Oglas nije pronađen.</div>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    update.mutate({
      id: listing.id,
      title,
      description,
      price: Number(price),
      city,
      condition: condition as any,
    })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-32">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Izmeni oglas</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Naslov</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cena (RSD)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grad</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stanje</label>
          <select
            value={condition}
            onChange={e => setCondition(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {CONDITIONS.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={update.isLoading}
            className="flex-1 bg-indigo-500 text-white rounded-2xl py-3 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {update.isLoading ? 'Čuvanje...' : 'Sačuvaj izmene'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 border border-gray-200 text-gray-500 rounded-2xl py-3 text-sm hover:bg-gray-50"
          >
            Otkaži
          </button>
        </div>

      </form>
    </div>
  )
}
