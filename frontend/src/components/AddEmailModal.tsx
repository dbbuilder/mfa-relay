'use client'

import { useState } from 'react'
import { X, Mail, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface AddEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onEmailAdded: () => void
}

export default function AddEmailModal({ isOpen, onClose, onEmailAdded }: AddEmailModalProps) {
  console.log('AddEmailModal render - isOpen:', isOpen)
  const { user, projectId } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email_address: '',
    provider: 'gmail' as 'gmail' | 'outlook' | 'imap',
    app_password: '',
    imap_host: '',
    imap_port: 993,
    use_ssl: true,
    folder_name: 'INBOX',
    check_interval_seconds: 30
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !projectId) return

    setLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('mfa_email_accounts')
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: formData.name,
          email_address: formData.email_address,
          provider: formData.provider,
          app_password_encrypted: formData.app_password, // Note: In production, this should be encrypted
          imap_host: formData.provider === 'imap' ? formData.imap_host : undefined,
          imap_port: formData.provider === 'imap' ? formData.imap_port : undefined,
          use_ssl: formData.use_ssl,
          folder_name: formData.folder_name,
          is_active: true,
          check_interval_seconds: formData.check_interval_seconds
        })

      if (insertError) throw insertError

      // Reset form
      setFormData({
        name: '',
        email_address: '',
        provider: 'gmail',
        app_password: '',
        imap_host: '',
        imap_port: 993,
        use_ssl: true,
        folder_name: 'INBOX',
        check_interval_seconds: 30
      })

      onEmailAdded()
      onClose()
    } catch (err) {
      console.error('Error adding email account:', err)
      setError('Failed to add email account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProviderChange = (provider: 'gmail' | 'outlook' | 'imap') => {
    setFormData(prev => {
      const updates: any = { provider }

      // Set default IMAP settings based on provider
      if (provider === 'gmail') {
        updates.imap_host = 'imap.gmail.com'
        updates.imap_port = 993
        updates.use_ssl = true
      } else if (provider === 'outlook') {
        updates.imap_host = 'outlook.office365.com'
        updates.imap_port = 993
        updates.use_ssl = true
      }

      return { ...prev, ...updates }
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add Email Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="My Gmail Account"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email_address}
              onChange={(e) => setFormData(prev => ({ ...prev, email_address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your.email@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => handleProviderChange(e.target.value as 'gmail' | 'outlook' | 'imap')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook/Office 365</option>
              <option value="imap">Custom IMAP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              App Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.app_password}
                onChange={(e) => setFormData(prev => ({ ...prev, app_password: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your app-specific password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.provider === 'gmail' && 'Generate an app password in your Google Account settings'}
              {formData.provider === 'outlook' && 'Generate an app password in your Microsoft Account settings'}
              {formData.provider === 'imap' && 'Use your email password or app-specific password'}
            </p>
          </div>

          {formData.provider === 'imap' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMAP Host
                </label>
                <input
                  type="text"
                  value={formData.imap_host}
                  onChange={(e) => setFormData(prev => ({ ...prev, imap_host: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="mail.your-provider.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMAP Port
                </label>
                <input
                  type="number"
                  value={formData.imap_port}
                  onChange={(e) => setFormData(prev => ({ ...prev, imap_port: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="993"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Folder Name
            </label>
            <input
              type="text"
              value={formData.folder_name}
              onChange={(e) => setFormData(prev => ({ ...prev, folder_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="INBOX"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check Interval (seconds)
            </label>
            <input
              type="number"
              value={formData.check_interval_seconds}
              onChange={(e) => setFormData(prev => ({ ...prev, check_interval_seconds: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="10"
              max="300"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              How often to check for new emails (10-300 seconds)
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="use_ssl"
              checked={formData.use_ssl}
              onChange={(e) => setFormData(prev => ({ ...prev, use_ssl: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="use_ssl" className="ml-2 block text-sm text-gray-700">
              Use SSL/TLS
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}