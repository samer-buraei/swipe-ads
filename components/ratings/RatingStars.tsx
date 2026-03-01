interface RatingStarsProps {
  score: number
  count?: number
  size?: 'sm' | 'md'
}

export function RatingStars({ score, count, size = 'md' }: RatingStarsProps) {
  const starSize = size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`${starSize} ${i <= Math.round(score) ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </span>
      ))}
      {count !== undefined && (
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-500 ml-1`}>
          {score > 0 ? score.toFixed(1) : ''} ({count})
        </span>
      )}
    </div>
  )
}
