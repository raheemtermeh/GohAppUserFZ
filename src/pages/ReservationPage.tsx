import { useNavigate, useParams } from 'react-router-dom'
import { events } from '../data/events'
import { useStore } from '../state/apiStore'
import { useLanguage } from '../contexts/LanguageContext'
import BackButton from '../components/BackButton'
import { useState } from 'react'

export default function ReservationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dispatch } = useStore()
  const { t } = useLanguage()
  const e = events.find(x => x.id === id)
  const [name, setName] = useState('')
  const [seats, setSeats] = useState(1)
  if (!e) return <div>Not found</div>

  function submit() {
    dispatch({ type: 'reserve', eventId: e.id, name, seats })
    navigate('/profile')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton fallbackPath="/" />
        <h2 className="text-xl font-semibold">Reserve: {e.title}</h2>
      </div>
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <img src={e.imageUrl} className="w-16 h-16 rounded-lg object-cover" />
          <div className="text-sm text-slate-300">{new Date(e.date).toDateString()} • {e.time}</div>
        </div>
        
        {/* Reserved seats info */}
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('pages.reservation.minimum')}: {e.minimum || 5}</span>
            <span className="text-slate-500">•</span>
            <span>{t('pages.reservation.reserved')}: {e.total_reserved_people || 0}</span>
          </div>
          {/* MS Information */}
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-yellow-400 font-medium">{t('common.minimumSeats')}: {e.minimum || 5}</span>
              <span className="text-slate-300">
                {e.total_reserved_people || 0}/{e.minimum || 5} {t('common.people')}
              </span>
            </div>
            {e.minimum_seats_progress && (
              <>
                <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-teal-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${e.minimum_seats_progress.progress_percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {e.minimum_seats_progress.remaining_needed > 0 
                    ? t('pages.reservation.needMoreSeats', { count: e.minimum_seats_progress.remaining_needed })
                    : t('pages.reservation.minimumMet')
                  }
                </div>
              </>
            )}
          </div>
        </div>
        <label className="space-y-1 block">Your name
          <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
        <label className="space-y-1 block">Seats
          <input type="number" min={1} max={5} value={seats}
            onChange={e => setSeats(Number(e.target.value))}
            className="w-24 bg-slate-800 rounded px-3 py-2" />
        </label>
        <button disabled={!name}
          onClick={submit}
          className="btn-primary w-full disabled:opacity-50">Confirm Reservation</button>
      </div>
    </div>
  )
}


