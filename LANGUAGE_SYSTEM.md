# FunZone Language System Documentation

## Overview

The FunZone app now features a comprehensive internationalization (i18n) system that supports multiple languages with automatic detection, persistent preferences, and full RTL (Right-to-Left) support for Persian language.

## Supported Languages

- **English (en)**: Default language with LTR (Left-to-Right) layout
- **Persian/Farsi (fa)**: Full RTL support with native script display

## Key Features

### 🌍 Automatic Language Detection
- Detects user's browser language preferences
- Falls back to saved preferences in localStorage
- Defaults to English if no preference is detected

### 💾 Persistent Language Preferences
- Language choice is saved to localStorage
- Preferences persist across browser sessions
- Separate storage keys for different apps (main app vs owner app)

### 🎨 Enhanced UI Components
- **Language Switcher**: Dropdown with native language names and flags
- **Language Indicator**: Shows current language with visual cues
- **Language Settings**: Comprehensive language management interface

### 🔄 RTL Support
- Complete Right-to-Left layout support for Persian
- Automatic text direction switching
- RTL-specific CSS utilities and animations
- Form elements and navigation adapt to RTL layout

## File Structure

```
src/
├── components/
│   ├── LanguageSwitcher.tsx      # Main language switcher component
│   ├── LanguageIndicator.tsx     # Language indicator component
│   └── LanguageSettings.tsx     # Language settings page
├── contexts/
│   └── LanguageContext.tsx       # Language context with detection
├── utils/
│   └── languageUtils.ts          # Language utility functions
├── styles/
│   └── rtl.css                  # RTL-specific styles
└── i18n/
    ├── index.ts                 # Language configuration
    └── translations/
        ├── en.json              # English translations
        └── fa.json              # Persian translations
```

## Usage Examples

### Basic Language Switching

```tsx
import { useLanguage } from '../contexts/LanguageContext'

function MyComponent() {
  const { language, setLanguage, t, isRTL } = useLanguage()
  
  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('common.welcome')}</h1>
      <button onClick={() => setLanguage('fa')}>
        Switch to Persian
      </button>
    </div>
  )
}
```

### Language Switcher Component

```tsx
import LanguageSwitcher from '../components/LanguageSwitcher'

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <LanguageSwitcher />
    </header>
  )
}
```

### Language Indicator

```tsx
import LanguageIndicator from '../components/LanguageIndicator'

function StatusBar() {
  return (
    <div className="status-bar">
      <span>Status: Online</span>
      <LanguageIndicator showText={true} size="sm" />
    </div>
  )
}
```

### Language Settings Page

```tsx
import LanguageSettings from '../components/LanguageSettings'

function SettingsPage() {
  return (
    <div className="settings-page">
      <h2>Settings</h2>
      <LanguageSettings 
        showTitle={true}
        onClose={() => navigate('/')}
      />
    </div>
  )
}
```

## Language Detection Logic

The system detects user language preferences in the following order:

1. **Saved Preference**: Checks localStorage for previously saved language
2. **Browser Language**: Analyzes `navigator.language` for supported languages
3. **Default Fallback**: Uses English as the default language

### Detection Criteria

- **Persian (fa)**: Detects `fa`, `persian`, `farsi`, or `ir` in browser language
- **English (en)**: Detects `en` in browser language
- **Fallback**: Defaults to English if no match is found

## RTL Support

### Automatic RTL Application

When Persian is selected:
- Document direction is set to `rtl`
- Body class is updated to `rtl`
- All RTL-specific CSS rules are applied

### RTL CSS Classes

```css
.rtl {
  direction: rtl;
  text-align: right;
}

.rtl .flex-row {
  flex-direction: row-reverse;
}

.rtl .ml-auto {
  margin-left: 0;
  margin-right: auto;
}
```

### RTL Component Adjustments

- **Navigation**: Icons and text align to the right
- **Forms**: Input fields and labels align to the right
- **Tables**: Content aligns to the right
- **Modals**: Headers and content align to the right

## Translation System

### Adding New Translations

1. **Add to translation files**:
```json
// en.json
{
  "common": {
    "newKey": "New Translation"
  }
}

// fa.json
{
  "common": {
    "newKey": "ترجمه جدید"
  }
}
```

2. **Use in components**:
```tsx
const { t } = useLanguage()
const text = t('common.newKey')
```

### Translation with Parameters

```json
{
  "welcome": "Welcome, {name}!"
}
```

```tsx
const message = t('welcome', { name: 'John' })
// Result: "Welcome, John!"
```

## Language Utilities

### Formatting Functions

```tsx
import { formatNumber, formatDate, formatCurrency } from '../utils/languageUtils'

// Format numbers according to locale
const formattedNumber = formatNumber(1234.56, 'fa') // "۱,۲۳۴.۵۶"

// Format dates according to locale
const formattedDate = formatDate(new Date(), 'fa') // "۱۴۰۳/۰۱/۱۵"

// Format currency according to locale
const formattedCurrency = formatCurrency(100000, 'fa', 'IRR') // "۱۰۰,۰۰۰ ریال"
```

### Language Information

```tsx
import { getLanguageInfo, isRTL } from '../utils/languageUtils'

const languageInfo = getLanguageInfo('fa')
// Returns: { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', direction: 'rtl' }

const isRightToLeft = isRTL('fa') // true
```

## Event System

### Language Change Events

Components can listen to language changes:

```tsx
useEffect(() => {
  const handleLanguageChange = (event) => {
    const { language, isRTL } = event.detail
    console.log(`Language changed to ${language}, RTL: ${isRTL}`)
  }
  
  window.addEventListener('languageChanged', handleLanguageChange)
  
  return () => {
    window.removeEventListener('languageChanged', handleLanguageChange)
  }
}, [])
```

## Best Practices

### 1. Always Use Translation Keys
```tsx
// ❌ Don't hardcode text
<h1>Welcome to FunZone</h1>

// ✅ Use translation keys
<h1>{t('common.welcome')}</h1>
```

### 2. Handle RTL Layout
```tsx
// ❌ Don't assume LTR layout
<div className="flex items-start">
  <Icon />
  <Text />
</div>

// ✅ Use RTL-aware classes
<div className={`flex items-start ${isRTL ? 'rtl' : 'ltr'}`}>
  <Icon />
  <Text />
</div>
```

### 3. Test Both Languages
- Always test your components in both English and Persian
- Verify RTL layout works correctly
- Check that all text is properly translated

### 4. Use Semantic HTML
```tsx
// ✅ Use proper HTML attributes
<button 
  aria-label={t('common.changeLanguage')}
  aria-expanded={isOpen}
  aria-haspopup="true"
>
  {currentLanguage?.nativeName}
</button>
```

## Troubleshooting

### Common Issues

1. **Language not persisting**: Check localStorage key and ensure it's being saved
2. **RTL layout broken**: Verify RTL CSS is imported and applied
3. **Translations missing**: Ensure translation keys exist in both language files
4. **Language detection not working**: Check browser language settings
5. **Language switcher covered by other elements**: Z-index conflicts resolved with standardized system

### Z-Index System

The app uses a standardized z-index system to prevent UI conflicts:

```css
/* Z-Index Hierarchy */
--z-dropdown: 50          /* Language switcher dropdown */
--z-dropdown-backdrop: 40 /* Language switcher backdrop */
--z-modal: 60             /* Modal dialogs */
--z-toast: 70             /* Toast notifications */
--z-tooltip: 80           /* Tooltips */
--z-header: 20            /* Header elements */
--z-back-button: 20       /* Back buttons */
--z-floating-button: 30   /* Floating action buttons */
--z-overlay: 10           /* General overlays */
```

### Language Switcher Positioning

The language switcher is designed to appear above all other UI elements:

- **Dropdown**: `z-50` (highest priority for interactive elements)
- **Backdrop**: `z-40` (prevents interaction with background elements)
- **Button**: `z-50` (ensures clickability)

### Fixing Z-Index Issues

If you encounter z-index conflicts:

1. **Use CSS classes**: Apply `z-dropdown`, `z-back-button`, etc.
2. **Check CSS imports**: Ensure `z-index.css` is imported
3. **Override if needed**: Use `!important` for critical elements
4. **Test thoroughly**: Verify in different page layouts

### Debug Mode

Enable debug logging:
```tsx
// In LanguageContext.tsx
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('Language detected:', detectedLanguage)
  console.log('RTL mode:', isRTL)
}
```

## Future Enhancements

### Planned Features
- [ ] Add more languages (Arabic, Turkish, etc.)
- [ ] Language-specific date/time formats
- [ ] Dynamic language loading
- [ ] Language-specific fonts
- [ ] Voice language detection

### Contributing

When adding new languages:
1. Add language info to `SUPPORTED_LANGUAGES`
2. Create translation files
3. Add RTL support if needed
4. Update language detection logic
5. Test thoroughly in both directions

## Support

For issues or questions about the language system:
1. Check this documentation first
2. Review the component examples
3. Test with different browser language settings
4. Verify localStorage is working correctly

---

*Last updated: December 2024*
