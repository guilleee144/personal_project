'use client'

import { useState, useEffect } from 'react'
import ItemsCategory from './Itemscategory'

interface Category {
  id: string
  name: string
  icon: string
  count: number
  dlc_count: number
  has_dlc: boolean
}

export default function Items() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:8000/items')
        const data = await res.json()
        const cats: Category[] = data.categories || []
        setCategories(cats)

        // Fetch 1 sola imagen por categoría (limit=1), sin aleatoriedad
        const images: Record<string, string> = {}
        await Promise.all(
          cats.map(async (cat) => {
            try {
              const itemRes = await fetch(`http://localhost:8000/items/${cat.id}?limit=5`)
              const itemData = await itemRes.json()
              const withImage = (itemData.items || []).find((item: any) => item.image)
              if (withImage) images[cat.id] = withImage.image
            } catch {
              // silently ignore
            }
          })
        )
        setCategoryImages(images)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, []) // Solo se ejecuta una vez al montar

  if (selectedCategory) {
    return <ItemsCategory category={selectedCategory} onBack={() => setSelectedCategory(null)} />
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#070604] gap-3">
        <div className="w-8 h-8 border-2 border-[#c6a15b]/30 border-t-[#c6a15b] rounded-full animate-spin" />
        <span className="text-stone-500 text-xs uppercase tracking-widest">Loading items…</span>
      </div>
    )
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.count, 0)
  const totalDlc = categories.reduce((sum, cat) => sum + cat.dlc_count, 0)

  return (
    <section className="relative w-full bg-[#070604] py-12 font-serif text-stone-200 min-h-[calc(100vh-64px)] flex flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(198,161,91,0.08),transparent_60%)]" />

      <div className="relative z-10 w-full px-0 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8 text-center px-8">
          <span className="inline-block mb-2 text-[#c6a15b] text-xs uppercase tracking-[0.3em] font-bold">
            ◆ Complete Database
          </span>
          <h1 className="text-5xl font-bold uppercase tracking-[0.08em] text-[#e5c77e] mb-2">
            Items & Equipment
          </h1>
          <p className="text-stone-400 font-serif italic max-w-2xl mx-auto text-sm leading-relaxed">
            Explore every weapon, armor, talisman, and item in the Lands Between and the Shadow of the Erdtree
          </p>
        </div>

        {/* Categories Grid */}
        <div className="px-8 mb-auto flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="group relative overflow-hidden rounded border border-[#c6a15b]/20 bg-[#0f0e0a]/70 transition-all duration-300 hover:border-[#c6a15b]/60 hover:bg-[#0f0e0a]/90 aspect-square flex flex-col items-center justify-center p-1"
              >
                {categoryImages[category.id] && (
                  <>
                    <img
                      src={categoryImages[category.id]}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 transition-opacity duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e0a] via-[#0f0e0a]/60 to-transparent" />
                  </>
                )}

                <div className="relative z-10 text-center px-1 w-full">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#e5c77e] mb-1 group-hover:text-[#ffe09a] transition-colors line-clamp-2 leading-tight">
                    {category.name}
                  </h3>
                  <span className="text-[9px] text-stone-400 uppercase tracking-widest block mb-0.5">
                    {category.count}
                  </span>
                  {category.has_dlc && (
                    <span className="inline-block px-1.5 py-0.5 text-[7px] uppercase tracking-widest rounded bg-[#9d4edd]/20 border border-[#9d4edd]/40 text-[#c090ff]">
                      DLC
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c6a15b] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="px-8 py-8 border-t border-[#c6a15b]/10 mt-auto">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12 lg:gap-16">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#c6a15b] mb-1">{totalItems}</div>
              <div className="text-xs uppercase tracking-widest text-stone-500">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#c6a15b] mb-1">{categories.length}</div>
              <div className="text-xs uppercase tracking-widest text-stone-500">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#c090ff] mb-1">{totalDlc}</div>
              <div className="text-xs uppercase tracking-widest text-stone-500">DLC Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#c6a15b] mb-1">100%</div>
              <div className="text-xs uppercase tracking-widest text-stone-500">Complete</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}