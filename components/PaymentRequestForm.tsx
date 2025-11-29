'use client'

import { useState } from 'react'
import { Vendor } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import CalculatorInput from './CalculatorInput'
import { CheckIcon, PlusIcon } from './Icons'

interface PaymentRequestFormProps {
  vendor: Vendor
  onRequestSubmitted: () => void
}

export default function PaymentRequestForm({ vendor, onRequestSubmitted }: PaymentRequestFormProps) {
  const [amount, setAmount] = useState(0)
  const [payerName, setPayerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (amount <= 0) {
      setError('Please enter an amount')
      return
    }

    if (!payerName.trim()) {
      setError('Please enter the payer name')
      return
    }

    setLoading(true)
    setError('')

    const { error: insertError } = await supabase
      .from('payment_requests')
      .insert({
        vendor_id: vendor.id,
        amount: amount,
        payer_name: payerName.trim(),
      })

    setLoading(false)

    if (insertError) {
      setError('Failed to submit request. Please try again.')
      return
    }

    setSuccess(true)
    setAmount(0)
    setPayerName('')

    // Reset success after 3 seconds
    setTimeout(() => {
      setSuccess(false)
    }, 3000)

    onRequestSubmitted()
  }

  if (success) {
    return (
      <div className="glass-card p-6 bg-gradient-to-br from-[#43FF52]/20 to-[#43FF52]/5 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#43FF52]/20 flex items-center justify-center">
          <CheckIcon className="w-8 h-8 text-[#43FF52]" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Request Submitted!</h3>
        <p className="text-gray-500">Your payment request has been sent to the admin.</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-bold text-foreground mb-4">Request Payment</h3>
      <p className="text-sm text-gray-500 mb-4">
        Enter the amount and payer name to request a payment from the admin.
      </p>

      {error && (
        <div className="mb-4 p-3 glass-card bg-red-500/10 text-red-600 text-sm border-l-4 border-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Amount ($)
          </label>
          <CalculatorInput
            value={amount}
            onChange={setAmount}
            placeholder="0.00"
            autoFocus={false}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Payer Name
          </label>
          <input
            type="text"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder="Enter the name of the person paying"
            className="w-full px-4 py-3 glass-input"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || amount <= 0}
          className="w-full py-4 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <PlusIcon className="w-5 h-5" />
              Submit Request - ${amount.toFixed(2)}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
