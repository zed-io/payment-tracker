'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Vendor, Transaction } from '@/lib/database.types'
import VendorSelect from '@/components/VendorSelect'
import PaymentForm from '@/components/PaymentForm'
import VendorManager from '@/components/VendorManager'
import TransactionList from '@/components/TransactionList'
import DashboardSummary from '@/components/DashboardSummary'

type Tab = 'payment' | 'vendors' | 'transactions' | 'summary'

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('payment')
  const [loading, setLoading] = useState(true)
  const [lastPayment, setLastPayment] = useState<{ amount: number; vendor: string } | null>(null)

  const fetchVendors = useCallback(async () => {
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .order('name')
    if (data) setVendors(data)
  }, [])

  const fetchTransactions = useCallback(async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setTransactions(data)
  }, [])

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchVendors(), fetchTransactions()])
    setLoading(false)
  }, [fetchVendors, fetchTransactions])

  useEffect(() => {
    fetchAll()

    // Subscribe to realtime updates
    const vendorsChannel = supabase
      .channel('vendors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => {
        fetchVendors()
      })
      .subscribe()

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(vendorsChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [fetchAll, fetchVendors, fetchTransactions])

  const handlePaymentAdded = () => {
    if (selectedVendor) {
      setLastPayment({ amount: 0, vendor: selectedVendor.name })
      setTimeout(() => setLastPayment(null), 3000)
    }
    fetchTransactions()
  }

  const tabs = [
    { id: 'payment' as Tab, label: 'Record Payment', icon: '💳' },
    { id: 'vendors' as Tab, label: 'Vendors', icon: '🏪' },
    { id: 'transactions' as Tab, label: 'Transactions', icon: '📋' },
    { id: 'summary' as Tab, label: 'Summary', icon: '📊' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/wam-logo.svg"
              alt="Wam Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Payment Tracker</h1>
              <p className="text-xs text-gray-500">Market POS System</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Today&apos;s Total</p>
            <p className="text-lg font-bold text-green-600">
              ${transactions.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b sticky top-[68px] z-30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Success Toast */}
      {lastPayment && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          Payment recorded!
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'payment' && (
          <div className="space-y-6">
            {vendors.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border">
                <p className="text-gray-500 mb-4">No vendors yet. Add a vendor to start recording payments.</p>
                <button
                  onClick={() => setActiveTab('vendors')}
                  className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Add First Vendor
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
                <VendorSelect
                  vendors={vendors}
                  selectedVendor={selectedVendor}
                  onSelect={setSelectedVendor}
                />

                {selectedVendor ? (
                  <PaymentForm
                    vendor={selectedVendor}
                    onPaymentAdded={handlePaymentAdded}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a vendor above to record a payment
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats for selected vendor */}
            {selectedVendor && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-2">{selectedVendor.name} Today</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Total</p>
                    <p className="text-2xl font-bold text-blue-800">
                      ${transactions
                        .filter(t => t.vendor_id === selectedVendor.id)
                        .reduce((sum, t) => sum + Number(t.amount), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Transactions</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {transactions.filter(t => t.vendor_id === selectedVendor.id).length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <VendorManager
              vendors={vendors}
              onVendorsChange={fetchVendors}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="mb-4">
              <VendorSelect
                vendors={vendors}
                selectedVendor={selectedVendor}
                onSelect={setSelectedVendor}
              />
              {selectedVendor && (
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Show all vendors
                </button>
              )}
            </div>
            <TransactionList
              transactions={transactions}
              vendors={vendors}
              onTransactionsChange={fetchTransactions}
              selectedVendorId={selectedVendor?.id}
            />
          </div>
        )}

        {activeTab === 'summary' && (
          <DashboardSummary
            transactions={transactions}
            vendors={vendors}
          />
        )}
      </main>
    </div>
  )
}
