'use client'

import { useState } from 'react'
import { Vendor } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { CreditCardIcon, CashIcon, DotsIcon } from '@/components/Icons'

interface PaymentFormProps {
  vendor: Vendor
  onPaymentAdded: () => void
}

export default function PaymentForm({ vendor, onPaymentAdded }: PaymentFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'other'>('card')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError('')

    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        vendor_id: vendor.id,
        amount: numAmount,
        description: description || null,
        payment_method: paymentMethod,
      })

    setLoading(false)

    if (insertError) {
      setError('Failed to add payment. Please try again.')
      console.error(insertError)
      return
    }

    setAmount('')
    setDescription('')
    setPaymentMethod('card')
    onPaymentAdded()
  }

  const quickAmounts = [5, 10, 15, 20, 25, 50]

  const paymentMethods = [
    { id: 'card' as const, label: 'Card', icon: CreditCardIcon },
    { id: 'cash' as const, label: 'Cash', icon: CashIcon },
    { id: 'other' as const, label: 'Other', icon: DotsIcon },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 glass-card bg-gradient-to-r from-[#B34AFF]/10 to-[#B34AFF]/5">
        <p className="text-sm text-[#B34AFF]">Recording payment for</p>
        <p className="text-xl font-bold text-foreground">{vendor.name}</p>
      </div>

      {error && (
        <div className="p-3 glass-card bg-red-500/10 text-red-600 text-sm border-l-4 border-red-500">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
          Amount ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-5 text-4xl font-bold font-number glass-input text-center"
          required
        />
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmount(amt.toString())}
              className="btn-secondary px-3 py-2.5 text-sm font-number"
            >
              ${amt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all ${
                  paymentMethod === method.id
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{method.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Customer name, product sold"
          className="w-full px-4 py-3 glass-input"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !amount}
        className="w-full py-4 px-6 text-xl font-bold btn-success disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Record $${amount || '0.00'} Payment`}
      </button>
    </form>
  )
}
