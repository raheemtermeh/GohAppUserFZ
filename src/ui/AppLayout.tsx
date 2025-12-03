import { Outlet, NavLink } from 'react-router-dom'
import Icon from '../components/Icon'
import { useLanguage } from '../contexts/LanguageContext'
import { useStore, useCart } from '../state/apiStore'

function TabLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  const { t } = useLanguage()
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'text-white bg-gradient-to-r from-purple-500/20 to-teal-500/20 shadow-glow' 
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
        }`
      }
    >
      <span className="text-lg sm:text-xl leading-none text-center">{icon}</span>
      <span className="text-xs sm:text-sm font-medium leading-tight text-center">{t(label)}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const { t, isRTL } = useLanguage()
  const { state } = useStore()
  const cartItems = useCart()
  const cartCount = cartItems.length
  
  return (
    <div className={`min-h-dvh w-full relative flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-5 pb-2 sm:pb-3 sticky top-0 z-20">
        <div className="glass-card px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between">
          {/* Left side - Reservation Cart and Filter */}
          <div className={`flex items-center gap-1 sm:gap-2 md:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <NavLink 
              to="/cart" 
              className="chip inline-flex items-center gap-1 text-xs sm:text-sm hover:scale-105 transition-transform relative"
            >
              <Icon name="cart" className="w-3 h-3 sm:w-4 sm:h-4"/> 
              <span className="hidden xs:inline">{t('common.myCart') || 'Cart'}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </NavLink>
            <NavLink 
              to="/filters" 
              className="chip inline-flex items-center gap-1 text-xs sm:text-sm hover:scale-105 transition-transform"
            >
              <Icon name="filter" className="w-3 h-3 sm:w-4 sm:h-4"/> 
              <span className="hidden xs:inline">{t('common.filters')}</span>
            </NavLink>
          </div>
          
          {/* Center - Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Funzone" 
              className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto object-contain"
            />
          </div>
          
          {/* Right side - Support and Login/Profile */}
          <div className={`flex items-center gap-1 sm:gap-2 md:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <NavLink 
              to="/support" 
              className="chip inline-flex items-center gap-1 text-xs sm:text-sm hover:scale-105 transition-transform"
            >
              <Icon name="phone" className="w-3 h-3 sm:w-4 sm:h-4"/> 
              <span className="hidden xs:inline">{t('common.support')}</span>
            </NavLink>
            {state.auth.isLoggedIn ? (
              <NavLink 
                to="/profile" 
                className="chip inline-flex items-center gap-1 text-xs sm:text-sm hover:scale-105 transition-transform"
              >
                <Icon name="user" className="w-3 h-3 sm:w-4 sm:h-4"/> 
                <span className="hidden xs:inline">{state.auth.user?.first_name || t('common.profile')}</span>
              </NavLink>
            ) : (
              <NavLink 
                to="/login" 
                className="chip inline-flex items-center gap-1 text-xs sm:text-sm hover:scale-105 transition-transform"
              >
                <Icon name="login" className="w-3 h-3 sm:w-4 sm:h-4"/> 
                <span className="hidden xs:inline">{t('common.login')}</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-4 md:px-6 pb-20 sm:pb-24 md:pb-28">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 sm:px-6">
        <div className="w-full">
          <div className="glass-card px-2 sm:px-3 py-2 m-2 sm:m-3">
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              <TabLink to="/" label="navigation.home" icon="🏠" />
              <TabLink to="/venues" label="navigation.venues" icon="🏢" />
              <TabLink to="/events" label="navigation.events" icon="🎉" />
              <TabLink to="/map" label="navigation.map" icon="🗺️" />
              <TabLink to="/reservations" label="navigation.myReservations" icon="📅" />
            </div>
          </div>
        </div>
      </nav>

      {/* Responsive Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>
    </div>
  )
}
