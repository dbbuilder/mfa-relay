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
  const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'outlook' | 'imap' | null>(null)
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

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        setError(`Failed to add email account: ${insertError.message}`)
        return
      }

      onEmailAdded()
      onClose()

      // Reset form
      setSelectedProvider(null)
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
    } catch (err) {
      console.error('Error adding email account:', err)
      setError('Failed to add email account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProviderSelect = (provider: 'gmail' | 'outlook' | 'imap') => {
    setSelectedProvider(provider)
    setFormData(prev => {
      const updates: any = { provider }

      // Set default IMAP settings and placeholders based on provider
      if (provider === 'gmail') {
        updates.imap_host = 'imap.gmail.com'
        updates.imap_port = 993
        updates.use_ssl = true
        updates.name = ''
        updates.email_address = ''
      } else if (provider === 'outlook') {
        updates.imap_host = 'outlook.office365.com'
        updates.imap_port = 993
        updates.use_ssl = true
        updates.name = ''
        updates.email_address = ''
      } else {
        updates.imap_host = ''
        updates.imap_port = 993
        updates.use_ssl = true
      }

      return { ...prev, ...updates }
    })
  }

  const handleOAuthSignIn = async (provider: 'google' | 'microsoft') => {
    try {
      setLoading(true)
      setError('')

      // Use standard OAuth flow - this will create a connected account
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === 'google'
            ? 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
            : 'https://graph.microsoft.com/mail.read'
        }
      })

      if (error) {
        setError(`OAuth sign-in failed: ${error.message}`)
      }
      // Note: The page will redirect to OAuth, so we don't need to handle success here

    } catch (err) {
      console.error('OAuth error:', err)
      setError('Failed to initiate OAuth sign-in')
    } finally {
      setLoading(false)
    }
  }

  const getPlaceholderText = (field: string) => {
    if (!selectedProvider) return ''

    switch (field) {
      case 'name':
        return selectedProvider === 'gmail' ? 'My Gmail Account'
             : selectedProvider === 'outlook' ? 'My Outlook Account'
             : 'My Custom Email Account'
      case 'email':
        return selectedProvider === 'gmail' ? 'your.email@gmail.com'
             : selectedProvider === 'outlook' ? 'your.email@outlook.com'
             : 'your.email@domain.com'
      case 'password':
        return selectedProvider === 'gmail' ? 'Gmail App Password (16 characters)'
             : selectedProvider === 'outlook' ? 'Outlook App Password'
             : 'Email Password'
      case 'host':
        return 'imap.domain.com'
      default:
        return ''
    }
  }

  const handleClose = () => {
    setSelectedProvider(null)
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
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add Email Account</h2>
          <button
            onClick={handleClose}
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

          {/* Step 1: Provider Selection */}
          {!selectedProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Your Email Provider
              </label>
              <div className="space-y-3">
                {/* Gmail Option */}
                <button
                  type="button"
                  onClick={() => handleProviderSelect('gmail')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-red-500" />
                    <div>
                      <div className="font-medium text-gray-900">Gmail</div>
                      <div className="text-sm text-gray-500">Connect with OAuth or App Password</div>
                    </div>
                  </div>
                </button>

                {/* Outlook Option */}
                <button
                  type="button"
                  onClick={() => handleProviderSelect('outlook')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-900">Outlook</div>
                      <div className="text-sm text-gray-500">Connect with OAuth or App Password</div>
                    </div>
                  </div>
                </button>

                {/* Custom IMAP Option */}
                <button
                  type="button"
                  onClick={() => handleProviderSelect('imap')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">Custom IMAP</div>
                      <div className="text-sm text-gray-500">Any email provider with IMAP access</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Connection Method (for Gmail/Outlook) */}
          {selectedProvider && (selectedProvider === 'gmail' || selectedProvider === 'outlook') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 capitalize">{selectedProvider} Setup</h3>
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {/* OAuth Option */}
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-900">Recommended: OAuth Connection</div>
                      <div className="text-sm text-green-700">Secure, creates a connected account</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOAuthSignIn(selectedProvider === 'gmail' ? 'google' : 'microsoft')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? 'Connecting...' : `Connect ${selectedProvider === 'gmail' ? 'Google' : 'Microsoft'}`}
                    </button>
                  </div>
                </div>

                {/* App Password Option */}
                <div className="text-center text-gray-500 text-sm">
                  Or add as email account with App Password
                </div>
              </div>

              {/* App Password Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={getPlaceholderText('name')}
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
                    placeholder={getPlaceholderText('email')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    App Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.app_password}
                      onChange={(e) => setFormData(prev => ({ ...prev, app_password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={getPlaceholderText('password')}
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
                    Generate an app-specific password in your {selectedProvider === 'gmail' ? 'Google' : 'Microsoft'} account settings
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: IMAP Configuration (for custom IMAP) */}
          {selectedProvider === 'imap' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Custom IMAP Setup</h3>
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={getPlaceholderText('name')}
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
                    placeholder={getPlaceholderText('email')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.app_password}
                      onChange={(e) => setFormData(prev => ({ ...prev, app_password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={getPlaceholderText('password')}
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMAP Host
                  </label>
                  <input
                    type="text"
                    value={formData.imap_host}
                    onChange={(e) => setFormData(prev => ({ ...prev, imap_host: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={getPlaceholderText('host')}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div className="flex items-center pt-6">
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
                </div>
              </div>
            </div>
          )}

          {/* Submit Button (only show when provider is selected) */}
          {selectedProvider && (
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}