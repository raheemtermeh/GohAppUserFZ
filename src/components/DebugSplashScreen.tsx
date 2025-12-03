import React, { useState, useEffect, useRef } from 'react'

interface DebugSplashScreenProps {
  onComplete: () => void
}

export default function DebugSplashScreen({ onComplete }: DebugSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const startTime = useRef(Date.now())
  const minDisplayTime = 2500 // 2.5 seconds minimum

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(`[SplashScreen] ${message}`)
  }

  useEffect(() => {
    addDebugInfo('SplashScreen component mounted')
    
    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem('splashShown')
    addDebugInfo(`Session storage splashShown: ${splashShown}`)
    
    if (splashShown === 'true') {
      addDebugInfo('Splash already shown, completing immediately')
      onComplete()
      return
    }

    // Try to play video
    if (videoRef.current) {
      addDebugInfo('Attempting to play video')
      videoRef.current.play().catch((error) => {
        addDebugInfo(`Video autoplay failed: ${error.message}`)
        setVideoError(true)
      })
    }
  }, [onComplete])

  const handleVideoLoaded = () => {
    setVideoLoaded(true)
    addDebugInfo('Video loaded successfully')
  }

  const handleVideoEnded = () => {
    addDebugInfo('Video ended')
    handleComplete()
  }

  const handleVideoError = () => {
    addDebugInfo('Video failed to load, using fallback')
    setVideoError(true)
  }

  const handleComplete = () => {
    const elapsed = Date.now() - startTime.current
    const remainingTime = Math.max(0, minDisplayTime - elapsed)
    
    addDebugInfo(`Completing splash screen. Elapsed: ${elapsed}ms, Remaining: ${remainingTime}ms`)
    
    setTimeout(() => {
      setIsVisible(false)
      // Mark splash as shown in this session
      sessionStorage.setItem('splashShown', 'true')
      addDebugInfo('Marked splash as shown in session storage')
      setTimeout(() => {
        addDebugInfo('Calling onComplete')
        onComplete()
      }, 300)
    }, remainingTime)
  }

  // Don't show splash if already shown in this session
  const splashShown = sessionStorage.getItem('splashShown')
  if (splashShown === 'true') {
    addDebugInfo('Splash already shown, returning null')
    return null
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={`fixed inset-0 z-50 bg-slate-900 flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Debug Info Panel */}
      <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg max-w-md text-xs">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <div className="space-y-1">
          <div>Video Loaded: {videoLoaded ? '✅' : '❌'}</div>
          <div>Video Error: {videoError ? '❌' : '✅'}</div>
          <div>Visible: {isVisible ? '✅' : '❌'}</div>
          <div>Session Shown: {splashShown || 'null'}</div>
        </div>
        <div className="mt-2 max-h-32 overflow-y-auto">
          {debugInfo.map((info, index) => (
            <div key={index} className="text-xs">{info}</div>
          ))}
        </div>
        <button 
          onClick={handleComplete}
          className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Force Complete
        </button>
      </div>

      {/* Video Background or Fallback */}
      <div className="absolute inset-0 w-full h-full">
        {!videoError ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop={false}
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            onLoadedData={handleVideoLoaded}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
          >
            <source src="/splash.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          // Fallback gradient background
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-slate-900 to-teal-900 flex items-center justify-center">
            <div className="text-center space-y-4">
              <img 
                src="/logo.png" 
                alt="Funzone" 
                className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain mx-auto animate-pulse"
              />
              <div className="text-white text-lg sm:text-xl font-semibold">
                Welcome to Funzone
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay with logo (only show if video is playing) */}
      {!videoError && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center space-y-4">
            <img 
              src="/logo.png" 
              alt="Funzone" 
              className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain mx-auto animate-pulse"
            />
            <div className="text-white text-lg sm:text-xl font-semibold">
              Welcome to Funzone
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}

