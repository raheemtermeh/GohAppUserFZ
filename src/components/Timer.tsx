import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianNumber, formatPersianCountdown } from '../utils/persianNumbers'

interface TimerProps {
  startTime: string
  closingTimeHours: number
  className?: string
}

export default function Timer({ startTime, closingTimeHours, className = '' }: TimerProps) {
  const { t } = useLanguage()
  
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const eventStart = new Date(startTime)
      const closingTime = new Date(eventStart.getTime() - (closingTimeHours * 60 * 60 * 1000))
      
      const difference = closingTime.getTime() - now.getTime()
      
      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true }
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      
      return { hours, minutes, seconds, isExpired: false }
    }

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft())
    }

    // Update immediately
    updateTimer()
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [startTime, closingTimeHours])

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center gap-1 text-red-400 text-xs font-medium ${className}`}>
        <span>🔒</span>
        <span>{t('common.ticketsClosed')}</span>
      </div>
    )
  }

  // Only show timer when there are less than 24 hours left
  if (timeLeft.hours >= 24) {
    return null
  }

  return (
    <div className={`flex items-center gap-1 text-yellow-400 text-xs font-medium ${className}`}>
      <span>⏰</span>
      <span className="font-mono">
        {formatPersianCountdown(timeLeft.hours, timeLeft.minutes, timeLeft.seconds)}
      </span>
    </div>
  )
}
