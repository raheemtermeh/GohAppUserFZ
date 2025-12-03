# Language Switcher Z-Index Fix

## Problem
The language switcher dropdown was being covered by the back button in venue pages when the language was set to English. The back button had a higher z-index (`z-30`) than the language switcher dropdown (`z-20`), causing the language options to be hidden behind the back button.

## Solution
Implemented a comprehensive z-index system to ensure proper layering of UI elements:

### 1. **Standardized Z-Index Values**
```css
:root {
  --z-dropdown: 50;          /* Language switcher dropdown */
  --z-dropdown-backdrop: 40; /* Language switcher backdrop */
  --z-back-button: 20;       /* Back buttons */
  --z-header: 20;            /* Header elements */
  --z-floating-button: 30;   /* Floating action buttons */
  --z-overlay: 10;           /* General overlays */
}
```

### 2. **Updated Components**

#### Language Switcher (Main App)
- **Dropdown**: `z-50` (was `z-20`)
- **Backdrop**: `z-40` (was `z-10`)
- **Button**: `z-50` (new)

#### Language Switcher (Owner App)
- **Dropdown**: `z-50` (was `z-20`)
- **Backdrop**: `z-40` (was `z-10`)

#### Back Button
- **Z-Index**: `z-20` (was `z-30`)

### 3. **CSS Classes Added**
```css
.language-switcher {
  position: relative;
  z-index: var(--z-dropdown);
}

.language-switcher * {
  position: relative;
  z-index: var(--z-dropdown) !important;
}

.z-dropdown {
  z-index: var(--z-dropdown) !important;
}

.z-back-button {
  z-index: var(--z-back-button) !important;
}
```

### 4. **Files Modified**

#### Main App (Funzone APP front)
- ✅ `src/components/LanguageSwitcher.tsx` - Updated z-index values
- ✅ `src/components/BackButton.tsx` - Reduced z-index
- ✅ `src/styles/z-index.css` - New z-index system
- ✅ `src/components/LanguageSwitcherTest.tsx` - Test component

#### Owner App (FunZone Owner App)
- ✅ `src/ui/AppLayout.tsx` - Updated language switcher z-index
- ✅ `src/styles/z-index.css` - New z-index system

### 5. **Z-Index Hierarchy**
```
z-80: Tooltips
z-70: Toast notifications
z-60: Modal dialogs
z-50: Language switcher dropdown ✅
z-40: Language switcher backdrop ✅
z-30: Floating action buttons
z-20: Back buttons ✅
z-20: Header elements
z-10: General overlays
```

## Testing

### Manual Testing
1. Navigate to any venue page
2. Set language to English
3. Click the language switcher button
4. Verify the dropdown appears in front of the back button
5. Verify you can click on language options

### Test Component
Use `LanguageSwitcherTest.tsx` to verify the fix:
```tsx
import LanguageSwitcherTest from '../components/LanguageSwitcherTest'

// Add to your routes for testing
<Route path="/test-language-switcher" element={<LanguageSwitcherTest />} />
```

## Benefits

1. **✅ Fixed Issue**: Language switcher now appears in front of back button
2. **🎯 Standardized System**: Consistent z-index values across the app
3. **🔧 Future-Proof**: Prevents similar issues with other UI elements
4. **📱 Responsive**: Works on all screen sizes
5. **🌍 RTL Support**: Maintains proper layering in RTL layouts

## Usage

### For Developers
```tsx
// Use standardized z-index classes
<div className="z-dropdown">Language Switcher</div>
<div className="z-back-button">Back Button</div>

// Or use CSS variables
<div style={{ zIndex: 'var(--z-dropdown)' }}>Language Switcher</div>
```

### CSS Import
Make sure to import the z-index CSS:
```tsx
// In your main CSS file or index.tsx
import './styles/z-index.css'
```

## Verification

The fix ensures that:
- ✅ Language switcher dropdown appears above back button
- ✅ Language options are clickable
- ✅ Backdrop prevents interaction with background elements
- ✅ Works in both LTR and RTL layouts
- ✅ Maintains accessibility features
- ✅ No visual regressions in other components

## Future Maintenance

When adding new UI elements:
1. **Check z-index hierarchy** before setting z-index values
2. **Use CSS classes** from the standardized system
3. **Test thoroughly** in different page layouts
4. **Update documentation** if adding new z-index levels

---

*Fix implemented: December 2024*
*Status: ✅ Resolved*
