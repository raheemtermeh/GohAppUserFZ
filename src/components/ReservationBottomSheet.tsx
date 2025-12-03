import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { events } from '../data/events'
import { useStore } from '../state/apiStore'
import { useLanguage } from '../contexts/LanguageContext'
import Icon from './Icon'

interface ReservationBottomSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReservationBottomSheet({ isOpen, onClose }: ReservationBottomSheetProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dispatch } = useStore()
  const { t } = useLanguage()
  const e = events.find(x => x.id === id)
  const [name, setName] = useState('')
  const [seats, setSeats] = useState(1)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!e) return null

  function submit() {
    dispatch({ type: 'reserve', eventId: e.id, name, seats })
    onClose()
    navigate('/profile')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-3xl border-t border-slate-700 transform transition-transform duration-300 ease-out">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-8 max-h-[80vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-xl font-bold">Reserve: {e.title}</h2>
              <p className="text-slate-400 text-sm mt-1">Complete your reservation</p>
            </div>

            {/* Event Info */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={e.imageUrl} className="w-16 h-16 rounded-lg object-cover" alt={e.title} />
                <div className="flex-1">
                  <h3 className="font-semibold">{e.title}</h3>
                  <div className="text-sm text-slate-400">
                    {new Date(e.date).toDateString()} • {e.time}
                  </div>
                  <div className="text-sm text-slate-400">{e.venue}</div>
                </div>
              </div>
              
              {/* Reserved seats info */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700">
                <span>{t('pages.reservation.minimum')}: {e.minimum || 5}</span>
                <span className="text-slate-500">•</span>
                <span>{t('pages.reservation.reserved')}: {e.total_reserved_people || 0}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <label className="space-y-2 block">
                <span className="text-sm font-medium">Your Name</span>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-slate-800 rounded-lg px-4 py-3 border border-slate-700 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Enter your full name"
                />
              </label>
              
              <label className="space-y-2 block">
                <span className="text-sm font-medium">Number of Seats</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSeats(Math.max(1, seats - 1))}
                    className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  >
                    <Icon name="minus" className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center font-semibold">{seats}</span>
                  <button
                    onClick={() => setSeats(Math.min(5, seats + 1))}
                    className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  >
                    <Icon name="plus" className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">Maximum 5 seats per reservation</p>
              </label>
            </div>

            {/* Submit Button */}
            <button 
              disabled={!name.trim()}
              onClick={submit}
              className="btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Reservation
            </button>

            {/* Cancel Button */}
            <button 
              onClick={onClose}
              className="w-full py-3 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
