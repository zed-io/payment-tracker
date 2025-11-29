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
import { CreditCardIcon, StoreIcon, ListIcon, ChartIcon, RefreshIcon } from '@/components/Icons'

type Tab = 'payment' | 'vendors' | 'transactions' | 'summary'

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('payment')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchAll()

    // Subscribe to realtime updates for vendors
    const vendorsChannel = supabase
      .channel('vendors-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'vendors'
      }, () => {
        fetchVendors()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'vendors'
      }, () => {
        fetchVendors()
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'vendors'
      }, () => {
        fetchVendors()
      })
      .subscribe()

    // Subscribe to realtime updates for transactions
    const transactionsChannel = supabase
      .channel('transactions-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions'
      }, () => {
        fetchTransactions()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'transactions'
      }, () => {
        fetchTransactions()
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'transactions'
      }, () => {
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
    { id: 'payment' as Tab, label: 'Payment', icon: CreditCardIcon },
    { id: 'vendors' as Tab, label: 'Vendors', icon: StoreIcon },
    { id: 'transactions' as Tab, label: 'History', icon: ListIcon },
    { id: 'summary' as Tab, label: 'Summary', icon: ChartIcon },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#B34AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="glass sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/wam-logo.svg"
              alt="Wam Logo"
              width={44}
              height={44}
              className="object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Payment Tracker</h1>
              <p className="text-xs text-gray-500">Market POS System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 btn-secondary rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh data"
            >
              <RefreshIcon className="w-5 h-5" />
            </button>
            <div className="text-right glass-card px-4 py-2">
              <p className="text-xs text-gray-500">Today&apos;s Total</p>
              <p className="text-xl font-bold font-number text-gradient-green">
                ${transactions.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Success Toast */}
      {lastPayment && (
        <div className="fixed top-24 right-4 glass-card px-5 py-3 z-50 border-l-4 border-[#43FF52]">
          <p className="font-medium text-foreground">Payment recorded!</p>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'payment' && (
          <div className="space-y-6">
            {vendors.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <StoreIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 mb-4">No vendors yet. Add a vendor to start recording payments.</p>
                <button
                  onClick={() => setActiveTab('vendors')}
                  className="btn-primary px-6 py-3"
                >
                  Add First Vendor
                </button>
              </div>
            ) : (
              <div className="glass-card p-5 space-y-5">
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
                  <div className="text-center py-10 text-gray-400">
                    <CreditCardIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    Select a vendor above to record a payment
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats for selected vendor */}
            {selectedVendor && (
              <div className="glass-card p-5 bg-gradient-to-br from-[#B34AFF]/10 to-[#43FF52]/10">
                <h3 className="font-semibold text-foreground mb-3">{selectedVendor.name} Today</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-4">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-3xl font-bold font-number text-gradient-green">
                      ${transactions
                        .filter(t => t.vendor_id === selectedVendor.id)
                        .reduce((sum, t) => sum + Number(t.amount), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-sm text-gray-500">Transactions</p>
                    <p className="text-3xl font-bold font-number text-gradient-purple">
                      {transactions.filter(t => t.vendor_id === selectedVendor.id).length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="glass-card p-5">
            <VendorManager
              vendors={vendors}
              onVendorsChange={fetchVendors}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="glass-card p-5">
            <div className="mb-4">
              <VendorSelect
                vendors={vendors}
                selectedVendor={selectedVendor}
                onSelect={setSelectedVendor}
              />
              {selectedVendor && (
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="mt-2 text-sm text-[#B34AFF] hover:underline"
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

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass z-40">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-around py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-[#B34AFF]/20 text-[#B34AFF]'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
