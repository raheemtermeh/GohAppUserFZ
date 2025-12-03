import { StoreProvider } from './state/apiStore'
import { Outlet } from 'react-router-dom'
import { getApiConfig } from './config/api'
import Notification from './components/Notification'
import SplashScreen from './components/SplashScreen'
import { useState, useEffect } from 'react'

export default function App() {
  const config = getApiConfig()
  const [showSplash, setShowSplash] = useState(true)
  
  useEffect(() => {
    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem('splashShown')
    if (splashShown === 'true') {
      setShowSplash(false)
    }
  }, [])
  
  const handleSplashComplete = () => {
    setShowSplash(false)
  }
  
  return (
    <StoreProvider>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Outlet />
      <Notification />
    </StoreProvider>
  )
}






