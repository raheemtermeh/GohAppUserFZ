import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../state/apiStore'
import { useAuth } from '../hooks/useApi'
import Icon from '../components/Icon'
import BackButton from '../components/BackButton'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../contexts/LanguageContext'
import { toPersianNumbers, toEnglishNumbers } from '../utils/persianNumbers'
import { getErrorMessage } from '../utils/errorTranslator'

export default function LoginPage() {
  const { state, dispatch } = useStore()
  const { sendVerificationCode, verifyPhoneAndLogin, completeProfile } = useAuth()
  const { t, isRTL, language } = useLanguage()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code' | 'profile'>('phone')
  const [showRatePopup, setShowRatePopup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authData, setAuthData] = useState<any>(null)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    username: ''
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [userExists, setUserExists] = useState(false)
  const navigate = useNavigate()

  // Format phone number to +98 format
  const formatPhoneNumber = (phoneNumber: string): string => {
    const phone = phoneNumber.replace(/[^\d]/g, '')
    
    if (phone.startsWith('+98')) {
      return phone
    }
    
    if (phone.startsWith('98')) {
      return `+${phone}`
    }
    
    if (phone.startsWith('0')) {
      return `+98${phone.slice(1)}`
    }
    
    if (phone.length === 10 && phone.startsWith('9')) {
      return `+98${phone}`
    }
    
    return phone
  }

  async function sendCode() {
    if (phone.length >= 10) {
      setLoading(true)
      setError('')
      try {
        const formattedPhone = formatPhoneNumber(phone)
        const response = await sendVerificationCode(formattedPhone)
        // Check if response contains user_exists information
        if (response && typeof response.user_exists === 'boolean') {
          setUserExists(response.user_exists)
        }
        setStep('code')
        // Reset terms acceptance when moving to code step
        setAcceptTerms(false)
      } catch (error: any) {
        const translatedError = getErrorMessage(error, language)
        setError(translatedError || t('common.failedToSendCode'))
      } finally {
        setLoading(false)
      }
    }
  }

  async function verifyCode() {
    if (code.length === 4) {
      // Check if terms are accepted for new users
      if (!userExists && !acceptTerms) {
        setError(t('common.acceptTermsRequired'))
        return
      }
      
      setLoading(true)
      setError('')
      try {
        const formattedPhone = formatPhoneNumber(phone)
        const result = await verifyPhoneAndLogin(formattedPhone, code)
        
        if (result && result.is_first_time) {
          setAuthData(result)
          setStep('profile')
        } else {
          // Check if there's a redirect URL stored
          if (state.redirectUrl) {
            navigate(state.redirectUrl)
            // Clear the redirect URL after using it
            dispatch({ type: 'set_redirect_url', url: null })
          } else {
            navigate('/')
          }
          setTimeout(() => setShowRatePopup(true), 1000)
        }
      } catch (error: any) {
        const translatedError = getErrorMessage(error, language)
        setError(translatedError || t('common.loginFailed'))
      } finally {
        setLoading(false)
      }
    }
  }

  async function completeUserProfile() {
    if (!profileData.firstName || !profileData.lastName || !profileData.username) {
      setError(t('common.fillAllFields'))
      return
    }

    setLoading(true)
    setError('')
    try {
      await completeProfile(
        authData?.customer_id,
        profileData.firstName,
        profileData.lastName,
        profileData.username
      )
      // Check if there's a redirect URL stored
      if (state.redirectUrl) {
        navigate(state.redirectUrl)
        // Clear the redirect URL after using it
        dispatch({ type: 'set_redirect_url', url: null })
      } else {
        navigate('/')
      }
      setTimeout(() => setShowRatePopup(true), 1000)
    } catch (error: any) {
      const translatedError = getErrorMessage(error, language)
      setError(translatedError || t('common.failedToCompleteProfile'))
    } finally {
      setLoading(false)
    }
  }

  function skipAsGuest() {
    navigate('/')
  }

  if (state.auth.user) {
    return (
      <div className={`container-responsive p-responsive space-responsive-compact ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 mx-auto grid place-items-center text-2xl sm:text-3xl font-bold shadow-glow">
            {state.auth.user?.f_name?.[0] || '👤'}
          </div>
          <div className="font-semibold text-responsive-lg">{state.auth.user?.f_name || ''} {state.auth.user?.l_name || ''}</div>
          <div className="text-slate-400 text-responsive-sm">{t('common.alreadyLoggedIn')}</div>
        </div>
        <button 
          className="btn-ghost w-full hover-scale" 
          onClick={() => dispatch({ type: 'logout' })}
        >
          {t('common.logout')}
        </button>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="hero-gradient p-6 sm:p-8 text-center relative overflow-hidden">
        <div className="absolute top-4 left-4 z-20">
          <BackButton fallbackPath="/" />
        </div>
        <div className={`absolute top-4 z-20 ${isRTL ? 'left-16 sm:left-20' : 'right-4'}`}>
          <LanguageSwitcher />
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 z-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-lg"></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-md"></div>
        </div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-glow-pink">
            {step === 'phone' && <img src="/logo.png" alt="Funzone" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />}
            {step === 'code' && <img src="/logo.png" alt="Funzone" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />}
            {step === 'profile' && <img src="/logo.png" alt="Funzone" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />}
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-2 sm:mb-3">
            {t('pages.login.title')}
          </h1>
          <p className="text-responsive-base text-slate-300">{t('pages.login.subtitle')}</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4 text-red-400 text-responsive-sm text-center">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-responsive-sm font-medium text-slate-300 flex items-center gap-2">
                <span className="text-purple-400">📱</span>
                {t('common.phoneNumber')}
              </label>
              <div className="search-bar hover:shadow-responsive-lg transition-all duration-300 hover:scale-[1.02]" dir="ltr">
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="text-lg">📱</span>
                  <span className="text-slate-400 text-sm font-medium">{language === 'fa' ? '+۹۸' : '+98'}</span>
                </div>
                <input
                  type="tel"
                  placeholder={language === 'fa' ? '۹۳۰۴۰۴۱۵۳۳' : '9304041533'}
                  value={language === 'fa' ? toPersianNumbers(phone) : phone}
                  onChange={(e) => setPhone(toEnglishNumbers(e.target.value).replace(/[^\d]/g, '').slice(0, 10))}
                  className="bg-transparent flex-1 outline-none text-slate-100 placeholder-slate-400 text-responsive-base focus-ring"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span>ℹ️</span>
                {t('common.enterIranianMobile')}
              </p>
            </div>
            
            <button
              onClick={sendCode}
              disabled={phone.length < 10 || loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
            >
              {loading ? t('common.sending') : t('common.sendCode')}
            </button>
          </div>
        ) : step === 'code' ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-responsive-sm font-medium text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">🔐</span>
                {t('common.verificationCode')}
              </label>
              <div className="search-bar hover:shadow-responsive-lg transition-all duration-300 hover:scale-[1.02]" dir="ltr">
                <div className="flex items-center gap-2 text-teal-400">
                  <span className="text-lg">🎫</span>
                </div>
                <input
                  type="text"
                  placeholder={language === 'fa' ? '۱۲۳۴' : '1234'}
                  value={language === 'fa' ? toPersianNumbers(code) : code}
                  onChange={(e) => setCode(toEnglishNumbers(e.target.value).replace(/[^\d]/g, '').slice(0, 4))}
                  className="bg-transparent flex-1 outline-none text-slate-100 placeholder-slate-400 text-center text-lg sm:text-xl md:text-2xl tracking-widest focus-ring"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1" dir={language === 'fa' ? 'rtl' : 'ltr'}>
                <span>📨</span>
                {language === 'fa' 
                  ? t('common.codeSentTo').replace('+98{phone}', `۹۸${toPersianNumbers(phone)}+`)
                  : t('common.codeSentTo').replace('{phone}', phone)
                }
              </p>
            </div>
            
            {/* Terms and Conditions Checkbox - Only show if user doesn't exist */}
            {!userExists && (
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="terms-checkbox" className="text-sm text-slate-300 cursor-pointer">
                  {t('common.acceptTerms')}
                </label>
              </div>
            )}
            
            <button
              onClick={verifyCode}
              disabled={code.length !== 4 || loading || (!userExists && !acceptTerms)}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
            >
              {loading ? t('common.verifying') : t('common.continue')}
            </button>
            <button
              onClick={() => setStep('phone')}
              className="btn-ghost w-full hover-scale"
            >
              {t('common.back')} {t('common.to')} {t('common.phone')}
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-glow mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h2 className="text-responsive-xl font-bold text-slate-100 flex items-center justify-center gap-2">
                <span className="text-blue-400">👤</span>
                {t('common.completeProfile')}
              </h2>
              <p className="text-responsive-sm text-slate-400 flex items-center justify-center gap-1">
                <span>ℹ️</span>
                {t('common.provideInformation')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-responsive-sm font-medium text-slate-300 flex items-center gap-2">
                  <span className="text-blue-400">👤</span>
                  {t('common.firstName')}
                </label>
                <div className="search-bar hover:shadow-responsive-lg transition-all duration-300 hover:scale-[1.01]">
                  <span className="text-blue-400">👤</span>
                  <input
                    type="text"
                    placeholder={t('common.enterFirstName')}
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    className="bg-transparent flex-1 outline-none text-slate-100 placeholder-slate-400 text-responsive-base focus-ring"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-responsive-sm font-medium text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">👤</span>
                  {t('common.lastName')}
                </label>
                <div className="search-bar hover:shadow-responsive-lg transition-all duration-300 hover:scale-[1.01]">
                  <span className="text-green-400">👤</span>
                  <input
                    type="text"
                    placeholder={t('common.enterLastName')}
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    className="bg-transparent flex-1 outline-none text-slate-100 placeholder-slate-400 text-responsive-base focus-ring"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-responsive-sm font-medium text-slate-300 flex items-center gap-2">
                <span className="text-purple-400">🏷️</span>
                {t('common.username')}
              </label>
              <div className="search-bar hover:shadow-responsive-lg transition-all duration-300 hover:scale-[1.01]">
                <span className="text-purple-400">🏷️</span>
                <input
                  type="text"
                  placeholder={t('common.enterUsername')}
                  value={profileData.username}
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  className="bg-transparent flex-1 outline-none text-slate-100 placeholder-slate-400 text-responsive-base focus-ring"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
            
            <button
              onClick={completeUserProfile}
              disabled={!profileData.firstName || !profileData.lastName || !profileData.username || loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
            >
              {loading ? t('common.completing') : t('common.completeProfile')}
            </button>
            
            <button
              onClick={() => setStep('code')}
              className="btn-ghost w-full hover-scale"
            >
              {t('common.back')} {t('common.to')} {t('common.verificationCode')}
            </button>
          </div>
        )}

        <div className="text-center pt-4">
          <button 
            onClick={skipAsGuest} 
            className="text-slate-400 hover:text-slate-300 text-responsive-sm transition-colors"
          >
            {t('common.skipAsGuest')}
          </button>
        </div>
      </div>

      {/* Rate Popup */}
      {showRatePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="glass-card p-4 sm:p-6 max-w-sm w-full text-center space-y-4 sm:space-y-6 animate-scale-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 mx-auto grid place-items-center shadow-glow-pink">
              <Icon name="star" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h3 className="text-responsive-xl font-bold">{t('common.rateOurApp')}</h3>
            <p className="text-responsive-sm text-slate-300">{t('common.enjoyingExperience')}</p>
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => setShowRatePopup(false)}
                className="btn-ghost flex-1 hover-scale"
              >
                {t('common.later')}
              </button>
              <button
                onClick={() => setShowRatePopup(false)}
                className="btn-secondary flex-1 hover-scale"
              >
                {t('common.rateNow')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
