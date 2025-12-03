import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Language } from '../i18n'

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, isRTL, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages: { 
    code: Language; 
    name: string; 
    nativeName: string; 
    flag: string;
    direction: 'ltr' | 'rtl';
  }[] = [
    { 
      code: 'en', 
      name: 'English', 
      nativeName: 'English',
      flag: '🇺🇸',
      direction: 'ltr'
    },
    { 
      code: 'fa', 
      name: 'Persian', 
      nativeName: 'فارسی',
      flag: '🇮🇷',
      direction: 'rtl'
    }
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode)
    setIsOpen(false)
    
    // Show a brief success message
    const selectedLang = languages.find(lang => lang.code === langCode)
    if (selectedLang) {
      // You could add a toast notification here if you have a toast system
      console.log(`Language changed to ${selectedLang.nativeName}`)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className="relative language-switcher" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chip inline-flex items-center gap-2 text-xs sm:text-sm hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
        aria-label={t('common.changeLanguage') || 'Change language'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-base" role="img" aria-label={`${currentLanguage?.nativeName} flag`}>
          {currentLanguage?.flag}
        </span>
        <span className="hidden xs:inline font-medium">
          {currentLanguage?.nativeName}
        </span>
        <svg 
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-dropdown-backdrop" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div 
            className={`absolute top-full mt-2 z-dropdown bg-slate-800 border border-slate-700 rounded-lg shadow-xl min-w-[140px] backdrop-blur-sm ${
              isRTL ? 'left-0' : 'right-0'
            }`}
            role="menu"
            aria-orientation="vertical"
          >
            {languages.map((lang, index) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-slate-700 ${
                  language === lang.code 
                    ? 'bg-slate-700 text-white font-medium' 
                    : 'text-slate-300 hover:text-white'
                }`}
                role="menuitem"
                aria-current={language === lang.code ? 'true' : 'false'}
                style={{ direction: lang.direction }}
              >
                <span 
                  className="text-lg" 
                  role="img" 
                  aria-label={`${lang.nativeName} flag`}
                >
                  {lang.flag}
                </span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-slate-400">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <svg 
                    className="w-4 h-4 ml-auto text-purple-400" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher

