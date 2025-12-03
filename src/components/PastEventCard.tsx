import Icon from './Icon'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianCurrency, formatPersianNumber, formatPersianTime, formatCurrency } from '../utils/persianNumbers'
import { formatEventDate } from '../utils/solarHijriCalendar'
import { isTicketSalesClosed, shouldShowEventAsCompleted, shouldShowEventAsCancelled } from '../utils/eventStatusUpdater'
import type { Event } from '../services/api'

export default function PastEventCard({ e }: { e: Event }) {
  const { t, language } = useLanguage()
  
  // Get status display text and styling
  const getStatusDisplay = () => {
    // If ticket sales are closed, determine status based on minimum participants
    if (isTicketSalesClosed(e)) {
      if (shouldShowEventAsCompleted(e)) {
        return {
          text: 'تکمیل شده',
          className: 'text-green-400 bg-green-400/10',
          icon: 'check-circle'
        }
      } else if (shouldShowEventAsCancelled(e)) {
        return {
          text: 'لغو شده',
          className: 'text-red-400 bg-red-400/10',
          icon: 'x-circle'
        }
      }
    }
    
    // For events with ticket sales still open, use original status
    if (e.event_status === 'completed') {
      return {
        text: 'تکمیل شده',
        className: 'text-green-400 bg-green-400/10',
        icon: 'check-circle'
      }
    } else if (e.event_status === 'cancelled') {
      return {
        text: 'لغو شده',
        className: 'text-red-400 bg-red-400/10',
        icon: 'x-circle'
      }
    }
    
    return null
  }
  
  const statusDisplay = getStatusDisplay()
  
  return (
    <div className="block card-compact bg-slate-800/40 opacity-75 cursor-not-allowed">
      <div className="flex gap-3 sm:gap-4">
        <div className="relative flex-shrink-0">
          <img 
            src={e.image_url || e.social_hub.image_url || e.social_hub.gallery_images?.[0] || '/placeholder-event.jpg'} 
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-cover rounded-lg grayscale" 
            alt={e.name}
            onError={(e) => {
              // Handle broken images
              e.currentTarget.src = '/placeholder-event.jpg'
            }}
          />
          <span className="absolute bottom-1 left-1 text-[10px] sm:text-xs bg-black/80 px-1.5 py-0.5 rounded backdrop-blur font-medium">
            {t(`common.categoryNames.${e.category.name}`) || e.category.name}
          </span>
          {/* Status indicator */}
          {statusDisplay && (
            <div className={`absolute top-1 right-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
              <div className="flex items-center gap-1">
                <Icon name={statusDisplay.icon} className="w-3 h-3" />
                <span>{statusDisplay.text}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-responsive-base line-clamp-2 text-slate-400">
              {e.name}
            </h3>
          </div>
          <div className="text-slate-500 text-responsive-sm space-y-1">
            <div className="flex items-center gap-2">
              <Icon name="calendar" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" /> 
              <span>{formatEventDate(e.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="clock" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" /> 
              <span>{formatPersianTime(e.time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="map" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" /> 
              <span className="line-clamp-1">{e.social_hub.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="location" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" /> 
              <span className="line-clamp-1">{e.social_hub.address}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">
                {statusDisplay ? (
                  statusDisplay.text === 'تکمیل شده' ? 'رویداد با موفقیت برگزار شد' : 'رویداد لغو شد'
                ) : (
                  e.event_status === 'completed' ? 'رویداد با موفقیت برگزار شد' : 'رویداد لغو شد'
                )}
              </span>
            </div>
            <span className="font-semibold text-responsive-sm inline-flex items-center gap-1 text-slate-400">
              <Icon name="price" className="w-3 h-3 sm:w-4 sm:h-4" />
              {formatCurrency(e.price, language, t('common.currency'))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
