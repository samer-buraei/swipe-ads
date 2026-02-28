'use client'
import { useState, useRef, useCallback } from 'react'
import { X, Camera, ImagePlus, Loader2 } from 'lucide-react'

interface UploadedImage {
    id: string          // Supabase storage path
    url: string         // Public URL from Supabase
    localPreview: string // Blob URL for instant preview
    uploading: boolean
    error?: string
}

interface ImageUploaderProps {
    value: UploadedImage[]
    onChange: (images: UploadedImage[]) => void
    maxImages?: number
}

export type { UploadedImage }

export function ImageUploader({ value, onChange, maxImages = 5 }: ImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const uploadFile = async (file: File): Promise<{ id: string; url: string }> => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error ?? 'Upload failed')
        }

        return response.json()
    }

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files) return
        const remaining = maxImages - value.length
        const toProcess = Array.from(files).slice(0, remaining)

        // Add placeholders immediately with local preview
        const placeholders: UploadedImage[] = toProcess.map(file => ({
            id: '',
            url: '',
            localPreview: URL.createObjectURL(file),
            uploading: true,
        }))

        const startIndex = value.length
        const merged = [...value, ...placeholders]
        onChange(merged)

        // Upload each file sequentially, updating state as we go
        let current = merged
        for (let i = 0; i < toProcess.length; i++) {
            try {
                const result = await uploadFile(toProcess[i])
                const updated = [...current]
                updated[startIndex + i] = {
                    id: result.id,
                    url: result.url,
                    localPreview: current[startIndex + i].localPreview,
                    uploading: false,
                }
                current = updated
                onChange(updated)
            } catch (err) {
                const updated = [...current]
                updated[startIndex + i] = {
                    ...updated[startIndex + i],
                    uploading: false,
                    error: err instanceof Error ? err.message : 'Greška pri uploadu',
                }
                current = updated
                onChange(updated)
            }
        }
    }, [value, onChange, maxImages])

    const removeImage = (index: number) => {
        const updated = [...value]
        URL.revokeObjectURL(updated[index].localPreview)
        updated.splice(index, 1)
        onChange(updated)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        handleFiles(e.dataTransfer.files)
    }

    const canAddMore = value.length < maxImages

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                    Slike ({value.length}/{maxImages})
                </span>
                {value.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                        Prva slika je naslovna
                    </span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {/* Existing images */}
                {value.map((img, index) => (
                    <div
                        key={img.localPreview}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${index === 0 ? 'border-primary' : 'border-border'
                            }`}
                    >
                        <img
                            src={img.localPreview}
                            alt={`Slika ${index + 1}`}
                            className="w-full h-full object-cover"
                        />

                        {/* Primary badge */}
                        {index === 0 && (
                            <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-md font-medium">
                                Naslovna
                            </div>
                        )}

                        {/* Upload progress overlay */}
                        {img.uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}

                        {/* Error overlay */}
                        {img.error && (
                            <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-1">
                                <span className="text-white text-xs text-center">{img.error}</span>
                            </div>
                        )}

                        {/* Remove button */}
                        {!img.uploading && (
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}

                {/* Add more slot */}
                {canAddMore && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                        className={`aspect-square rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors ${value.length === 0 ? 'col-span-3 sm:col-span-4 aspect-video' : ''
                            }`}
                    >
                        {value.length === 0 ? (
                            <>
                                <Camera className="w-8 h-8 text-primary/50" />
                                <span className="text-sm font-medium text-primary">Dodaj slike</span>
                                <span className="text-xs text-muted-foreground">ili prevuci ovde</span>
                            </>
                        ) : (
                            <ImagePlus className="w-6 h-6 text-primary/50" />
                        )}
                    </button>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
            />

            {/* Tip */}
            {value.length === 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    💡 Oglasi sa 5+ slika dobijaju 3× više upita
                </p>
            )}
        </div>
    )
}
