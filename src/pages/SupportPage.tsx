import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useStore } from '../state/apiStore'
import BackButton from '../components/BackButton'
import { apiService, SupportTicket, TicketComment } from '../services/api'
import { formatDate } from '../utils/persianNumbers'

export default function SupportPage() {
  const { t, isRTL, language } = useLanguage()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'contact' | 'tickets' | 'create'>('contact')
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  })
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [newComment, setNewComment] = useState('')
  const [showTicketDetails, setShowTicketDetails] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [addingComment, setAddingComment] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])

  // Fetch tickets from API
  useEffect(() => {
    if (state.auth.isLoggedIn && state.auth.user) {
      fetchTickets()
    }
  }, [state.auth.isLoggedIn, state.auth.user])

  const fetchTickets = async () => {
    if (!state.auth.isLoggedIn || !state.auth.user) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await apiService.support.tickets.list()
      setTickets(response.results || [])
    } catch (err) {
      console.error('Error fetching tickets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const ticket = await apiService.support.tickets.get(ticketId)
      setSelectedTicket(ticket)
      // Update the ticket in the list
      setTickets(prevTickets =>
        prevTickets.map(t => t.id === ticketId ? ticket : t)
      )
    } catch (err) {
      console.error('Error fetching ticket details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load ticket details')
    }
  }

  const categories = [
    { value: 'Technical', label: t('pages.support.categoryTechnical') },
    { value: 'Payment', label: t('pages.support.categoryPayment') },
    { value: 'Account', label: t('pages.support.categoryAccount') },
    { value: 'Billing', label: t('pages.support.categoryBilling') },
    { value: 'Feature Request', label: t('pages.support.categoryFeatureRequest') },
    { value: 'Other', label: t('pages.support.categoryOther') }
  ]
  const priorities = [
    { value: 'low', label: t('pages.support.priorityLow'), color: 'text-green-400' },
    { value: 'medium', label: t('pages.support.priorityMedium'), color: 'text-yellow-400' },
    { value: 'high', label: t('pages.support.priorityHigh'), color: 'text-orange-400' },
    { value: 'urgent', label: t('pages.support.priorityUrgent'), color: 'text-red-400' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-400'
      case 'in_progress': return 'text-yellow-400'
      case 'resolved': return 'text-green-400'
      case 'closed': return 'text-gray-400'
      default: return 'text-slate-400'
    }
  }

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate files
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })
    
    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Please ensure all files are images under 10MB.')
    }
    
    // Store files for upload
    setUploadedFiles(prev => [...prev, ...validFiles])
    
    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setPreviewImages(prev => [...prev, ...newPreviews])
    
    // Save to localStorage for persistence
    const storedImages = JSON.parse(localStorage.getItem('support_ticket_images') || '[]')
    const newStoredImages = [...storedImages, ...validFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }))]
    localStorage.setItem('support_ticket_images', JSON.stringify(newStoredImages))
  }

  // Remove photo
  const removePhoto = (index: number) => {
    // Remove from uploaded files
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    
    // Remove from preview images
    setPreviewImages(prev => {
      const newPreviews = prev.filter((_, i) => i !== index)
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index])
      return newPreviews
    })
    
    // Update localStorage
    const storedImages = JSON.parse(localStorage.getItem('support_ticket_images') || '[]')
    const updatedStoredImages = storedImages.filter((_: any, i: number) => i !== index)
    localStorage.setItem('support_ticket_images', JSON.stringify(updatedStoredImages))
  }

  const handleCreateTicket = async () => {
    // Check if user is logged in
    if (!state.auth.isLoggedIn || !state.auth.user) {
      // Store redirect URL and navigate to login
      dispatch({ type: 'set_redirect_url', url: '/support' })
      navigate('/login')
      return
    }

    try {
      setCreatingTicket(true)
      setError(null)
      
      const createdTicket = await apiService.support.tickets.create({
        title: newTicket.title,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority
      })

      // Save images to localStorage with ticket ID
      if (uploadedFiles.length > 0) {
        const storedImages = JSON.parse(localStorage.getItem('support_ticket_images') || '[]')
        localStorage.setItem(`support_${createdTicket.id}_images`, JSON.stringify(storedImages))
        // Clear the temporary storage
        localStorage.removeItem('support_ticket_images')
      }

      // Add new ticket to the tickets array
      setTickets(prevTickets => [createdTicket, ...prevTickets])
      
      // Reset form and switch to tickets tab
      setNewTicket({ title: '', description: '', category: '', priority: 'medium' })
      setUploadedFiles([])
      setPreviewImages(prev => {
        prev.forEach(url => URL.revokeObjectURL(url))
        return []
      })
      setActiveTab('tickets')
    } catch (err) {
      console.error('Error creating ticket:', err)
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setCreatingTicket(false)
    }
  }

  const handleAddComment = async (ticketId: string) => {
    if (!newComment.trim()) return

    try {
      setAddingComment(true)
      setError(null)
      
      const comment = await apiService.support.tickets.addComment(ticketId, newComment.trim())
      
      // Update tickets list with new comment
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { 
                ...ticket, 
                comments: [...(ticket.comments || []), comment],
                comment_count: (ticket.comment_count || 0) + 1
              }
            : ticket
        )
      )

      // Update selected ticket if it's the same one
      if (selectedTicket && selectedTicket.id === ticketId) {
        const updatedTicket = await apiService.support.tickets.get(ticketId)
        setSelectedTicket(updatedTicket)
      }

      setNewComment('')
    } catch (err) {
      console.error('Error adding comment:', err)
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    } finally {
      setAddingComment(false)
    }
  }

  const handleViewDetails = async (ticket: SupportTicket) => {
    // Fetch full ticket details with comments
    await fetchTicketDetails(ticket.id)
    setShowTicketDetails(true)
  }

  const formatDateLocal = (dateString: string) => {
    return formatDate(dateString, language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallbackPath="/" />
          <h1 className="text-responsive-xl font-bold">{t('pages.support.title')}</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card p-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-2 px-4 rounded-lg text-responsive-sm font-medium transition-all ${
              activeTab === 'contact'
                ? 'bg-purple-500 text-white'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            {t('pages.support.contactUs')}
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-2 px-4 rounded-lg text-responsive-sm font-medium transition-all ${
              activeTab === 'tickets'
                ? 'bg-purple-500 text-white'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            {t('pages.support.myTickets')}
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-lg text-responsive-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-purple-500 text-white'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            {t('pages.support.createTicket')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="glass-card p-6">
            <h2 className="text-responsive-lg font-semibold mb-4">{t('pages.support.contactInformation')}</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-lg">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📞</span>
                </div>
                <div>
                  <h3 className="text-responsive-sm font-semibold text-slate-200">{t('pages.support.phoneSupport')}</h3>
                  <p className="text-responsive-sm text-slate-400">{isRTL ? '989301255415+' : '+989301255415'}</p>
                  <p className="text-responsive-xs text-slate-500">{t('pages.support.phoneHours')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-lg">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <h3 className="text-responsive-sm font-semibold text-slate-200">{t('pages.support.emailSupport')}</h3>
                  <p className="text-responsive-sm text-slate-400">shayanazadi967@gmail.com</p>
                  <p className="text-responsive-xs text-slate-500">{t('pages.support.emailResponse')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-lg">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-responsive-sm font-semibold text-slate-200">{t('pages.support.liveChat')}</h3>
                  <p className="text-responsive-sm text-slate-400">{t('pages.support.liveChatAvailable')}</p>
                  <button className="btn-primary text-responsive-xs mt-2">
                    {t('pages.support.startChat')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Buttons */}
          <div className="glass-card p-6">
            <h2 className="text-responsive-lg font-semibold mb-4">اطلاعات بیشتر</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-lg hover:bg-slate-700/40 transition-colors text-right"
                onClick={() => {
                  // TODO: Add link to About Us page
                  console.log('About Us clicked')
                }}
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">ℹ️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-responsive-sm font-semibold text-slate-200">{t('pages.support.aboutUs')}</h3>
                  <p className="text-responsive-xs text-slate-400">درباره تیم و خدمات ما</p>
                </div>
              </button>

              <button 
                className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-lg hover:bg-slate-700/40 transition-colors text-right"
                onClick={() => {
                  // TODO: Add link to Terms and Conditions page
                  console.log('Terms and Conditions clicked')
                }}
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-responsive-sm font-semibold text-slate-200">{t('pages.support.termsAndConditions')}</h3>
                  <p className="text-responsive-xs text-slate-400">قوانین و مقررات استفاده</p>
                </div>
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div className="glass-card p-6">
            <h2 className="text-responsive-lg font-semibold mb-4">{t('pages.support.faq')}</h2>
            <div className="space-y-3">
              <div className="p-4 bg-slate-800/40 rounded-lg">
                <h3 className="text-responsive-sm font-semibold text-slate-200 mb-2">
                  {t('pages.support.faq1.question')}
                </h3>
                <p className="text-responsive-sm text-slate-400">
                  {t('pages.support.faq1.answer')}
                </p>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-lg">
                <h3 className="text-responsive-sm font-semibold text-slate-200 mb-2">
                  {t('pages.support.faq2.question')}
                </h3>
                <p className="text-responsive-sm text-slate-400">
                  {t('pages.support.faq2.answer')}
                </p>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-lg">
                <h3 className="text-responsive-sm font-semibold text-slate-200 mb-2">
                  {t('pages.support.faq3.question')}
                </h3>
                <p className="text-responsive-sm text-slate-400">
                  {t('pages.support.faq3.answer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {error && (
            <div className="glass-card p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="glass-card p-8 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-400">{t('common.loading') || 'Loading...'}</p>
            </div>
          ) : tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div key={ticket.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-responsive-sm font-semibold text-slate-200 mb-1">
                      {ticket.title}
                    </h3>
                    <p className="text-responsive-sm text-slate-400 mb-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 text-responsive-xs text-slate-500">
                      <span>📁 {categories.find(cat => cat.value === ticket.category)?.label || ticket.category}</span>
                      <span>📅 {formatDateLocal(ticket.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`chip text-xs ${getStatusColor(ticket.status)}`}>
                      {t(`pages.support.status${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}`)}
                    </span>
                    <span className={`text-xs ${priorities.find(p => p.value === ticket.priority)?.color}`}>
                      {priorities.find(p => p.value === ticket.priority)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewDetails(ticket)}
                    className="btn-ghost text-responsive-xs"
                  >
                    {t('pages.support.viewDetails')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-8 text-center">
              <div className="text-4xl mb-4">🎫</div>
              <h3 className="text-responsive-sm font-semibold text-slate-200 mb-2">
                {t('pages.support.noTickets')}
              </h3>
              <p className="text-responsive-sm text-slate-400 mb-4">
                {t('pages.support.noTicketsDescription')}
              </p>
              <button 
                onClick={() => {
                  if (!state.auth.isLoggedIn || !state.auth.user) {
                    dispatch({ type: 'set_redirect_url', url: '/support' })
                    navigate('/login')
                  } else {
                    setActiveTab('create')
                  }
                }}
                className="btn-primary"
              >
                {t('pages.support.createFirstTicket')}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 flex items-center justify-center">
              <span className="text-white text-lg">🎫</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gradient">{t('pages.support.createNewTicket')}</h2>
              <p className="text-sm text-slate-400">{t('pages.support.fillFormToCreateTicket')}</p>
            </div>
          </div>

          {!state.auth.isLoggedIn || !state.auth.user ? (
            <div className="space-y-6">
              <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">
                      {t('common.signInRequired') || 'Login Required'}
                    </h3>
                    <button
                      onClick={() => {
                        dispatch({ type: 'set_redirect_url', url: '/support' })
                        navigate('/login')
                      }}
                      className="btn-primary"
                    >
                      <span className="mr-2">🔑</span>
                      {t('common.login') || 'Login'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreateTicket(); }}>
            {/* Title Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">1</span>
                {t('pages.support.ticketTitle')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/40 border border-slate-600 rounded-xl text-slate-100 focus:border-purple-500 focus:outline-none transition-colors placeholder-slate-400"
                placeholder={t('pages.support.ticketTitlePlaceholder')}
                required
              />
            </div>

            {/* Category and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-xs">2</span>
                  {t('pages.support.category')} <span className="text-red-400">*</span>
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/40 border border-slate-600 rounded-xl text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                  required
                >
                  <option value="">{t('pages.support.selectCategory')}</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs">3</span>
                  {t('pages.support.priority')}
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-slate-800/40 border border-slate-600 rounded-xl text-slate-100 focus:border-purple-500 focus:outline-none transition-colors"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">4</span>
                {t('pages.support.description')} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/40 border border-slate-600 rounded-xl text-slate-100 focus:border-purple-500 focus:outline-none transition-colors resize-none h-32 placeholder-slate-400"
                placeholder={t('pages.support.descriptionPlaceholder')}
                required
              />
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{t('pages.support.descriptionHelper')}</span>
                <span>{newTicket.description.length}/500</span>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-xs">5</span>
                {t('pages.support.uploadPhoto') || 'Upload Photo'} <span className="text-slate-500 text-xs">(Optional)</span>
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="support-photo-upload"
                />
                <label
                  htmlFor="support-photo-upload"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-slate-800/20"
                >
                  <span className="text-2xl">📷</span>
                  <span className="text-sm text-slate-400">
                    {t('pages.support.clickToUpload') || 'Click to upload photos'}
                  </span>
                </label>
                
                {/* Preview Images */}
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setActiveTab('tickets')}
                className="btn-ghost flex-1 sm:flex-none sm:px-8 py-3"
              >
                <span className="mr-2">❌</span>
                {t('common.cancel')}
              </button>
              <button 
                type="submit"
                className="btn-primary flex-1 sm:flex-none sm:px-8 py-3"
                disabled={!newTicket.title || !newTicket.category || !newTicket.description || creatingTicket}
              >
                <span className="mr-2">🚀</span>
                {creatingTicket ? (t('common.loading') || 'Creating...') : t('pages.support.createTicket')}
              </button>
            </div>
          </form>
          )}
        </div>
      )}

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-slate-200">
                {t('pages.support.ticketDetails')}
              </h2>
              <button
                onClick={() => {
                  setShowTicketDetails(false)
                  setSelectedTicket(null)
                  setNewComment('')
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Ticket Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">
                    {selectedTicket.title}
                  </h3>
                  <p className="text-slate-400">{selectedTicket.description}</p>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">📁</span>
                    <span className="text-slate-300">{categories.find(cat => cat.value === selectedTicket.category)?.label || selectedTicket.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">📅</span>
                    <span className="text-slate-300">{formatDateLocal(selectedTicket.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`chip text-xs ${getStatusColor(selectedTicket.status)}`}>
                      {t(`pages.support.status${selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${priorities.find(p => p.value === selectedTicket.priority)?.color}`}>
                      {priorities.find(p => p.value === selectedTicket.priority)?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-200">
                  {t('pages.support.comments')} ({selectedTicket.comments?.length || 0})
                </h4>
                
                {/* Existing Comments */}
                <div className="space-y-3">
                  {selectedTicket.comments?.map((comment) => (
                    <div key={comment.id} className={`p-4 rounded-lg ${
                      comment.is_admin 
                        ? 'bg-blue-500/10 border-l-4 border-blue-500' 
                        : 'bg-orange-500/10 border-l-4 border-orange-500'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-medium ${
                          comment.is_admin ? 'text-blue-400' : 'text-orange-400'
                        }`}>
                          {comment.is_admin ? t('pages.support.supportTeam') : comment.author_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDateLocal(comment.created_at)}
                        </span>
                        {comment.is_admin ? (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            {t('pages.support.supportTeam')}
                          </span>
                        ) : (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                            {t('pages.support.messageToSupport')}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm">{comment.content}</p>
                    </div>
                  ))}
                  
                  {(!selectedTicket.comments || selectedTicket.comments.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      <span className="text-4xl mb-2 block">💬</span>
                      <p>{t('pages.support.noCommentsYet')}</p>
                    </div>
                  )}
                </div>

                {/* Add Comment Form */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-slate-300">
                    {t('pages.support.sendMessageToSupport')}
                  </h5>
                  {selectedTicket.status === 'closed' ? (
                    <div className="px-4 py-3 bg-slate-800/40 border border-slate-600 rounded-xl text-slate-400 text-sm">
                      {t('pages.support.ticketClosedNoComments') || 'This ticket is closed. You cannot add comments anymore.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('pages.support.commentPlaceholder')}
                        className="w-full px-4 py-3 bg-slate-800/40 border border-slate-600 rounded-xl text-slate-100 focus:border-purple-500 focus:outline-none transition-colors resize-none h-24 placeholder-slate-400"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setNewComment('')}
                          className="btn-ghost text-sm px-4 py-2"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={() => handleAddComment(selectedTicket.id)}
                          disabled={!newComment.trim() || addingComment}
                          className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingComment ? (t('common.loading') || 'Sending...') : t('pages.support.sendMessage')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
