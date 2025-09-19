'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { supabase, MFAEmailAccount, MFACodeLog } from '@/lib/supabase'
import { Shield, Mail, Plus, Settings, LogOut, Activity, Smartphone } from 'lucide-react'

export default function DashboardPage() {
  const { user, projectId, signOut } = useAuth()
  const [emailAccounts, setEmailAccounts] = useState<MFAEmailAccount[]>([])
  const [recentCodes, setRecentCodes] = useState<MFACodeLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && projectId) {
      fetchData()
    }
  }, [user, projectId])

  const fetchData = async () => {
    if (!projectId) return

    try {
      // Fetch email accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('mfa_email_accounts')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (accountsError) throw accountsError
      setEmailAccounts(accounts || [])

      // Fetch recent codes
      const { data: codes, error: codesError } = await supabase
        .from('mfa_codes_log')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (codesError) throw codesError
      setRecentCodes(codes || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">MFA Relay</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage your MFA code forwarding settings</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your data...</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Email Accounts */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-2" />
                        <h2 className="text-lg font-medium text-gray-900">Email Accounts</h2>
                      </div>
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Email
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {emailAccounts.length === 0 ? (
                      <div className="text-center py-8">
                        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No email accounts</h3>
                        <p className="text-gray-600 mb-4">
                          Add your first email account to start forwarding MFA codes
                        </p>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium">
                          Add Email Account
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {emailAccounts.map((account) => (
                          <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">{account.name}</h3>
                                <p className="text-sm text-gray-500">{account.email_address}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Provider: {account.provider} •
                                  Status: {account.is_active ? 'Active' : 'Inactive'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button className="text-gray-400 hover:text-gray-600">
                                  <Settings className="h-4 w-4" />
                                </button>
                                <div className={`w-3 h-3 rounded-full ${
                                  account.is_active ? 'bg-green-400' : 'bg-red-400'
                                }`} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-400 mr-2" />
                      <h2 className="text-lg font-medium text-gray-900">Recent Codes</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    {recentCodes.length === 0 ? (
                      <div className="text-center py-8">
                        <Smartphone className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No codes processed yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentCodes.map((code) => (
                          <div key={code.id} className="border-l-4 border-indigo-400 pl-3">
                            <div className="font-mono text-sm font-medium text-gray-900">
                              {code.mfa_code}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {code.detected_service && (
                                <span className="mr-2">{code.detected_service}</span>
                              )}
                              <span className={`px-2 py-1 rounded text-xs ${
                                code.status === 'sent'
                                  ? 'bg-green-100 text-green-800'
                                  : code.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {code.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(code.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email Accounts</span>
                      <span className="text-sm font-medium text-gray-900">{emailAccounts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Codes This Month</span>
                      <span className="text-sm font-medium text-gray-900">{recentCodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="text-sm font-medium text-green-600">
                        {recentCodes.length > 0
                          ? Math.round((recentCodes.filter(c => c.status === 'sent').length / recentCodes.length) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}