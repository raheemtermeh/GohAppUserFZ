import { useStore } from '../state/apiStore'
import type { EventCategoryType } from '../data/events'
import { useLanguage } from '../contexts/LanguageContext'

interface FilterChipProps {
  category: EventCategoryType
  isActive?: boolean
  onClick?: () => void
}

export default function FilterChip({ category, isActive, onClick }: FilterChipProps) {
  const { state } = useStore()
  const { t } = useLanguage()
  const active = isActive !== undefined ? isActive : state.filters.categories.some(cat => cat.id === category.id)

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Default behavior - toggle category in store
      // This would need to be implemented in the parent component
    }
  }

  return (
    <button 
      onClick={handleClick}
      className={`chip whitespace-nowrap transition-all duration-200 hover:scale-105 ${
        active ? 'chip-active shadow-glow' : 'hover:bg-slate-700/60 hover:border-slate-600'
      }`}
    >
      {t(`common.categoryNames.${category.name}`) || category.name}
    </button>
  )
}



