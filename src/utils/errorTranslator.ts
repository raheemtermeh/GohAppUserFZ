/**
 * Utility function to translate error messages from English to Persian
 */

import type { Language } from '../i18n'

// Error message mappings from English to Persian
const errorTranslations: Record<string, string> = {
  // Authentication errors
  'Phone number is required': 'شماره تلفن الزامی است',
  'Phone number and verification code are required': 'شماره تلفن و کد تأیید الزامی است',
  'Invalid phone number format': 'فرمت شماره تلفن نامعتبر است',
  'Invalid phone number format. Please use Iranian mobile number format (+98xxxxxxxxxx)': 'فرمت شماره تلفن نامعتبر است. لطفاً شماره موبایل ایرانی معتبر وارد کنید (+98xxxxxxxxxx)',
  'Verification code has expired': 'کد تأیید منقضی شده است',
  'Invalid verification code': 'کد تأیید نامعتبر است',
  'Invalid credentials': 'اطلاعات ورود نامعتبر است',
  'Username/email and password are required': 'نام کاربری/ایمیل و رمز عبور الزامی است',
  'Authentication error': 'خطا در احراز هویت',
  
  // Profile completion errors
  'Owner ID, first name, last name, username, and national code are required': 'شناسه مالک، نام، نام خانوادگی، نام کاربری و کد ملی الزامی است',
  'Customer ID, first name, last name, and username are required': 'شناسه مشتری، نام، نام خانوادگی و نام کاربری الزامی است',
  'Username already taken': 'این نام کاربری قبلاً استفاده شده است',
  'National code already registered': 'این کد ملی قبلاً ثبت شده است',
  'Owner not found': 'مالک یافت نشد',
  'Customer not found': 'مشتری یافت نشد',
  
  // Network errors
  'Network request failed': 'درخواست شبکه ناموفق بود',
  'Failed to fetch': 'دریافت اطلاعات ناموفق بود',
  'Connection timeout': 'زمان اتصال به پایان رسید',
  'Server error': 'خطای سرور',
  'Service unavailable': 'سرویس در دسترس نیست',
  
  // Generic errors
  'An error occurred': 'خطایی رخ داد',
  'Something went wrong': 'مشکلی پیش آمد',
  'Please try again': 'لطفاً دوباره تلاش کنید',
}

/**
 * Translates an error message to Persian if the language is Persian
 * @param errorMessage - The error message to translate
 * @param language - The current language
 * @returns The translated error message or the original if translation not found
 */
export function translateError(errorMessage: string, language: Language = 'fa'): string {
  if (!errorMessage) {
    return errorMessage
  }
  
  // If language is not Persian, return original message
  if (language !== 'fa') {
    return errorMessage
  }
  
  // Try to find exact match first
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage]
  }
  
  // Try to find partial match (case-insensitive)
  const lowerErrorMessage = errorMessage.toLowerCase()
  for (const [englishError, persianError] of Object.entries(errorTranslations)) {
    if (lowerErrorMessage.includes(englishError.toLowerCase())) {
      return persianError
    }
  }
  
  // If no translation found, return original message
  return errorMessage
}

/**
 * Extracts error message from various error formats
 * @param error - Error object, string, or response
 * @param language - The current language
 * @returns Translated error message
 */
export function getErrorMessage(error: any, language: Language = 'fa'): string {
  if (!error) {
    return language === 'fa' ? 'خطایی رخ داد' : 'An error occurred'
  }
  
  let errorMessage = ''
  
  // Handle Error objects
  if (error instanceof Error) {
    errorMessage = error.message
  }
  // Handle string errors
  else if (typeof error === 'string') {
    errorMessage = error
  }
  // Handle response objects with error property
  else if (error.error) {
    errorMessage = typeof error.error === 'string' ? error.error : error.error.message || JSON.stringify(error.error)
  }
  // Handle response objects with message property
  else if (error.message) {
    errorMessage = error.message
  }
  // Handle response objects with detail property (Django REST framework style)
  else if (error.detail) {
    errorMessage = error.detail
  }
  // Handle response objects with non_field_errors (Django REST framework style)
  else if (error.non_field_errors && Array.isArray(error.non_field_errors)) {
    errorMessage = error.non_field_errors.join(', ')
  }
  // Handle field-specific errors
  else if (typeof error === 'object') {
    const fieldErrors = Object.entries(error)
      .map(([field, errors]: [string, any]) => {
        if (Array.isArray(errors)) {
          return `${field}: ${errors.join(', ')}`
        }
        return `${field}: ${errors}`
      })
      .join('; ')
    if (fieldErrors) {
      errorMessage = fieldErrors
    }
  }
  
  // If still no message, use a default
  if (!errorMessage) {
    errorMessage = language === 'fa' ? 'خطایی رخ داد' : 'An error occurred'
  }
  
  return translateError(errorMessage, language)
}

