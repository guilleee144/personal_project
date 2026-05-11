'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Search, X, ChevronUp, ChevronDown } from 'lucide-react'

interface Item {
  id: number
  name: string
  image?: string
  dlc?: boolean
  [key: string]: any
}

interface ItemsCategoryProps {
  category: string
  onBack: () => void
}

const TABLE_SCHEMA: Record<string, string[]> = {
  ammos:            ['id', 'name', 'image', 'type', 'damage_type', 'attack_power', 'passive_effect', 'description', 'dlc'],
  armors:           ['id', 'name', 'image', 'description', 'type', 'damage_negation', 'resistance', 'weight', 'special_effect', 'how_to_acquire', 'dlc'],
  ashes_of_war:     ['id', 'name', 'image', 'affinity', 'skill', 'description', 'dlc'],
  bell_bearings:    ['id', 'name', 'image', 'type', 'effect', 'description', 'dlc'],
  bosses:           ['id', 'name', 'image', 'hp', 'locations_and_drops', 'blockquote', 'dlc'],
  consumables:      ['id', 'name', 'image', 'effect', 'fp_cost', 'description', 'dlc'],
  cookbooks:        ['id', 'name', 'image', 'effect', 'required_for', 'description', 'dlc'],
  creatures:        ['id', 'name', 'image', 'locations', 'drops', 'blockquote', 'dlc'],
  crystal_tears:    ['id', 'name', 'image', 'effect', 'description', 'dlc'],
  great_runes:      ['id', 'name', 'image', 'type', 'description', 'effect', 'boss', 'location', 'dlc'],
  incantations:     ['id', 'name', 'image', 'description', 'effect', 'fp', 'slot', 'int_req', 'fai_req', 'arc_req', 'stamina_cost', 'bonus', 'group_name', 'location', 'dlc'],
  key_items:        ['id', 'name', 'image', 'description', 'type', 'usage', 'location', 'dlc'],
  locations:        ['id', 'name', 'image', 'region', 'description', 'dlc'],
  materials:        ['id', 'name', 'image', 'effect', 'description', 'dlc'],
  multi_items:      ['id', 'name', 'image', 'type', 'effect', 'description', 'dlc'],
  npcs:             ['id', 'name', 'image', 'location', 'role', 'quote', 'drops', 'description', 'dlc', 'voiced_by'],
  remembrances:     ['id', 'name', 'image', 'type', 'description', 'option_1', 'option_2', 'value', 'boss', 'dlc'],
  shields:          ['id', 'name', 'image', 'weight', 'description', 'dlc', 'requirements', 'damage_type', 'category', 'passive_effect', 'skill', 'fp_cost'],
  skills:           ['id', 'name', 'image', 'type', 'equipment', 'charge', 'fp', 'effect', 'locations', 'dlc'],
  sorceries:        ['id', 'name', 'image', 'description', 'effect', 'fp', 'slot', 'int_req', 'fai_req', 'arc_req', 'stamina_cost', 'bonus', 'location', 'dlc'],
  spirit_ashes:     ['id', 'name', 'image', 'type', 'fp_cost', 'hp_cost', 'effect', 'description', 'dlc'],
  talismans:        ['id', 'name', 'image', 'effect', 'weight', 'value', 'description', 'dlc'],
  tools:            ['id', 'name', 'image', 'description', 'type', 'usage', 'location', 'dlc'],
  upgrade_materials:['id', 'name', 'image', 'description', 'effect', 'dlc'],
  weapons:          ['id', 'name', 'image', 'weight', 'description', 'dlc', 'requirements', 'damage_type', 'category', 'passive_effect', 'skill', 'fp_cost'],
  whetblades:       ['id', 'name', 'image', 'description', 'usage', 'location', 'dlc'],
}

const TABLE_PREVIEW_COLS: Record<string, string[]> = {
  ammos:            [],
  armors:           [],
  ashes_of_war:     [],
  bell_bearings:    [],
  bosses:           [],
  consumables:      [],
  cookbooks:        [],
  creatures:        [],
  crystal_tears:    [],
  great_runes:      [],
  incantations:     [],
  key_items:        [],
  locations:        [],
  materials:        [],
  multi_items:      [],
  npcs:             [],
  remembrances:     [],
  shields:          [],
  skills:           [],
  sorceries:        [],
  spirit_ashes:     [],
  talismans:        [],
  tools:            [],
  upgrade_materials:[],
  weapons:          [],
  whetblades:       [],
}

const WIDE_FIELDS = new Set([
  'description', 'effect', 'blockquote', 'quote', 'locations', 'drops',
  'locations_and_drops', 'required_for', 'how_to_acquire', 'usage',
  'option_1', 'option_2', 'bonus', 'group_name', 'damage_negation',
  'resistance', 'attack_power', 'requirements', 'special_effect', 'passive_effect',
])

// Campos que son JSONB y necesitan renderizado especial como tabla
const JSONB_FIELDS = new Set([
  'damage_negation', 'resistance', 'attack_power', 'requirements',
  'locations_and_drops', 'required_for', 'locations', 'drops',
])

// Renderiza un valor JSONB como pares clave-valor limpios, sin {}"[]
const renderJsonb = (value: any): { key: string; val: string }[] => {
  if (value === null || value === undefined) return []

  // Si llega como string (a veces Supabase lo manda así), parsearlo
  let parsed = value
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value) } catch { return [{ key: '', val: value }] }
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item, i) => {
      if (typeof item === 'object' && item !== null) {
        const parts = Object.entries(item)
          .map(([k, v]) => `${cleanKey(k)}: ${v}`)
          .join('  ·  ')
        return { key: String(i + 1), val: parts }
      }
      return { key: String(i + 1), val: String(item) }
    })
  }

  if (typeof parsed === 'object' && parsed !== null) {
    return Object.entries(parsed).map(([k, v]) => ({
      key: cleanKey(k),
      val: typeof v === 'object' ? renderJsonb(v).map(r => r.val).join(', ') : String(v ?? '-'),
    }))
  }

  return [{ key: '', val: String(parsed) }]
}

const cleanKey = (k: string) =>
  k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// Formato simple para preview en tabla (texto corto)
const formatValueShort = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'object') {
    // JSONB: sacar solo los valores, sin llaves ni corchetes
    const rows = renderJsonb(value)
    const text = rows.map(r => r.key ? `${r.key}: ${r.val}` : r.val).join(' · ')
    return text.length > 60 ? text.slice(0, 58) + '...' : text
  }
  const s = String(value)
  return s.length > 60 ? s.slice(0, 58) + '...' : s
}

export default function ItemsCategory({ category, onBack }: ItemsCategoryProps) {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dlcFilter, setDlcFilter] = useState<'all' | 'base' | 'dlc'>('all')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [modalItem, setModalItem] = useState<Item | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const searchRef = useRef<HTMLInputElement>(null)

  const schema = TABLE_SCHEMA[category] || []
  const previewCols = TABLE_PREVIEW_COLS[category] || []
  const categoryDisplayName = category
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      try {
        const res = await fetch(`http://localhost:8000/items/${category}?limit=500`)
        const data = await res.json()
        setItems(data.items || [])
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [category])

  useEffect(() => {
    let result = [...items]
    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter(item => item.name.toLowerCase().includes(s))
    }
    if (dlcFilter === 'base') result = result.filter(item => !item.dlc)
    else if (dlcFilter === 'dlc') result = result.filter(item => item.dlc)
    result.sort((a, b) => {
      const av = formatValueShort(a[sortKey])
      const bv = formatValueShort(b[sortKey])
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    setFilteredItems(result)
  }, [items, search, dlcFilter, sortKey, sortDir])

  const openModal = async (item: Item) => {
    setSelectedItem(item)
    setModalItem(null)
    setModalLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/items/${category}/${item.id}`)
      const data = await res.json()
      setModalItem(data.item || item)
    } catch {
      setModalItem(item)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedItem(null)
    setModalItem(null)
  }

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <span className="text-stone-700 ml-1 text-[10px]">↕</span>
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="inline ml-1 text-[#c6a15b]" />
      : <ChevronDown size={12} className="inline ml-1 text-[#c6a15b]" />
  }

  // Mapeo de tipos de armadura
  const ARMOR_TYPE_MAP: Record<string, string> = {
    'helm': 'Head Armor',
    'chest armor': 'Chest Armor',
    'gauntlets': 'Hands Armor',
    'leg armor': 'Leg Armor',
  }

  const formatArmorType = (val: string): string => {
    const lower = val.toLowerCase().trim()
    return ARMOR_TYPE_MAP[lower] ?? val.replace(/\b\w/g, c => c.toUpperCase())
  }

  // Renderiza un campo en el modal, detectando si es JSONB
  const renderModalField = (key: string, value: any) => {
    if (key === 'dlc') {
      return (
        <span className={value ? 'text-[#c090ff]' : 'text-stone-400'}>
          {value ? 'Shadow of the Erdtree' : 'Base Game'}
        </span>
      )
    }

    if (key === 'type' && category === 'armors' && typeof value === 'string') {
      return <span className="text-stone-300">{formatArmorType(value)}</span>
    }

    // JSONB: renderizar como tabla de pares clave-valor
    if (JSONB_FIELDS.has(key) || typeof value === 'object') {
      const rows = renderJsonb(value)
      if (rows.length === 0) return <span className="text-stone-600">-</span>
      return (
        <div className="space-y-1">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              {row.key && (
                <span className="text-stone-500 shrink-0 min-w-[80px]">{row.key}</span>
              )}
              <span className="text-stone-300">{row.val}</span>
            </div>
          ))}
        </div>
      )
    }

    return <span className="text-stone-300">{String(value)}</span>
  }

  return (
    <section className="relative min-h-[calc(100vh-64px)] bg-[#070604] font-serif text-stone-200 w-full flex flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(198,161,91,0.07),transparent_60%)]" />

      {/* Top bar sticky */}
      <div className="relative z-10 border-b border-[#c6a15b]/15 bg-[#070604]/90 backdrop-blur-sm sticky top-0">
        <div className="px-6 py-3 flex items-center gap-3 w-full">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-stone-500 hover:text-[#c6a15b] transition-colors text-xs uppercase tracking-widest shrink-0"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div className="h-4 w-px bg-[#c6a15b]/20 shrink-0" />

          <h1 className="text-sm font-bold uppercase tracking-[0.12em] text-[#e5c77e] shrink-0">
            {categoryDisplayName}
          </h1>

          <span className="text-xs text-stone-600 shrink-0">
            {filteredItems.length} items
          </span>

          <div className="flex-1 min-w-0 mx-4 flex items-center gap-2 bg-[#0f0e0a] border border-[#c6a15b]/20 rounded px-3 py-1.5 focus-within:border-[#c6a15b]/50 transition-colors">
            <Search size={13} className="text-stone-500 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); searchRef.current?.focus() }}
                className="text-stone-600 hover:text-stone-300 shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex gap-1 shrink-0">
            {(['all', 'base', 'dlc'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDlcFilter(f)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-widest rounded transition-all font-bold ${
                  dlcFilter === f
                    ? f === 'dlc'
                      ? 'bg-[#9d4edd]/30 border border-[#9d4edd]/60 text-[#c090ff]'
                      : 'bg-[#c6a15b]/20 border border-[#c6a15b]/50 text-[#c6a15b]'
                    : 'bg-transparent border border-[#c6a15b]/15 text-stone-500 hover:text-stone-300 hover:border-[#c6a15b]/30'
                }`}
              >
                {f === 'all' ? 'All' : f === 'base' ? 'Base' : 'DLC'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative z-10 flex-1 overflow-auto px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-8 h-8 border-2 border-[#c6a15b]/30 border-t-[#c6a15b] rounded-full animate-spin" />
            <span className="text-stone-500 text-xs uppercase tracking-widest">Loading {categoryDisplayName}...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-2 text-stone-600">
            <span className="text-sm">No items found</span>
          </div>
        ) : (
          <div className="rounded-lg border border-[#c6a15b]/20 overflow-hidden bg-[#0a0906]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#c6a15b]/20 bg-[#070604]">
                    <th className="w-14 px-3 py-3 text-center">
                      <span className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">Img</span>
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer select-none group"
                      onClick={() => toggleSort('name')}
                    >
                      <span className="text-[10px] uppercase tracking-widest text-[#c6a15b] font-bold group-hover:text-[#e5c77e] transition-colors">
                        Name <SortIcon col="name" />
                      </span>
                    </th>
                    {previewCols.map(col => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left cursor-pointer select-none group hidden md:table-cell"
                        onClick={() => toggleSort(col)}
                      >
                        <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold group-hover:text-stone-300 transition-colors">
                          {col.replace(/_/g, ' ')} <SortIcon col={col} />
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center w-24">
                      <span className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">Ver.</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => openModal(item)}
                      className={`border-b border-[#c6a15b]/8 cursor-pointer transition-colors hover:bg-[#c6a15b]/6 ${
                        idx % 2 === 0 ? 'bg-[#0a0906]' : 'bg-[#0d0b08]'
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <div className="w-9 h-9 mx-auto rounded border border-[#c6a15b]/15 bg-[#070604] flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : (
                            <span className="text-stone-700 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#e5c77e] font-semibold text-sm">{item.name}</span>
                          {item.dlc && (
                            <span className="inline-block px-1.5 py-0.5 text-[8px] uppercase tracking-widest rounded bg-[#9d4edd]/20 border border-[#9d4edd]/40 text-[#c090ff] font-bold leading-none">
                              DLC
                            </span>
                          )}
                        </div>
                      </td>
                      {previewCols.map(col => (
                        <td key={col} className="px-4 py-2.5 hidden md:table-cell">
                          <span className="text-stone-400 text-xs">
                            {item[col] != null ? formatValueShort(item[col]) : <span className="text-stone-700">-</span>}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${item.dlc ? 'text-[#9d4edd]' : 'text-[#c6a15b]/60'}`}>
                          {item.dlc ? 'Shadow' : 'Base'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-[#0d0b08] border border-[#c6a15b]/25 rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-black/60"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#070604] border-b border-[#c6a15b]/20 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {selectedItem.image && (
                  <div className="w-10 h-10 rounded border border-[#c6a15b]/20 bg-[#0a0906] flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="w-full h-full object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-[#e5c77e] uppercase tracking-[0.06em] truncate">
                    {selectedItem.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-stone-500 uppercase tracking-widest">{categoryDisplayName}</span>
                    {selectedItem.dlc && (
                      <span className="inline-block px-2 py-0.5 text-[8px] uppercase tracking-widest rounded bg-[#9d4edd]/20 border border-[#9d4edd]/40 text-[#c090ff] font-bold">
                        Shadow of the Erdtree
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={closeModal} className="text-stone-600 hover:text-[#c6a15b] transition-colors shrink-0 ml-4">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-6 h-6 border-2 border-[#c6a15b]/30 border-t-[#c6a15b] rounded-full animate-spin" />
                  <span className="text-stone-600 text-xs uppercase tracking-widest">Loading details...</span>
                </div>
              ) : modalItem ? (
                <>
                  {/* Imagen grande */}
                  {modalItem.image && (
                    <div className="mb-6 flex justify-center bg-[#070604] rounded-lg border border-[#c6a15b]/15 p-6">
                      <img
                        src={modalItem.image}
                        alt={modalItem.name}
                        className="max-h-48 max-w-full object-contain"
                      />
                    </div>
                  )}

                  {/* Campos — excluir id, image, name (ya está en el header) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {schema
                      .filter(key => {
                        if (['id', 'image', 'name'].includes(key)) return false
                        const val = modalItem[key]
                        if (val === null || val === undefined || val === '') return false
                        // Mostrar incluso arrays/objetos vacíos no, pero sí booleanos
                        if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return false
                        if (Array.isArray(val) && val.length === 0) return false
                        return true
                      })
                      .map(key => (
                        <div
                          key={key}
                          className={`bg-[#070604] rounded border border-[#c6a15b]/10 px-4 py-3 ${
                            WIDE_FIELDS.has(key) ? 'sm:col-span-2' : ''
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-widest text-[#c6a15b]/60 font-bold mb-2">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs leading-relaxed break-words">
                            {renderModalField(key, modalItem[key])}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}