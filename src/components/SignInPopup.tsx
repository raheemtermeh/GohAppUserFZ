import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../state/apiStore'
import Icon from './Icon'
import { useLanguage } from '../contexts/LanguageContext'

interface SignInPopupProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  redirectUrl?: string
}

export default function SignInPopup({ 
  isOpen, 
  onClose, 
  title,
  message,
  redirectUrl 
}: SignInPopupProps) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleSignIn = () => {
    // Store current page URL for redirect after login
    const currentUrl = redirectUrl || window.location.pathname + window.location.search
    dispatch({ type: 'set_redirect_url', url: currentUrl })
    
    // Close popup and navigate to login
    onClose()
    navigate('/login')
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card p-6 max-w-sm w-full space-y-6 animate-scale-in">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-glow-pink">
            <Icon name="user" className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {title || t('common.signInRequired')}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {message || t('common.signInToFavorite')}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="btn-ghost flex-1"
          >
            <Icon name="close" className="w-4 h-4" />
            <span>{t('common.cancel')}</span>
          </button>
          <button
            onClick={handleSignIn}
            className="btn-primary flex-1"
          >
            <Icon name="user" className="w-4 h-4" />
            <span>{t('common.signIn')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
