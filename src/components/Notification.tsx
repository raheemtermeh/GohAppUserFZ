import { useEffect } from 'react'
import { useStore } from '../state/apiStore'
import Icon from './Icon'

export default function Notification() {
  const { state, dispatch } = useStore()
  const { notification } = state

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        dispatch({ type: 'hide_notification' })
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [notification.show, dispatch])

  if (!notification.show || !notification.message) return null

  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50 text-green-400'
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      case 'error':
        return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'info':
      default:
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
    }
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return 'check'
      case 'warning':
        return 'warning'
      case 'error':
        return 'close'
      case 'info':
      default:
        return 'info'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`p-4 rounded-lg border backdrop-blur-sm ${getNotificationStyles()}`}>
        <div className="flex items-start gap-3">
          <Icon name={getIcon()} className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'hide_notification' })}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}



