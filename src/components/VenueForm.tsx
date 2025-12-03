import React, { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useApiActions } from '../state/apiStore'
import Icon from './Icon'
import type { SocialHub } from '../services/api'

interface VenueFormProps {
  venue?: SocialHub
  onSuccess?: (venue: SocialHub) => void
  onCancel?: () => void
  isEditing?: boolean
}

interface FormData {
  name: string
  address: string
  description: string
  latitude: string
  longitude: string
  postal_code: string
}

export default function VenueForm({ venue, onSuccess, onCancel, isEditing = false }: VenueFormProps) {
  const { t, isRTL } = useLanguage()
  const { createSocialHub, updateSocialHub } = useApiActions()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    description: '',
    latitude: '',
    longitude: '',
    postal_code: ''
  })

  useEffect(() => {
    if (venue && isEditing) {
      setFormData({
        name: venue.name || '',
        address: venue.address || '',
        description: venue.description || '',
        latitude: venue.latitude?.toString() || '',
        longitude: venue.longitude?.toString() || '',
        postal_code: venue.postal_code?.toString() || ''
      })
    }
  }, [venue, isEditing])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('نام مکان الزامی است')
      return false
    }
    if (!formData.address.trim()) {
      setError('آدرس الزامی است')
      return false
    }
    if (formData.latitude && isNaN(parseFloat(formData.latitude))) {
      setError('عرض جغرافیایی باید عدد باشد')
      return false
    }
    if (formData.longitude && isNaN(parseFloat(formData.longitude))) {
      setError('طول جغرافیایی باید عدد باشد')
      return false
    }
    if (formData.postal_code && isNaN(parseInt(formData.postal_code))) {
      setError('کد پستی باید عدد باشد')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const venueData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        description: formData.description.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        postal_code: formData.postal_code ? parseInt(formData.postal_code) : undefined,
      }

      let result: SocialHub
      if (isEditing && venue) {
        result = await updateSocialHub(venue.id, venueData)
      } else {
        result = await createSocialHub(venueData)
      }

      onSuccess?.(result)
    } catch (err) {
      console.error('Failed to save venue:', err)
      setError(err instanceof Error ? err.message : 'خطا در ذخیره مکان')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-teal-500 grid place-items-center text-white">
            <Icon name="location" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gradient">
              {isEditing ? t('venue.editVenue') : t('venue.addVenue')}
            </h2>
            <p className="text-sm text-slate-400">
              {isEditing ? t('venue.editVenueDescription') : t('venue.addVenueDescription')}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <Icon name="alert-circle" className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('venue.name')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder={t('venue.namePlaceholder')}
              disabled={isLoading}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('venue.address')} <span className="text-red-400">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
              placeholder={t('venue.addressPlaceholder')}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('venue.description')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
              placeholder={t('venue.descriptionPlaceholder')}
              disabled={isLoading}
            />
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('venue.latitude')}
              </label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="35.6892"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('venue.longitude')}
              </label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="51.3890"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('venue.postalCode')}
            </label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="1234567890"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 sm:flex-none sm:px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('common.saving')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Icon name="check" className="w-4 h-4" />
                  <span>{t('common.save')}</span>
                </div>
              )}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="btn-ghost flex-1 sm:flex-none sm:px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Icon name="x" className="w-4 h-4" />
                  <span>{t('common.cancel')}</span>
                </div>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}



