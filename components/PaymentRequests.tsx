'use client'

import { useState } from 'react'
import { PaymentRequest, Vendor } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { CheckIcon, XIcon, ClockIcon, CreditCardIcon, CashIcon, DotsIcon } from './Icons'

interface PaymentRequestsProps {
  requests: PaymentRequest[]
  vendors: Vendor[]
  onRequestsChange: () => void
  onProcessPayment: (request: PaymentRequest, paymentMethod: 'card' | 'cash' | 'other') => void
}

export default function PaymentRequests({
  requests,
  vendors,
  onRequestsChange,
  onProcessPayment
}: PaymentRequestsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState<PaymentRequest | null>(null)

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

  const handleProcess = (request: PaymentRequest) => {
    setShowPaymentMethodModal(request)
  }

  const handleConfirmProcess = async (paymentMethod: 'card' | 'cash' | 'other') => {
    if (!showPaymentMethodModal) return

    setProcessingId(showPaymentMethodModal.id)
    onProcessPayment(showPaymentMethodModal, paymentMethod)
    setShowPaymentMethodModal(null)
    setProcessingId(null)
  }

  const handleCancel = async (request: PaymentRequest) => {
    if (!confirm(`Cancel payment request for $${request.amount} from ${request.payer_name}?`)) {
      return
    }

    setProcessingId(request.id)

    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id)

    setProcessingId(null)

    if (!error) {
      onRequestsChange()
    }
  }

  const paymentMethods = [
    { id: 'card' as const, label: 'Card', icon: CreditCardIcon, color: 'bg-[#B34AFF]/20 text-[#B34AFF]' },
    { id: 'cash' as const, label: 'Cash', icon: CashIcon, color: 'bg-[#43FF52]/20 text-[#43FF52]' },
    { id: 'other' as const, label: 'Other', icon: DotsIcon, color: 'bg-gray-500/20 text-gray-500' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Payment Requests</h2>
          <p className="text-sm text-gray-500">
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-12 glass-card">
            <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No pending payment requests</p>
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div
              key={request.id}
              className="glass-card p-4 bg-gradient-to-br from-[#B34AFF]/10 to-transparent"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold font-number text-gradient-purple">
                      ${Number(request.amount).toFixed(2)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                      Pending
                    </span>
                  </div>
                  <p className="font-medium text-foreground">{request.payer_name}</p>
                  <p className="text-sm text-gray-500">{getVendorName(request.vendor_id)}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <ClockIcon className="w-3 h-3" />
                    {formatDate(request.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleProcess(request)}
                    disabled={processingId === request.id}
                    className="px-4 py-2 btn-primary rounded-xl flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    Process
                  </button>
                  <button
                    onClick={() => handleCancel(request)}
                    disabled={processingId === request.id}
                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    title="Cancel request"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Method Selection Modal */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="glass-card w-full max-w-sm bg-white dark:bg-gray-900 p-6">
            <h3 className="text-xl font-bold text-foreground mb-2">Process Payment</h3>
            <p className="text-gray-500 mb-4">
              ${Number(showPaymentMethodModal.amount).toFixed(2)} from {showPaymentMethodModal.payer_name}
            </p>
            <p className="text-sm text-gray-500 mb-4">Select payment method:</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.id}
                    onClick={() => handleConfirmProcess(method.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${method.color} hover:scale-105`}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setShowPaymentMethodModal(null)}
              className="w-full py-3 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
