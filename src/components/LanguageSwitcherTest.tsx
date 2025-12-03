import React from 'react'
import LanguageSwitcher from './LanguageSwitcher'
import BackButton from './BackButton'

/**
 * Test component to verify language switcher z-index fix
 * This component simulates the venue page layout to test
 * that the language switcher appears in front of the back button
 */
const LanguageSwitcherTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <h1 className="text-2xl font-bold text-white mb-8">
        Language Switcher Z-Index Test
      </h1>
      
      {/* Simulate venue page layout */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-800 p-8">
        <div className="absolute top-4 left-4 right-4">
          {/* Back Button - should be behind language switcher */}
          <div className="mb-4">
            <BackButton />
          </div>
          
          {/* Language Switcher - should appear in front */}
          <div className="absolute top-0 right-0">
            <LanguageSwitcher />
          </div>
        </div>
        
        <div className="pt-20">
          <h2 className="text-xl font-semibold text-white mb-4">
            Test Instructions:
          </h2>
          <ol className="text-slate-300 space-y-2">
            <li>1. Click the language switcher button</li>
            <li>2. The dropdown should appear in front of the back button</li>
            <li>3. The back button should not cover the language options</li>
            <li>4. You should be able to click on language options</li>
          </ol>
        </div>
      </div>
      
      {/* Z-Index Debug Info */}
      <div className="mt-8 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">
          Z-Index Values:
        </h3>
        <div className="text-sm text-slate-300 space-y-1">
          <div>Language Switcher: z-50 (--z-dropdown)</div>
          <div>Language Switcher Backdrop: z-40 (--z-dropdown-backdrop)</div>
          <div>Back Button: z-20 (--z-back-button)</div>
        </div>
      </div>
    </div>
  )
}

export default LanguageSwitcherTest
