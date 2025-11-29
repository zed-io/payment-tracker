'use client'

import { useState } from 'react'
import { PaymentRequest, Vendor } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import {
  CheckIcon,
  XIcon,
  PlusIcon,
  TrashIcon,
  CreditCardIcon,
  CashIcon,
  DotsIcon,
  ClockIcon
} from './Icons'
import CalculatorInput from './CalculatorInput'

interface BatchPaymentProps {
  requests: PaymentRequest[]
  vendors: Vendor[]
  onComplete: () => void
}

interface BatchItem {
  id: string
  type: 'request' | 'manual'
  vendorId: string
  vendorName: string
  amount: number
  payerName: string
  requestId?: string // only for request type
}

export default function BatchPayment({ requests, vendors, onComplete }: BatchPaymentProps) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [showAddManual, setShowAddManual] = useState(false)
  const [manualVendorId, setManualVendorId] = useState('')
  const [manualAmount, setManualAmount] = useState(0)
  const [manualPayerName, setManualPayerName] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showPaymentMethod, setShowPaymentMethod] = useState(false)

  const pendingRequests = requests.filter(r => r.status === 'pending')

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)?.name || 'Unknown'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isRequestInBatch = (requestId: string) => {
    return batchItems.some(item => item.requestId === requestId)
  }

  const toggleRequest = (request: PaymentRequest) => {
    if (isRequestInBatch(request.id)) {
      setBatchItems(items => items.filter(item => item.requestId !== request.id))
    } else {
      setBatchItems(items => [...items, {
        id: `req-${request.id}`,
        type: 'request',
        vendorId: request.vendor_id,
        vendorName: getVendorName(request.vendor_id),
        amount: Number(request.amount),
        payerName: request.payer_name,
        requestId: request.id
      }])
    }
  }

  const addManualPayment = () => {
    if (!manualVendorId || manualAmount <= 0 || !manualPayerName.trim()) return

    setBatchItems(items => [...items, {
      id: `manual-${Date.now()}`,
      type: 'manual',
      vendorId: manualVendorId,
      vendorName: getVendorName(manualVendorId),
      amount: manualAmount,
      payerName: manualPayerName.trim()
    }])

    setManualVendorId('')
    setManualAmount(0)
    setManualPayerName('')
    setShowAddManual(false)
  }

  const removeFromBatch = (id: string) => {
    setBatchItems(items => items.filter(item => item.id !== id))
  }

  const totalAmount = batchItems.reduce((sum, item) => sum + item.amount, 0)

  const processBatch = async (paymentMethod: 'card' | 'cash' | 'other') => {
    if (batchItems.length === 0) return

    setProcessing(true)

    // Group items by vendor for the description
    const vendorSummary = batchItems.reduce((acc, item) => {
      if (!acc[item.vendorName]) acc[item.vendorName] = 0
      acc[item.vendorName] += item.amount
      return acc
    }, {} as Record<string, number>)

    const batchDescription = `Batch payment: ${Object.entries(vendorSummary)
      .map(([name, amount]) => `${name} ($${amount.toFixed(2)})`)
      .join(', ')}`

    // Create transactions for each item
    for (const item of batchItems) {
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          vendor_id: item.vendorId,
          amount: item.amount,
          description: `Payment from ${item.payerName}`,
          payment_method: paymentMethod,
        })
        .select()
        .single()

      if (transactionError) {
        console.error('Failed to create transaction:', transactionError)
        continue
      }

      // If this was a request, update its status
      if (item.type === 'request' && item.requestId) {
        await supabase
          .from('payment_requests')
          .update({
            status: 'completed',
            processed_transaction_id: transactionData.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.requestId)
      }
    }

    setProcessing(false)
    setBatchItems([])
    setShowPaymentMethod(false)
    onComplete()
  }

  const paymentMethods = [
    { id: 'card' as const, label: 'Card', icon: CreditCardIcon, color: 'bg-[#B34AFF]/20 text-[#B34AFF]' },
    { id: 'cash' as const, label: 'Cash', icon: CashIcon, color: 'bg-[#43FF52]/20 text-[#43FF52]' },
    { id: 'other' as const, label: 'Other', icon: DotsIcon, color: 'bg-gray-500/20 text-gray-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Batch Summary Card - Always visible when items selected */}
      {batchItems.length > 0 && (
        <div className="glass-card p-5 bg-gradient-to-br from-[#43FF52]/20 to-[#43FF52]/5 sticky top-20 z-30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Batch Payment</h3>
              <p className="text-sm text-gray-500">{batchItems.length} item{batchItems.length !== 1 ? 's' : ''} selected</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-3xl font-bold font-number text-gradient-green">${totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Batch Items List */}
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {batchItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{item.vendorName}</p>
                  <p className="text-xs text-gray-500 truncate">{item.payerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-number font-bold text-foreground">${item.amount.toFixed(2)}</span>
                  <button
                    onClick={() => removeFromBatch(item.id)}
                    className="p-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowPaymentMethod(true)}
            className="w-full py-3 btn-primary flex items-center justify-center gap-2"
          >
            <CreditCardIcon className="w-5 h-5" />
            Process Batch - ${totalAmount.toFixed(2)}
          </button>
        </div>
      )}

      {/* Pending Requests Section */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Pending Requests</h3>
            <p className="text-sm text-gray-500">Tap to add to batch</p>
          </div>
          <button
            onClick={() => setShowAddManual(true)}
            className="btn-secondary px-3 py-2 flex items-center gap-2 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Add Manual
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No pending payment requests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map(request => {
              const isSelected = isRequestInBatch(request.id)
              return (
                <button
                  key={request.id}
                  onClick={() => toggleRequest(request)}
                  className={`w-full p-4 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-[#B34AFF]/20 border-2 border-[#B34AFF]'
                      : 'glass-card hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold font-number text-gradient-purple">
                          ${Number(request.amount).toFixed(2)}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-[#B34AFF] text-white text-xs font-medium">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-foreground">{request.payer_name}</p>
                      <p className="text-sm text-gray-500">{getVendorName(request.vendor_id)}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#B34AFF] border-[#B34AFF]'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Manual Payment Modal */}
      {showAddManual && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="glass-card w-full max-w-md bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add Payment</h3>
              <button
                onClick={() => setShowAddManual(false)}
                className="p-2 btn-secondary rounded-xl"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Vendor
                </label>
                <select
                  value={manualVendorId}
                  onChange={(e) => setManualVendorId(e.target.value)}
                  className="w-full px-4 py-3 glass-input"
                >
                  <option value="">Select vendor...</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Amount ($)
                </label>
                <CalculatorInput
                  value={manualAmount}
                  onChange={setManualAmount}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Payer Name
                </label>
                <input
                  type="text"
                  value={manualPayerName}
                  onChange={(e) => setManualPayerName(e.target.value)}
                  placeholder="Name of person paying"
                  className="w-full px-4 py-3 glass-input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddManual(false)}
                  className="flex-1 py-3 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={addManualPayment}
                  disabled={!manualVendorId || manualAmount <= 0 || !manualPayerName.trim()}
                  className="flex-1 py-3 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add to Batch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentMethod && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="glass-card w-full max-w-sm bg-white dark:bg-gray-900 p-6">
            <h3 className="text-xl font-bold text-foreground mb-2">Process Batch</h3>
            <p className="text-gray-500 mb-2">
              {batchItems.length} payment{batchItems.length !== 1 ? 's' : ''} totaling
            </p>
            <p className="text-3xl font-bold font-number text-gradient-green mb-6">
              ${totalAmount.toFixed(2)}
            </p>

            <p className="text-sm text-gray-500 mb-4">Select payment method:</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.id}
                    onClick={() => processBatch(method.id)}
                    disabled={processing}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${method.color} hover:scale-105 disabled:opacity-50`}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                )
              })}
            </div>

            {processing && (
              <div className="text-center mb-4">
                <div className="w-6 h-6 border-2 border-[#B34AFF] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Processing payments...</p>
              </div>
            )}

            <button
              onClick={() => setShowPaymentMethod(false)}
              disabled={processing}
              className="w-full py-3 btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
