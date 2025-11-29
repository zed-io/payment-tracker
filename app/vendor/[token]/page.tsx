'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Vendor, Transaction, PaymentRequest } from '@/lib/database.types'
import { CreditCardIcon, CashIcon, DotsIcon, WifiIcon, ClockIcon, PlusIcon, TrashIcon } from '@/components/Icons'
import PaymentRequestForm from '@/components/PaymentRequestForm'

interface Props {
  params: Promise<{ token: string }>
}

export default function VendorPublicView({ params }: Props) {
  const resolvedParams = use(params)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)

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

  const fetchPaymentRequests = useCallback(async () => {
    if (!vendor) return

    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (data) setPaymentRequests(data)
  }, [vendor])

  useEffect(() => {
    fetchVendor()
  }, [fetchVendor])

  useEffect(() => {
    if (vendor) {
      fetchTransactions()
      fetchPaymentRequests()
      setLoading(false)

      const transactionsChannel = supabase
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

      const requestsChannel = supabase
        .channel(`vendor-${vendor.id}-requests`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payment_requests',
            filter: `vendor_id=eq.${vendor.id}`
          },
          () => {
            fetchPaymentRequests()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(transactionsChannel)
        supabase.removeChannel(requestsChannel)
      }
    }
  }, [vendor, fetchTransactions, fetchPaymentRequests])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Cancel this payment request?')) return

    await supabase
      .from('payment_requests')
      .delete()
      .eq('id', requestId)

    fetchPaymentRequests()
  }

  const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const cardTotal = transactions
    .filter(t => t.payment_method === 'card')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const cashTotal = transactions
    .filter(t => t.payment_method === 'cash')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const PaymentMethodIcon = ({ method }: { method: string }) => {
    switch (method) {
      case 'card': return <CreditCardIcon className="w-4 h-4" />
      case 'cash': return <CashIcon className="w-4 h-4" />
      default: return <DotsIcon className="w-4 h-4" />
    }
  }

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

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card p-8">
          <p className="text-red-500 text-xl">{error || 'Vendor not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="glass">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/wam-logo.svg"
              alt="Wam Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <p className="text-xs text-gray-500">Powered by Wam</p>
              <h1 className="text-xl font-bold text-foreground">{vendor.name}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Live Indicator */}
      <div className="bg-gradient-to-r from-[#43FF52] to-[#38d946] text-white text-center py-2 text-sm font-medium">
        <span className="flex items-center justify-center gap-2">
          <WifiIcon className="w-4 h-4 animate-pulse" />
          Live Updates Enabled
        </span>
      </div>

      {/* Stats Cards */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 bg-gradient-to-br from-[#43FF52]/20 to-[#43FF52]/5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCardIcon className="w-5 h-5 text-[#43FF52]" />
              <p className="text-sm text-gray-500">Total Collected</p>
            </div>
            <p className="text-4xl font-bold font-number text-gradient-green">${totalAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="glass-card p-5 bg-gradient-to-br from-[#B34AFF]/20 to-[#B34AFF]/5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCardIcon className="w-5 h-5 text-[#B34AFF]" />
              <p className="text-sm text-gray-500">Card Payments</p>
            </div>
            <p className="text-3xl font-bold font-number text-gradient-purple">${cardTotal.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {transactions.filter(t => t.payment_method === 'card').length} transaction{transactions.filter(t => t.payment_method === 'card').length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="glass-card p-5 bg-gradient-to-br from-[#43FF52]/20 to-[#43FF52]/5">
            <div className="flex items-center gap-2 mb-2">
              <CashIcon className="w-5 h-5 text-[#43FF52]" />
              <p className="text-sm text-gray-500">Cash Payments</p>
            </div>
            <p className="text-3xl font-bold font-number text-gradient-green">${cashTotal.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {transactions.filter(t => t.payment_method === 'cash').length} transaction{transactions.filter(t => t.payment_method === 'cash').length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Request Payment Button */}
        <button
          onClick={() => setShowRequestForm(true)}
          className="w-full py-4 btn-primary flex items-center justify-center gap-2 text-lg"
        >
          <PlusIcon className="w-6 h-6" />
          Request Payment
        </button>

        {/* Payment Request Modal */}
        {showRequestForm && vendor && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="w-full max-w-md">
              <PaymentRequestForm
                vendor={vendor}
                onRequestSubmitted={() => {
                  fetchPaymentRequests()
                  setShowRequestForm(false)
                }}
              />
              <button
                onClick={() => setShowRequestForm(false)}
                className="w-full mt-3 py-3 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {paymentRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="glass-card bg-gradient-to-br from-[#B34AFF]/10 to-[#B34AFF]/5">
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-lg font-semibold text-foreground">Pending Requests</h2>
              <p className="text-sm text-gray-500">Waiting to be processed by admin</p>
            </div>
            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {paymentRequests
                .filter(r => r.status === 'pending')
                .map((request) => (
                  <div
                    key={request.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xl font-bold font-number text-gradient-purple">
                        ${Number(request.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-foreground font-medium">{request.payer_name}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                        Pending
                      </span>
                      <button
                        onClick={() => deleteRequest(request.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        title="Cancel request"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="glass-card">
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-lg font-semibold text-foreground">Recent Payments</h2>
          </div>
          <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50 max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No payments yet</p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-number text-gradient-green">
                        ${Number(transaction.amount).toFixed(2)}
                      </span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                        transaction.payment_method === 'card'
                          ? 'badge-card'
                          : transaction.payment_method === 'cash'
                          ? 'badge-cash'
                          : 'badge-other'
                      }`}>
                        <PaymentMethodIcon method={transaction.payment_method} />
                        {transaction.payment_method}
                      </span>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{transaction.description}</p>
                    )}
                  </div>
                  <p className="flex items-center gap-1 text-sm text-gray-400">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {formatDate(transaction.created_at)}
                  </p>
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
