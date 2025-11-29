'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Vendor, Transaction } from '@/lib/database.types'

interface Props {
  params: Promise<{ token: string }>
}

export default function VendorPublicView({ params }: Props) {
  const resolvedParams = use(params)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchVendor = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('vendors')
      .select('*')
      .eq('share_token', resolvedParams.token)
      .single()

    if (fetchError || !data) {
      setError('Vendor not found')
      setLoading(false)
      return
    }

    setVendor(data)
  }, [resolvedParams.token])

  const fetchTransactions = useCallback(async () => {
    if (!vendor) return

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (data) setTransactions(data)
  }, [vendor])

  useEffect(() => {
    fetchVendor()
  }, [fetchVendor])

  useEffect(() => {
    if (vendor) {
      fetchTransactions()
      setLoading(false)

      // Subscribe to realtime updates for this vendor's transactions
      const channel = supabase
        .channel(`vendor-${vendor.id}-transactions`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `vendor_id=eq.${vendor.id}`
          },
          () => {
            fetchTransactions()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [vendor, fetchTransactions])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const cardTotal = transactions
    .filter(t => t.payment_method === 'card')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const cashTotal = transactions
    .filter(t => t.payment_method === 'cash')
    .reduce((sum, t) => sum + Number(t.amount), 0)

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

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">{error || 'Vendor not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/wam-logo.svg"
              alt="Wam Logo"
              width={36}
              height={36}
              className="object-contain"
            />
            <div>
              <p className="text-xs text-gray-500">Powered by Wam</p>
              <h1 className="text-xl font-bold text-gray-800">{vendor.name}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Live Indicator */}
      <div className="bg-green-500 text-white text-center py-1.5 text-sm">
        <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
        Live Updates Enabled
      </div>

      {/* Stats Cards */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
            <p className="text-green-100 text-sm">Total Collected</p>
            <p className="text-4xl font-bold">${totalAmount.toFixed(2)}</p>
            <p className="text-green-100 text-sm mt-1">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
            <p className="text-blue-100 text-sm">Card Payments</p>
            <p className="text-3xl font-bold">${cardTotal.toFixed(2)}</p>
            <p className="text-blue-100 text-sm mt-1">
              {transactions.filter(t => t.payment_method === 'card').length} transaction{transactions.filter(t => t.payment_method === 'card').length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
            <p className="text-emerald-100 text-sm">Cash Payments</p>
            <p className="text-3xl font-bold">${cashTotal.toFixed(2)}</p>
            <p className="text-emerald-100 text-sm mt-1">
              {transactions.filter(t => t.payment_method === 'cash').length} transaction{transactions.filter(t => t.payment_method === 'cash').length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Recent Payments</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payments yet</p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-green-600">
                        ${Number(transaction.amount).toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        transaction.payment_method === 'card'
                          ? 'bg-blue-100 text-blue-700'
                          : transaction.payment_method === 'cash'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {transaction.payment_method}
                      </span>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{transaction.description}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{formatDate(transaction.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm py-4">
          This page updates automatically when new payments are recorded.
        </div>
      </main>
    </div>
  )
}
