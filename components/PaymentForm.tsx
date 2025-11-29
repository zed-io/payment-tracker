'use client'

import { useState } from 'react'
import { Vendor } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-600">Recording payment for</p>
        <p className="text-xl font-bold text-blue-800">{vendor.name}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Amount ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-4 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
          required
        />
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmount(amt.toString())}
              className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ${amt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['card', 'cash', 'other'] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                paymentMethod === method
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {method === 'card' && 'Card'}
              {method === 'cash' && 'Cash'}
              {method === 'other' && 'Other'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Customer name, product sold"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !amount}
        className="w-full py-4 px-6 text-xl font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-lg transition-colors"
      >
        {loading ? 'Processing...' : `Record $${amount || '0.00'} Payment`}
      </button>
    </form>
  )
}
