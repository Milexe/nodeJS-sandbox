import { useState } from 'react'
import {
  activeRangeFilterCount,
  DRINK_SORT_FIELD_OPTIONS,
  toggleSortOrder,
  type DrinkRangeFilters,
  type DrinkSortField,
  type DrinkSortOrder,
} from '../types/drink-query'
import {
  buildActiveFilterChips,
  normalizeRangeFilters,
  type ActiveFilterChip,
} from '../utils/drinkFilterLabels'
import {
  filterDraftToRangeFilters,
  isOptionalAbvFilterInvalid,
  isOptionalPriceFilterInvalid,
  isOptionalRatingFilterInvalid,
  validateFilterDraft,
  type FilterDraftValues,
} from '../utils/drinkFormValidation'

type FilterDraft = FilterDraftValues

type DrinksCatalogControlsProps = {
  searchInput: string
  onSearchInputChange: (value: string) => void
  sort: DrinkSortField
  order: DrinkSortOrder
  onSortFieldChange: (sort: DrinkSortField) => void
  onSortOrderChange: (order: DrinkSortOrder) => void
  appliedFilters: DrinkRangeFilters
  onFiltersApply: (filters: DrinkRangeFilters) => void
  onRemoveFilterChip: (chipId: ActiveFilterChip['id']) => void
  onClearAll: () => void
  canClear: boolean
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />
    </svg>
  )
}

function SortAscIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.59 5.58L20 12l-8-8-8 8z" />
    </svg>
  )
}

function SortDescIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.59-5.58L4 12l8 8 8-8z" />
    </svg>
  )
}

function filtersToDraft(filters: DrinkRangeFilters): FilterDraft {
  return {
    minAbv: filters.minAbv?.toString() ?? '',
    maxAbv: filters.maxAbv?.toString() ?? '',
    minRating: filters.minRating?.toString() ?? '',
    maxRating: filters.maxRating?.toString() ?? '',
    minPrice: filters.minPrice?.toString() ?? '',
    maxPrice: filters.maxPrice?.toString() ?? '',
  }
}

function draftToFilters(draft: FilterDraft): DrinkRangeFilters {
  return normalizeRangeFilters(filterDraftToRangeFilters(draft))
}

function FilterRangeField({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  step,
  max,
  minInvalid = false,
  maxInvalid = false,
}: {
  label: string
  minValue: string
  maxValue: string
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
  step?: string
  max?: number
  minInvalid?: boolean
  maxInvalid?: boolean
}) {
  return (
    <div className="drinks-catalog__field">
      <span className="drinks-catalog__field-label">{label}</span>
      <div className="drinks-catalog__field-inputs">
        <input
          className={`drinks-catalog__input drinks-catalog__input--compact${minInvalid ? ' drinks-catalog__input--invalid' : ''}`}
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          max={max}
          placeholder="Min"
          value={minValue}
          aria-invalid={minInvalid}
          onChange={(event) => onMinChange(event.target.value)}
        />
        <span className="drinks-catalog__field-sep" aria-hidden="true">
          –
        </span>
        <input
          className={`drinks-catalog__input drinks-catalog__input--compact${maxInvalid ? ' drinks-catalog__input--invalid' : ''}`}
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          max={max}
          placeholder="Max"
          value={maxValue}
          aria-invalid={maxInvalid}
          onChange={(event) => onMaxChange(event.target.value)}
        />
      </div>
    </div>
  )
}

export default function DrinksCatalogControls({
  searchInput,
  onSearchInputChange,
  sort,
  order,
  onSortFieldChange,
  onSortOrderChange,
  appliedFilters,
  onFiltersApply,
  onRemoveFilterChip,
  onClearAll,
  canClear,
}: DrinksCatalogControlsProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtersTouched, setFiltersTouched] = useState(false)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [draft, setDraft] = useState<FilterDraft>(() =>
    filtersToDraft(appliedFilters),
  )

  const activeChips = buildActiveFilterChips(appliedFilters)
  const activeFilterCount = activeRangeFilterCount(appliedFilters)

  function handleToggleFilters() {
    setFiltersOpen((open) => {
      if (!open) {
        setDraft(filtersToDraft(appliedFilters))
        setFiltersTouched(false)
        setFilterError(null)
      }
      return !open
    })
  }

  function updateDraft(patch: Partial<FilterDraft>) {
    setDraft((current) => ({ ...current, ...patch }))
    setFilterError(null)
  }

  function handleApplyFilters() {
    setFiltersTouched(true)
    const validationError = validateFilterDraft(draft)
    if (validationError) {
      setFilterError(validationError)
      return
    }

    onFiltersApply(draftToFilters(draft))
    setFiltersOpen(false)
  }

  function handleClearDraft() {
    setDraft(filtersToDraft({}))
    setFiltersTouched(false)
    setFilterError(null)
  }

  return (
    <section className="drinks-catalog" aria-label="Catalog search and filters">
      <div className="drinks-catalog__row">
        <input
          className="drinks-catalog__input drinks-catalog__input--search"
          type="search"
          placeholder="Search by title…"
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
        />

        <div className="drinks-catalog__toolbar">
          <div className="drinks-catalog__sort-group">
            <select
              className="drinks-catalog__select drinks-catalog__select--sort"
              value={sort}
              aria-label="Sort by"
              onChange={(event) =>
                onSortFieldChange(event.target.value as DrinkSortField)
              }
            >
              {DRINK_SORT_FIELD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="drinks-catalog__icon-btn drinks-catalog__icon-btn--sort"
              aria-label={
                order === 'asc'
                  ? 'Sorted ascending. Switch to descending.'
                  : 'Sorted descending. Switch to ascending.'
              }
              onClick={() => onSortOrderChange(toggleSortOrder(order))}
            >
              {order === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
            </button>
          </div>

          <button
            type="button"
            className={`drinks-catalog__filters-btn${filtersOpen ? ' drinks-catalog__filters-btn--open' : ''}`}
            aria-expanded={filtersOpen}
            aria-controls="drinks-catalog-filters"
            onClick={handleToggleFilters}
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="drinks-catalog__filters-count">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          {canClear ? (
            <button
              type="button"
              className="drinks-catalog__icon-btn drinks-catalog__icon-btn--clear"
              aria-label="Clear search and filters"
              onClick={onClearAll}
            >
              <ClearIcon />
            </button>
          ) : null}
        </div>
      </div>

      {activeChips.length > 0 ? (
        <div className="drinks-catalog__active">
          {activeChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="drinks-catalog__chip"
              onClick={() => onRemoveFilterChip(chip.id)}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}

      {filtersOpen ? (
        <div id="drinks-catalog-filters" className="drinks-catalog__panel">
          <div className="drinks-catalog__panel-grid">
            <FilterRangeField
              label="ABV %"
              minValue={draft.minAbv}
              maxValue={draft.maxAbv}
              step="0.1"
              max={100}
              minInvalid={filtersTouched && isOptionalAbvFilterInvalid(draft.minAbv)}
              maxInvalid={filtersTouched && isOptionalAbvFilterInvalid(draft.maxAbv)}
              onMinChange={(value) => updateDraft({ minAbv: value })}
              onMaxChange={(value) => updateDraft({ maxAbv: value })}
            />

            <FilterRangeField
              label="Rating"
              minValue={draft.minRating}
              maxValue={draft.maxRating}
              step="0.1"
              max={5}
              minInvalid={
                filtersTouched && isOptionalRatingFilterInvalid(draft.minRating)
              }
              maxInvalid={
                filtersTouched && isOptionalRatingFilterInvalid(draft.maxRating)
              }
              onMinChange={(value) => updateDraft({ minRating: value })}
              onMaxChange={(value) => updateDraft({ maxRating: value })}
            />

            <FilterRangeField
              label="Price"
              minValue={draft.minPrice}
              maxValue={draft.maxPrice}
              step="0.01"
              minInvalid={
                filtersTouched && isOptionalPriceFilterInvalid(draft.minPrice)
              }
              maxInvalid={
                filtersTouched && isOptionalPriceFilterInvalid(draft.maxPrice)
              }
              onMinChange={(value) => updateDraft({ minPrice: value })}
              onMaxChange={(value) => updateDraft({ maxPrice: value })}
            />
          </div>

          {filterError ? (
            <p className="drinks-catalog__panel-error">{filterError}</p>
          ) : null}

          <div className="drinks-catalog__panel-actions">
            <button
              type="button"
              className="drinks-catalog__panel-btn drinks-catalog__panel-btn--ghost"
              onClick={handleClearDraft}
            >
              Reset
            </button>
            <button
              type="button"
              className="drinks-catalog__panel-btn drinks-catalog__panel-btn--apply"
              onClick={handleApplyFilters}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
