'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc'
import { X } from 'lucide-react'

interface RateSellerModalProps {
  toUserId: string
  sellerName: string | null
  listingId?: string
  onClose: () => void
  onSuccess: () => void
}

export function RateSellerModal({ toUserId, sellerName, listingId, onClose, onSuccess }: RateSellerModalProps) {
  const [score, setScore] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const createRating = api.rating.create.useMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  const handleSubmit = () => {
    if (score === 0) { setError('Izaberite ocenu.'); return }
    setError('')
    createRating.mutate({ toUserId, listingId, score, comment: comment || undefined })
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">Ocenite prodavca</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Kako biste ocenili {sellerName ?? 'ovog prodavca'}?
        </p>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setScore(i)}
              className={`text-4xl transition-colors ${i <= (hover || score) ? 'text-amber-400' : 'text-gray-200'}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Komentar (opcionalno)"
          rows={3}
          maxLength={500}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={createRating.isLoading || score === 0}
          className="w-full bg-indigo-500 text-white rounded-2xl py-3 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {createRating.isLoading ? 'Slanje...' : 'Pošalji ocenu'}
        </button>
      </div>
    </div>
  )
}
