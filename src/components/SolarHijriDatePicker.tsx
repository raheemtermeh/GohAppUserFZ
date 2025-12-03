import React, { useState, useEffect } from 'react'
import DatePicker from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import gregorian from 'react-date-object/calendars/gregorian'
import gregorian_en from 'react-date-object/locales/gregorian_en'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  formatSolarHijriInputDate, 
  parseSolarHijriDate, 
  getCurrentSolarHijriDate,
  gregorianToSolarHijri,
  solarHijriToGregorian,
  toPersianNumbers,
  toEnglishNumbers
} from '../utils/solarHijriCalendar'

interface SolarHijriDatePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  className?: string
  required?: boolean
  disabled?: boolean
  allowPastDates?: boolean
}

export default function SolarHijriDatePicker({ 
  value, 
  onChange, 
  min, 
  max, 
  className = '', 
  required = false,
  disabled = false,
  allowPastDates = false
}: SolarHijriDatePickerProps) {
  const { language } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Initialize selected date from value
  useEffect(() => {
    if (value) {
      try {
        // Parse the ISO date string and create a Date object
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          setSelectedDate(date)
        }
      } catch (error) {
        console.error('Error parsing date:', error)
        setSelectedDate(null)
      }
    } else {
      setSelectedDate(null)
    }
  }, [value])

  // Handle date change from the picker
  const handleDateChange = (date: any) => {
    if (date) {
      try {
        // Convert the date object to ISO string
        const isoString = date.toDate().toISOString().split('T')[0]
        onChange(isoString)
      } catch (error) {
        console.error('Error converting date:', error)
      }
    } else {
      onChange('')
    }
  }

  // Convert min/max dates to Date objects
  const getMinDate = () => {
    if (min) {
      return new Date(min)
    }
    if (!allowPastDates) {
      return new Date()
    }
    return undefined
  }

  const getMaxDate = () => {
    if (max) {
      return new Date(max)
    }
    return undefined
  }

  // Use Persian calendar for Persian language, Gregorian for English
  const calendar = language === 'fa' ? persian : gregorian
  const locale = language === 'fa' ? persian_fa : gregorian_en
  const placeholder = language === 'fa' ? 'تاریخ را انتخاب کنید' : 'Select date'
  const format = language === 'fa' ? 'YYYY/MM/DD' : 'MM/DD/YYYY'

  return (
    <div className={`w-full ${className}`}>
      <DatePicker
        value={selectedDate}
        onChange={handleDateChange}
        calendar={calendar}
        locale={locale}
        minDate={getMinDate()}
        maxDate={getMaxDate()}
        disabled={disabled}
        required={required}
        format={format}
        calendarPosition="bottom-right"
        containerClassName="w-full"
        inputClass={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'inherit',
          fontSize: 'inherit',
          fontFamily: 'inherit'
        }}
      />
    </div>
  )
}