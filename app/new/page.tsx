'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CATEGORIES,
  CITIES,
  CONDITIONS,
  ROUTES,
  type CategoryId,
  type ConditionId
} from '@/lib/constants';
import { DynamicAttributeFields } from '@/components/listings/DynamicAttributeFields';
import { ImageUploader, type UploadedImage } from '@/components/listings/ImageUploader';
import { ArrowLeft, Camera, Check, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function NewListingPage() {
  const router = useRouter();

  // Base fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'RSD' | 'EUR'>('RSD');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [categoryId, setCategoryId] = useState<CategoryId>(CATEGORIES[0].id);
  const [condition, setCondition] = useState<ConditionId>(CONDITIONS[2].id);
  const [city, setCity] = useState<string>(CITIES[0].name);
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Category-specific attributes
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = api.listing.create.useMutation({
    onSuccess: (data) => {
      router.push(ROUTES.listing(data.slug));
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  // Handle category change - reset attributes when category changes
  const handleCategoryChange = useCallback((newCategoryId: CategoryId) => {
    setCategoryId(newCategoryId);
    setAttributes({});
    setAttributeErrors({});
  }, []);

  // Handle attribute field change
  const handleAttributeChange = useCallback((name: string, value: unknown) => {
    setAttributes(prev => {
      const newAttrs = { ...prev };
      if (value === undefined || value === '') {
        delete newAttrs[name];
      } else {
        newAttrs[name] = value;
      }
      return newAttrs;
    });
    // Clear error for this field
    setAttributeErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  // Get lat/lng from city
  const getCoordinates = useCallback(() => {
    const cityData = CITIES.find(c => c.name === city);
    return cityData ? { latitude: cityData.lat, longitude: cityData.lng } : {};
  }, [city]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title || title.length < 3) {
      newErrors.title = 'Naslov mora imati najmanje 3 karaktera';
    }
    if (!description || description.length < 10) {
      newErrors.description = 'Opis mora imati najmanje 10 karaktera';
    }
    if (!price || Number(price) < 0) {
      newErrors.price = 'Unesite validnu cenu';
    }

    // Check if images are still uploading
    if (images.some(img => img.uploading)) {
      newErrors.images = 'Sačekajte da se slike učitaju';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description, price, images]);

  const handleSubmit = () => {
    if (!validateForm()) {
      // Scroll to error?
      return;
    }

    const uploadedIds = images.filter(img => img.id).map(img => img.id);
    const coords = getCoordinates();

    createMutation.mutate({
      title,
      description,
      price: Number(price),
      currency,
      isNegotiable,
      categoryId,
      condition,
      city,
      address: address || undefined,
      latitude: coords.latitude,
      longitude: coords.longitude,
      imageIds: uploadedIds.length ? uploadedIds : [crypto.randomUUID()],
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 max-w-4xl mx-auto"
    >
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Postavi oglas</h1>
          <p className="text-muted-foreground">Popunite detalje o vašem artiklu.</p>
        </div>
      </div>

      <div className="space-y-8">
        {errors.submit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive"
          >
            {errors.submit}
          </motion.div>
        )}

        {/* Info Card */}
        <section className="rounded-[2.5rem] bg-card p-8 shadow-[0_2px_40px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
          <div className="mb-6 flex items-center gap-2 text-primary">
            <Tag className="h-5 w-5" />
            <h2 className="font-bold uppercase tracking-widest text-xs">Osnovno</h2>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-2">
              <label className="text-sm font-semibold ml-1">Naslov</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Šta prodajete?"
                className={cn("text-lg", errors.title && "ring-2 ring-destructive/20")}
              />
              {errors.title && <p className="text-xs text-destructive ml-1">{errors.title}</p>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold ml-1">Opis</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detaljan opis predmeta..."
                rows={5}
                className={errors.description ? "ring-2 ring-destructive/20" : ""}
              />
              {errors.description && <p className="text-xs text-destructive ml-1">{errors.description}</p>}
            </div>
          </div>
        </section>

        {/* Details Card */}
        <section className="rounded-[2.5rem] bg-card p-8 shadow-[0_2px_40px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
          <div className="mb-6 flex items-center gap-2 text-primary">
            <div className="h-5 w-5 rounded-full border-2 border-primary" />
            <h2 className="font-bold uppercase tracking-widest text-xs">Detalji</h2>
          </div>

          <div className="grid gap-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Kategorija</label>
                <div className="relative">
                  <select
                    className="h-14 w-full appearance-none rounded-2xl bg-secondary/50 px-4 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value as CategoryId)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-50">
                    ▼
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Stanje</label>
                <div className="relative">
                  <select
                    className="h-14 w-full appearance-none rounded-2xl bg-secondary/50 px-4 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ConditionId)}
                  >
                    {CONDITIONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-50">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Attributes */}
            <div className="rounded-2xl bg-secondary/20 p-6">
              <DynamicAttributeFields
                categoryId={categoryId}
                values={attributes}
                onChange={handleAttributeChange}
                errors={attributeErrors}
              />
            </div>

            {/* Price */}
            <div className="space-y-4">
              <label className="text-sm font-semibold ml-1">Cena</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="pl-8 text-lg font-bold"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-muted-foreground">
                    {currency === 'EUR' ? '€' : 'RSD'}
                  </span>
                </div>

                <div className="relative w-32">
                  <select
                    className="h-12 w-full appearance-none rounded-2xl bg-secondary/50 px-4 text-center font-bold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'RSD' | 'EUR')}
                  >
                    <option value="RSD">RSD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location & Images */}
        <div className="grid gap-8 md:grid-cols-2">
          <section className="rounded-[2.5rem] bg-card p-8 shadow-[0_2px_40px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            <div className="mb-6 flex items-center gap-2 text-primary">
              <MapPin className="h-5 w-5" />
              <h2 className="font-bold uppercase tracking-widest text-xs">Lokacija</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold ml-1 mb-2 block">Grad</label>
                <div className="relative">
                  <select
                    className="h-12 w-full appearance-none rounded-2xl bg-secondary/50 px-4 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    {CITIES.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-50">▼</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold ml-1 mb-2 block">Adresa</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ulica i broj (opciono)"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[2.5rem] bg-card p-8 shadow-[0_2px_40px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            <div className="mb-6 flex items-center gap-2 text-primary">
              <Camera className="h-5 w-5" />
              <h2 className="font-bold uppercase tracking-widest text-xs">Fotografije</h2>
            </div>

            <ImageUploader
              value={images}
              onChange={setImages}
              maxImages={15}
            />
            {errors.images && <p className="text-xs text-destructive mt-2">{errors.images}</p>}
          </section>
        </div>

        {/* Submit Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-black/5 md:bg-transparent md:border-none md:static md:p-0">
          <div className="max-w-4xl mx-auto flex gap-4">
            <Button
              variant="ghost"
              className="flex-1 md:flex-none rounded-xl h-14"
              onClick={() => router.back()}
            >
              Otkaži
            </Button>
            <Button
              className="flex-[2] rounded-xl h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
              onClick={handleSubmit}
              disabled={createMutation.isLoading || !title || !price}
            >
              {createMutation.isLoading ? 'Objavljujem...' : 'Objavi oglas'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
