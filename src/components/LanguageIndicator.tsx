import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'

interface LanguageIndicatorProps {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LanguageIndicator: React.FC<LanguageIndicatorProps> = ({ 
  showText = true, 
  size = 'md',
  className = ''
}) => {
  const { language, isRTL } = useLanguage()
  
  const getLanguageInfo = () => {
    switch (language) {
      case 'fa':
        return { flag: '🇮🇷', name: 'فارسی', code: 'FA' }
      case 'en':
        return { flag: '🇺🇸', name: 'English', code: 'EN' }
      default:
        return { flag: '🌐', name: 'Language', code: 'LANG' }
    }
  }
  
  const languageInfo = getLanguageInfo()
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  const flagSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  return (
    <div 
      className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <span 
        className={`${flagSizeClasses[size]}`}
        role="img" 
        aria-label={`${languageInfo.name} flag`}
      >
        {languageInfo.flag}
      </span>
      {showText && (
        <span className="font-medium text-slate-300">
          {languageInfo.name}
        </span>
      )}
    </div>
  )
}

export default LanguageIndicator
