import { useState, useEffect, useMemo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore, useUserReservations, useFavoriteSocialHubs, usePendingReservationManager, useCart } from '../state/apiStore'
import { useEnrichedReservations } from '../hooks/useEnrichedReservations'
import Icon from '../components/Icon'
import EventCard from '../components/EventCard'
import SocialHubCard from '../components/SocialHubCard'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../contexts/LanguageContext'
import { authService } from '../services/authService'
import { formatPersianCurrency, formatPersianNumber, formatNumber, formatCurrency } from '../utils/persianNumbers'
import { formatEventDate } from '../utils/solarHijriCalendar'
import SolarHijriDatePicker from '../components/SolarHijriDatePicker'
import { apiClient } from '../services/apiClient'
import { isTicketSalesClosed, shouldShowEventAsCompleted, shouldShowEventAsCancelled, getCorrectEventStatus, isEventCompleted, isEventCancelled } from '../utils/eventStatusUpdater'

export default function ProfilePage() {
  const { state, dispatch } = useStore()
  const { t, isRTL, language } = useLanguage()
  const navigate = useNavigate()
  const userReservations = useUserReservations()
  const { enrichedReservations } = useEnrichedReservations()
  const favoriteHubs = useFavoriteSocialHubs()
  const cartItems = useCart()
  
  // Initialize pending reservation manager
  usePendingReservationManager()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'profile' | 'reservations' | 'favorites'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [phoneVerificationStep, setPhoneVerificationStep] = useState<'phone' | 'code'>('phone')
  const [newPhoneNumber, setNewPhoneNumber] = useState('')
  const [newPhoneDigits, setNewPhoneDigits] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false)
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  // Compute original phone digits (10 digits) from stored number
  const originalDigits = useMemo(() => {
    const raw = (originalPhoneNumber || '').replace(/[^\d+]/g, '')
    if (raw.startsWith('+98')) return raw.slice(3)
    if (raw.startsWith('98')) return raw.slice(2)
    if (raw.startsWith('0')) return raw.slice(1)
    return raw
  }, [originalPhoneNumber])
  const [formData, setFormData] = useState({
    f_name: '',
    l_name: '',
    username: '',
    mobile_number: '',
    email: '',
    address: '',
    birthday: '',
    national_code: ''
  })

  // Handle hash navigation to favorites tab
  useEffect(() => {
    if (location.hash === '#favorites') {
      setActiveTab('favorites')
    }
  }, [location.hash])

  // Load user reservations when user is authenticated
  useEffect(() => {
    const loadUserReservations = async () => {
      if (!state.auth.user) return

      try {
        const accessToken = localStorage.getItem('access_token')
        if (!accessToken) return

        const data = await apiClient.get(`reservations/?customer_id=${state.auth.user.id}`)
          console.log('Loaded reservations:', data)
          dispatch({ type: 'set_reservations', reservations: data.results })
      } catch (error) {
        console.error('Failed to load user reservations:', error)
        console.error('Error details:', error)
      }
    }

    loadUserReservations()
  }, [state.auth.user, dispatch])

  // Populate form data when user data is available
  useEffect(() => {
    if (state.auth.user) {
      const phoneNumber = state.auth.user?.mobile_number?.toString() || ''
      console.log('ProfilePage: Loading user data:', state.auth.user)
      console.log('ProfilePage: User birthday:', state.auth.user?.birthday)
      setFormData({
        f_name: state.auth.user?.f_name || '',
        l_name: state.auth.user?.l_name || '',
        username: state.auth.user?.username || '',
        mobile_number: phoneNumber,
        email: state.auth.user?.email || '',
        address: state.auth.user?.address || '',
        birthday: state.auth.user?.birthday || '',
        national_code: state.auth.user?.national_code ? state.auth.user.national_code.toString().padStart(10, '0') : ''
      })
      setOriginalPhoneNumber(phoneNumber)
    }
  }, [state.auth.user])

  // Additional effect to watch for birthday changes specifically
  useEffect(() => {
    if (state.auth.user?.birthday) {
      console.log('ProfilePage: Birthday changed in user data:', state.auth.user.birthday)
      setFormData(prev => ({
        ...prev,
        birthday: state.auth.user.birthday
      }))
    }
  }, [state.auth.user?.birthday])

  // Form handling functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Special handling for national code - only allow digits and limit to 10 digits
    if (name === 'national_code') {
      const digitsOnly = value.replace(/[^\d]/g, '').slice(0, 10)
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Special handler for birthday input
  const handleBirthdayChange = (value: string) => {
    console.log('ProfilePage: Birthday changed to:', value)
    setFormData(prev => ({
      ...prev,
      birthday: value
    }))
  }

  const handlePhoneNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setFormData(prev => ({
      ...prev,
      mobile_number: value
    }))

    // If phone number is different from original, show verification
    if (value !== originalPhoneNumber && value.length > 0) {
      setNewPhoneNumber(value)
      setPhoneVerificationStep('phone')
      setShowPhoneVerification(true)
    }
  }

  const sendPhoneVerificationCode = async () => {
    // Require exactly 10 digits and construct +98 number
    const digitsOnly = (newPhoneDigits || '').replace(/[^\d]/g, '')
    if (digitsOnly.length !== 10 || !digitsOnly.startsWith('9')) {
      alert('Please enter a valid Iranian mobile (10 digits starting with 9)')
      return
    }
    const fullNumber = `+98${digitsOnly}`
    setNewPhoneNumber(fullNumber)

    try {
      setIsVerifyingPhone(true)
      await authService.sendVerificationCode(fullNumber)
      setPhoneVerificationStep('code')
    } catch (error) {
      console.error('Failed to send verification code:', error)
      alert('Failed to send verification code. Please try again.')
    } finally {
      setIsVerifyingPhone(false)
    }
  }

  const verifyPhoneNumber = async () => {
    if (!verificationCode || !newPhoneNumber) return

    try {
      setIsVerifyingPhone(true)
      // Verify the phone number with the code
      await authService.verifyPhoneAndLogin(newPhoneNumber, verificationCode)
      
      // Update the form data with the new phone number (store with +98)
      setFormData(prev => ({
        ...prev,
        mobile_number: newPhoneNumber
      }))
      setOriginalPhoneNumber(newPhoneNumber)
      
      setShowPhoneVerification(false)
      setPhoneVerificationStep('phone')
      setVerificationCode('')
      setNewPhoneNumber('')
      alert('Phone number updated successfully!')
    } catch (error) {
      console.error('Phone verification failed:', error)
      alert('Phone verification failed. Please try again.')
    } finally {
      setIsVerifyingPhone(false)
    }
  }

  const handleSave = async () => {
    if (!state.auth.user) return

    // Validate national code if provided
    if (formData.national_code && formData.national_code.length !== 10) {
      alert('کد ملی باید دقیقاً ۱۰ رقم باشد')
      return
    }

    try {
      const profileData = {
        f_name: formData.f_name,
        l_name: formData.l_name,
        username: formData.username,
        email: formData.email || null,
        address: formData.address || null,
        birthday: formData.birthday || null,
        national_code: formData.national_code || null,
        mobile_number: formData.mobile_number
      }
      
      console.log('ProfilePage: Saving profile data:', profileData)
      console.log('ProfilePage: Birthday value:', formData.birthday)

      const updatedUser = await authService.updateProfile(profileData)
      
      console.log('ProfilePage: Updated user data from server:', updatedUser)
      console.log('ProfilePage: Birthday in updated user:', updatedUser.birthday)
      
      // Update the user in the store
      dispatch({ type: 'login', customer: updatedUser })
      
      // Force reload the form data with the updated user data
      setFormData(prev => ({
        ...prev,
        birthday: updatedUser.birthday || ''
      }))
      
      setIsEditing(false)
      setShowSuccessMessage(true)
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      alert(error.message || 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    // Reset form data to original user data
    if (state.auth.user) {
      setFormData({
        f_name: state.auth.user?.f_name || '',
        l_name: state.auth.user?.l_name || '',
        username: state.auth.user?.username || '',
        mobile_number: state.auth.user?.mobile_number?.toString() || '',
        email: state.auth.user?.email || '',
        address: state.auth.user?.address || '',
        birthday: state.auth.user?.birthday || '',
        national_code: state.auth.user?.national_code ? state.auth.user.national_code.toString().padStart(10, '0') : ''
      })
    }
    setIsEditing(false)
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    dispatch({ type: 'logout' })
    setShowLogoutModal(false)
    // Redirect to home page after logout
    window.location.href = '/'
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  if (!state.auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`card p-6 md:p-8 max-w-md w-full text-center space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 mx-auto grid place-items-center shadow-glow">
            <Icon name="user" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-responsive-xl font-bold text-gradient">{t('common.signInRequired')}</h1>
            <p className="text-responsive-sm text-slate-400">{t('common.pleaseSignInToViewProfile')}</p>
          </div>
          <NavLink to="/login" className="btn-primary w-full">
            {t('common.signIn')}
          </NavLink>
        </div>
      </div>
    )
  }

  const user = state.auth.user
  const pendingReservations = userReservations.filter(r => r.status === 'pending')
  const confirmedReservations = userReservations.filter(r => r.status === 'confirmed')
  const completedReservations = userReservations.filter(r => r.status === 'completed')
  const cancelledReservations = userReservations.filter(r => r.status === 'cancelled')
  
  // Convert cart items to pending reservations format
  const cartAsPendingReservations = cartItems.map(cartItem => ({
    id: cartItem.id,
    event: cartItem.event,
    number_of_people: cartItem.numberOfPeople,
    total_amount: cartItem.event.price * cartItem.numberOfPeople,
    status: 'pending' as const,
    reservation_date: cartItem.addedAt,
    customer: state.auth.user?.id || '',
    isFromCart: true // Flag to identify cart items
  }))
  
  // Combine actual pending reservations with cart items
  const allPendingReservations = [...pendingReservations, ...cartAsPendingReservations]

  return (
    <div className={`space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient">{t('common.myProfile')}</h1>
            {isEditing && (
              <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                {t('common.edit')}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            {t('common.manageYourAccountAndViewActivity')}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-800 rounded-lg p-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-0 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeTab === 'profile'
              ? 'bg-purple-600 text-white shadow-glow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Icon name="user" className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{t('common.profile')}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 min-w-0 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeTab === 'favorites'
              ? 'bg-purple-600 text-white shadow-glow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Icon name="heart" className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">
              <span className="hidden xs:inline">{t('common.favorites')}</span>
              <span className="xs:hidden">علا.</span>
              <span className="ml-1">({favoriteHubs.length})</span>
            </span>
          </div>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="card p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 flex items-center justify-center shadow-glow flex-shrink-0">
                <span className="text-white text-2xl sm:text-3xl md:text-4xl font-bold">
                  {user.f_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 text-center sm:text-left w-full">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient">{user.f_name ? `${user.f_name} ${user.l_name || ''}`.trim() : t('common.user')}</h2>
                <p className="text-sm sm:text-base text-slate-400 mt-1 break-all">{user.email}</p>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 mt-3 text-sm sm:text-base text-slate-300">
                  <span className="flex items-center gap-1">
                    <Icon name="calendar" className="w-4 h-4 flex-shrink-0" />
                    <span>{userReservations.length} {t('common.reservations')}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="heart" className="w-4 h-4 flex-shrink-0" />
                    <span>{favoriteHubs.length} {t('common.favorites')}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="card p-4 sm:p-6 md:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-gradient mb-4 sm:mb-6">{t('common.editProfile')}</h3>
              <form className="space-y-4 sm:space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('common.firstName')}
                    </label>
                    <input
                      type="text"
                      name="f_name"
                      value={formData.f_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder={t('common.firstName')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('common.lastName')}
                    </label>
                    <input
                      type="text"
                      name="l_name"
                      value={formData.l_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder={t('common.lastName')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('common.username')}
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder={t('common.username')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('common.mobileNumber')}
                    </label>
                    <input
                      type="tel"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handlePhoneNumberChange}
                      className="w-full px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder={t('common.mobileNumber')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('common.email')} <span className="text-slate-500 text-xs">({t('common.optional')})</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder={t('common.email')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('common.birthday')} <span className="text-slate-500 text-xs">({t('common.optional')})</span>
                    </label>
                    <SolarHijriDatePicker
                      key={formData.birthday || 'empty'}
                      value={formData.birthday}
                      onChange={handleBirthdayChange}
                      className="w-full px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                      allowPastDates={true}
                      placeholder="تاریخ تولد را انتخاب کنید"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('common.nationalCode')} <span className="text-slate-500 text-xs">({t('common.optional')})</span>
                    </label>
                    <input
                      type="text"
                      name="national_code"
                      value={formData.national_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder={t('common.nationalCode')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('common.address')} <span className="text-slate-500 text-xs">({t('common.optional')})</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    placeholder={t('common.address')}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1 sm:flex-none sm:px-8"
                  >
                    <Icon name="check" className="w-4 h-4" />
                    <span>{t('common.save')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-ghost flex-1 sm:flex-none sm:px-8"
                  >
                    <Icon name="close" className="w-4 h-4" />
                    <span>{t('common.cancel')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="glass-card p-6 max-w-md w-full text-center animate-scale-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Icon name="check" className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  پروفایل با موفقیت به‌روزرسانی شد!
                </h3>
                <p className="text-sm text-slate-400">
                  اطلاعات پروفایل شما با موفقیت ذخیره شد.
                </p>
              </div>
            </div>
          )}

          {/* Phone Verification Modal */}
          {showPhoneVerification && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="glass-card p-6 max-w-md w-full space-y-6 animate-scale-in">
                {phoneVerificationStep === 'phone' ? (
                  <>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Icon name="phone" className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        {t('common.enterNewPhoneNumber')}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {t('common.enterNewPhoneMessage')}
                      </p>
                    </div>
                    
                    <div className="space-y-4" dir="ltr">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {t('common.newPhoneNumber')}
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-2 bg-slate-800/60 border border-slate-600 rounded-lg text-slate-300 select-none">
                            +98
                          </span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={newPhoneDigits}
                            onChange={(e) => setNewPhoneDigits(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                            className="flex-1 px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                            placeholder="9123456789"
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{t('common.enterIranianMobile')}</p>
                        {newPhoneDigits.length === 10 && newPhoneDigits === originalDigits && (
                          <p className="text-xs text-red-400 mt-1">{t('common.newPhoneMustBeDifferent') || 'New phone number must be different from current number'}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowPhoneVerification(false)
                          setNewPhoneNumber('')
                          setFormData(prev => ({ ...prev, mobile_number: originalPhoneNumber }))
                        }}
                        className="btn-ghost flex-1"
                        disabled={isVerifyingPhone}
                      >
                        <Icon name="close" className="w-4 h-4" />
                        <span>{t('common.cancel')}</span>
                      </button>
                      <button
                        onClick={sendPhoneVerificationCode}
                        className="btn-primary flex-1"
                        disabled={newPhoneDigits.length !== 10 || newPhoneDigits === originalDigits || isVerifyingPhone}
                      >
                        <Icon name="check" className="w-4 h-4" />
                        <span>{t('common.ok')}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Icon name="ticket" className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        {t('common.verifyPhoneNumber')}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {t('common.verificationCodeSentTo')} {newPhoneNumber}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {t('common.verificationCode')}
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                          className="w-full px-3 py-2 bg-slate-800/40 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none transition-colors text-center text-lg tracking-widest"
                          placeholder="1234"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setPhoneVerificationStep('phone')
                          setVerificationCode('')
                        }}
                        className="btn-ghost flex-1"
                        disabled={isVerifyingPhone}
                      >
                        <Icon name="close" className="w-4 h-4" />
                        <span>{t('common.back')}</span>
                      </button>
                      <button
                        onClick={verifyPhoneNumber}
                        className="btn-primary flex-1"
                        disabled={!verificationCode || verificationCode.length !== 4 || isVerifyingPhone}
                      >
                        <Icon name="check" className="w-4 h-4" />
                        <span>{t('common.verify')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Edit Profile Button */}
          <div className="mt-6">
            <button 
              onClick={() => setIsEditing(true)}
              className="btn-primary w-full py-4 text-lg font-semibold"
            >
              <Icon name="edit" className="w-5 h-5" />
              <span>{t('common.editProfile')}</span>
            </button>
          </div>

          {/* Settings Button */}
          <div className="mt-4">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="btn-secondary w-full py-4 text-lg font-semibold"
            >
              <Icon name="settings" className="w-5 h-5" />
              <span>{t('common.settings') || 'Settings'}</span>
            </button>
          </div>

          {/* Logout Button - Bottom of Page */}
          <div className="mt-6">
            <button 
              onClick={handleLogout}
              className="btn-ghost w-full py-4 text-lg font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Icon name="close" className="w-5 h-5" />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          {enrichedReservations.length === 0 ? (
            <div className="card p-6 md:p-8 text-center">
              <Icon name="calendar" className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-400 mb-2">{t('common.noReservationsYet')}</h3>
              <p className="text-responsive-sm text-slate-500 mb-6">
                {t('common.startExploringEventsAndMakeFirstReservation')}
              </p>
              <NavLink to="/events" className="btn-primary">
                {t('common.browseEvents')}
              </NavLink>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Reservations */}
              {allPendingReservations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="clock" className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-yellow-400">{t('common.pendingReservations')}</h3>
                    <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                      {allPendingReservations.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {allPendingReservations.map((reservation) => (
                        <div key={reservation.id} className="card p-3 sm:p-4 md:p-6 border-l-4 border-yellow-500">
                          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                            <div className="w-full sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden mx-auto sm:mx-0">
                              {reservation.event.image_url ? (
                                <img
                                  src={reservation.event.image_url}
                                  alt={reservation.event.name}
                                  className="w-full h-32 sm:h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-32 sm:h-full flex items-center justify-center">
                                  <Icon name="calendar" className="w-6 h-6 text-slate-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="font-semibold text-sm sm:text-base truncate">
                                  {reservation.event?.name || t('common.unknownEvent')}
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-1">
                                  <span className="px-2 py-1 text-xs rounded-full self-start sm:self-center bg-yellow-500/20 text-yellow-400">
                                    {t('common.pending')}
                                  </span>
                                  {(reservation as any).isFromCart && (
                                    <span className="px-2 py-1 text-xs rounded-full self-start sm:self-center bg-blue-500/20 text-blue-400">
                                      {t('common.inCart')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-400 mb-2">
                                {reservation.event?.social_hub?.name || t('common.unknownVenue')}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-300">
                                <span>{formatNumber(reservation.number_of_people, language)} {t('common.people')}</span>
                                <span>{formatCurrency((reservation.event?.price || 0) * (reservation.number_of_people || 0), language, t('common.currency'))}</span>
                              </div>
                              <div className="mt-2 p-2 bg-yellow-500/10 rounded-lg">
                                <p className="text-xs text-yellow-400">
                                  {t('common.pendingReservationWarning')}
                                </p>
                              </div>
                            </div>
                            {reservation.event?.isFallback ? (
                              <div className="mt-2 sm:mt-0 text-xs text-slate-500">
                                {t('common.eventDetailsUnavailable') || 'Event details unavailable'}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Confirmed Reservations */}
              {confirmedReservations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="check" className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-green-400">{t('common.confirmedReservations')}</h3>
                    <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                      {confirmedReservations.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {enrichedReservations
                      .filter(r => r.status === 'confirmed')
                      .map((reservation) => (
                        <div key={reservation.id} className="card p-3 sm:p-4 md:p-6 border-l-4 border-green-500">
                          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                            <div className="w-full sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden mx-auto sm:mx-0">
                              {reservation.event.image_url ? (
                                <img
                                  src={reservation.event.image_url}
                                  alt={reservation.event.name}
                                  className="w-full h-32 sm:h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-32 sm:h-full flex items-center justify-center">
                                  <Icon name="calendar" className="w-6 h-6 text-slate-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="font-semibold text-sm sm:text-base truncate">
                                  {reservation.event?.name || t('common.unknownEvent')}
                                </h3>
                                <span className="px-2 py-1 text-xs rounded-full self-start sm:self-center bg-green-500/20 text-green-400">
                                  {t('common.confirmed')}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-400 mb-2">
                                {reservation.event?.social_hub?.name || t('common.unknownVenue')}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-300">
                                <span>{formatNumber(reservation.number_of_people, language)} {t('common.people')}</span>
                                <span>{formatCurrency((reservation.event?.price || 0) * (reservation.number_of_people || 0), language, t('common.currency'))}</span>
                              </div>
                            </div>
                            {reservation.event?.isFallback ? (
                              <div className="mt-2 sm:mt-0 text-xs text-slate-500">
                                {t('common.eventDetailsUnavailable') || 'Event details unavailable'}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Other Reservations (completed, cancelled) */}
              {enrichedReservations.filter(r => !['pending', 'confirmed'].includes(r.status)).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="calendar" className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-400">{t('common.otherReservations')}</h3>
                  </div>
                  <div className="space-y-3">
                    {enrichedReservations
                      .filter(r => !['pending', 'confirmed'].includes(r.status))
                      .map((reservation) => {
                        // Determine the actual event status using centralized logic
                        const event = reservation.event
                        let displayStatus = reservation.status
                        let statusClassName = ''
                        let statusText = ''
                        
                        if (event) {
                          // Use centralized function to get correct event status
                          const correctEventStatus = getCorrectEventStatus(event)
                          
                          if (correctEventStatus === 'completed') {
                            displayStatus = 'completed'
                            statusClassName = 'bg-green-500/20 text-green-400'
                            statusText = t('common.eventCompleted')
                          } else if (correctEventStatus === 'cancelled') {
                            displayStatus = 'cancelled'
                            statusClassName = 'bg-red-500/20 text-red-400'
                            statusText = t('common.eventCancelled')
                          } else {
                            // Use original status for events that are still upcoming
                            statusClassName = reservation.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                            statusText = t(`common.${reservation.status}`)
                          }
                        } else {
                          // Fallback if no event data
                          statusClassName = reservation.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                          statusText = t(`common.${reservation.status}`)
                        }
                        
                        return (
                        <div key={reservation.id} className={`card p-3 sm:p-4 md:p-6 ${
                          displayStatus === 'completed' ? 'border-l-4 border-green-500 bg-green-500/5' :
                          displayStatus === 'cancelled' ? 'border-l-4 border-red-500 bg-red-500/5' :
                          'border-l-4 border-slate-500'
                        }`}>
                          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                            <div className="w-full sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden mx-auto sm:mx-0">
                              {reservation.event.image_url ? (
                                <img
                                  src={reservation.event.image_url}
                                  alt={reservation.event.name}
                                  className="w-full h-32 sm:h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-32 sm:h-full flex items-center justify-center">
                                  <Icon name="calendar" className="w-6 h-6 text-slate-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="font-semibold text-sm sm:text-base truncate">
                                  {reservation.event?.name || t('common.unknownEvent')}
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-1">
                                  <span className={`px-2 py-1 text-xs rounded-full self-start sm:self-center ${statusClassName}`}>
                                    {statusText}
                                  </span>
                                  {displayStatus === 'completed' && (
                                    <span className="px-2 py-1 text-xs rounded-full self-start sm:self-center bg-green-500/20 text-green-400">
                                      ✅ {t('common.eventCompletedSuccessfully')}
                                    </span>
                                  )}
                                  {displayStatus === 'cancelled' && (
                                    <span className="px-2 py-1 text-xs rounded-full self-start sm:self-center bg-red-500/20 text-red-400">
                                      ❌ {t('common.eventCancelledDueToMinimum')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-400 mb-2">
                                {reservation.event?.social_hub?.name || t('common.unknownVenue')}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-300">
                                <span>{formatNumber(reservation.number_of_people, language)} {t('common.people')}</span>
                                <span>{formatCurrency((reservation.event?.price || 0) * (reservation.number_of_people || 0), language, t('common.currency'))}</span>
                              </div>
                                {/* Show additional info for events that didn't reach minimum */}
                                {event && isTicketSalesClosed(event) && shouldShowEventAsCancelled(event) && (
                                  <div className="mt-2 p-2 bg-red-500/10 rounded-lg">
                                    <p className="text-xs text-red-400">
                                      {t('common.eventCancelledDueToMinimum') || 'Event was cancelled due to not reaching minimum participants'}
                                    </p>
                                  </div>
                                )}
                                {/* Show additional info for events that reached minimum */}
                                {event && isTicketSalesClosed(event) && shouldShowEventAsCompleted(event) && (
                                  <div className="mt-2 p-2 bg-green-500/10 rounded-lg">
                                    <p className="text-xs text-green-400">
                                      {t('common.eventCompletedSuccessfully') || 'Event completed successfully - minimum participants reached'}
                                    </p>
                                  </div>
                                )}
                            </div>
                            {reservation.event?.isFallback ? (
                              <div className="mt-2 sm:mt-0 text-xs text-slate-500">
                                {t('common.eventDetailsUnavailable') || 'Event details unavailable'}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          {favoriteHubs.length === 0 ? (
            <div className="card p-6 md:p-8 text-center">
              <Icon name="heart" className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-400 mb-2">{t('common.noFavoritesYet')}</h3>
              <p className="text-responsive-sm text-slate-500 mb-6">
                {t('common.discoverAmazingVenuesAndAddFavorites')}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteHubs.map((hub) => (
                <SocialHubCard key={hub.id} hub={hub} variant="compact" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 max-w-md w-full space-y-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {t('common.settings') || 'Settings'}
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('common.language') || 'Language'}
                </label>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 max-w-sm w-full space-y-6 animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Icon name="warning" className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {t('common.logoutAccount')}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t('common.logoutConfirmation')}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="btn-ghost flex-1"
              >
                <Icon name="close" className="w-4 h-4" />
                <span>{t('common.cancel')}</span>
              </button>
              <button
                onClick={confirmLogout}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Icon name="check" className="w-4 h-4" />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
