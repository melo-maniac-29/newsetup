'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../react-native-app/convex/_generated/api'
import { Id } from '../../../react-native-app/convex/_generated/dataModel'
import { 
  X, 
  DollarSign, 
  MapPin, 
  FileText,
  AlertTriangle,
  Save,
  Loader
} from 'lucide-react'

interface NewCrowdfundingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function NewCrowdfundingModal({ isOpen, onClose, onSuccess }: NewCrowdfundingModalProps) {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target: '',
    state: '',
    district: '',
    address: '',
    relatedSOSIds: [] as Id<"sosRequests">[],
    relatedHazardIds: [] as Id<"hazards">[]
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch data for dropdowns
  const allSOSRequests = useQuery(api.sos.getAllSOSRequests)
  const allHazards = useQuery(api.hazards.getHazards)
  const allUsers = useQuery(api.users.getAllUsers)

  // Get admin and rescuer users
  const adminUsers = allUsers?.filter(user => user.role === 'admin') || []
  const rescuerUsers = allUsers?.filter(user => user.role === 'rescuer') || []
  const authorizedUsers = [...adminUsers, ...rescuerUsers]
  
  // Use first authorized user (admin or rescuer)
  const currentUserId = authorizedUsers[0]?._id

  // Create campaign mutation
  const createCampaign = useMutation(api.crowdfunding.createCampaign)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        target: '',
        state: '',
        district: '',
        address: '',
        relatedSOSIds: [],
        relatedHazardIds: []
      })
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required'
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters'
    }

    const targetAmount = parseFloat(formData.target)
    if (!formData.target || isNaN(targetAmount) || targetAmount < 1000) {
      newErrors.target = 'Target amount must be at least ₹1,000'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!currentUserId) {
      setErrors({ submit: 'No admin or rescuer users found in database. Please run "Seed Database" first to create authorized users.' })
      return
    }

    setIsSubmitting(true)

    try {
      const targetLocation = {
        state: formData.state,
        district: formData.district || undefined,
        address: formData.address || undefined
      }

      await createCampaign({
        title: formData.title,
        description: formData.description,
        target: parseFloat(formData.target),
        createdBy: currentUserId,
        targetLocation,
        relatedSOSIds: formData.relatedSOSIds.length > 0 ? formData.relatedSOSIds : undefined,
        relatedHazardIds: formData.relatedHazardIds.length > 0 ? formData.relatedHazardIds : undefined,
      })

      // Success
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create campaign:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create campaign' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '₹0'
    return `₹${num.toLocaleString('en-IN')}`
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Create New Crowdfunding Campaign</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {errors.submit}
            </div>
          )}

          {/* Info about authorized users */}
          {authorizedUsers.length === 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Authorization Required</h3>
                  <p className="text-sm mt-1">
                    No admin or rescuer users found. Only authorized users can create campaigns.
                  </p>
                  <p className="text-sm mt-2 font-medium">
                    🚀 Go to the "Overview" tab and click "Seed Database" to create admin and rescuer users.
                  </p>
                </div>
              </div>
            </div>
          )}

          {authorizedUsers.length > 0 && adminUsers.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
              <p className="text-sm">
                <strong>Note:</strong> Using rescuer user for campaign creation. Consider running seed data to create admin users.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Campaign Details
                </h3>

                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Emergency Relief Fund for Flood Victims"
                    maxLength={100}
                  />
                  {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Detailed description of the campaign purpose, how funds will be used, and impact expected..."
                    maxLength={1000}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{errors.description && <span className="text-red-600">{errors.description}</span>}</span>
                    <span>{formData.description.length}/1000</span>
                  </div>
                </div>

                {/* Target Amount */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Target Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.target}
                    onChange={(e) => handleInputChange('target', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                      errors.target ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 500000"
                    min="1000"
                    step="100"
                  />
                  {formData.target && (
                    <p className="text-sm text-green-600 font-medium">
                      Target: {formatCurrency(formData.target)}
                    </p>
                  )}
                  {errors.target && <p className="text-sm text-red-600">{errors.target}</p>}
                </div>
              </div>
            </div>

            {/* Right Column - Location */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-red-600" />
                  Target Location
                </h3>

                <div className="space-y-4">
                  {/* State */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                        errors.state ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Maharashtra, Kerala, Tamil Nadu"
                    />
                    {errors.state && <p className="text-sm text-red-600">{errors.state}</p>}
                  </div>

                  {/* District */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      District (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="e.g., Mumbai, Kochi, Chennai"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Specific Address (Optional)
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Specific area, landmark, or address details"
                      maxLength={200}
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Campaign Summary</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Title:</strong> {formData.title || 'Not specified'}</p>
                  <p><strong>Target:</strong> {formData.target ? formatCurrency(formData.target) : 'Not specified'}</p>
                  <p><strong>Location:</strong> {formData.state || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Creating Campaign...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}