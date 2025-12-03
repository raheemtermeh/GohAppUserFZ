import React, { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Language } from '../i18n'

interface LanguageSettingsProps {
  onClose?: () => void
  showTitle?: boolean
}

const LanguageSettings: React.FC<LanguageSettingsProps> = ({ 
  onClose, 
  showTitle = true 
}) => {
  const { language, setLanguage, isRTL, t } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language)
  
  const languages = [
    { 
      code: 'en' as Language, 
      name: 'English', 
      nativeName: 'English',
      flag: '🇺🇸',
      description: 'English language interface'
    },
    { 
      code: 'fa' as Language, 
      name: 'Persian', 
      nativeName: 'فارسی',
      flag: '🇮🇷',
      description: 'رابط کاربری فارسی'
    }
  ]
  
  const handleLanguageChange = (langCode: Language) => {
    setSelectedLanguage(langCode)
  }
  
  const handleSave = () => {
    setLanguage(selectedLanguage)
    onClose?.()
  }
  
  const handleCancel = () => {
    setSelectedLanguage(language)
    onClose?.()
  }
  
  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">
            {t('common.selectLanguage')}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Choose your preferred language
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 ${
              selectedLanguage === lang.code
                ? 'border-purple-500 bg-purple-500/10 text-white'
                : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <span 
              className="text-2xl"
              role="img" 
              aria-label={`${lang.nativeName} flag`}
            >
              {lang.flag}
            </span>
            
            <div className="flex-1 text-left">
              <div className="font-medium">{lang.nativeName}</div>
              <div className="text-sm text-slate-400">{lang.name}</div>
              <div className="text-xs text-slate-500 mt-1">{lang.description}</div>
            </div>
            
            {selectedLanguage === lang.code && (
              <div className="flex-shrink-0">
                <svg 
                  className="w-5 h-5 text-purple-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {onClose && (
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      )}
    </div>
  )
}

export default LanguageSettings
