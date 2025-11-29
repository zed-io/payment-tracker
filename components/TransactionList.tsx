'use client'

import { useState } from 'react'
import { Transaction, Vendor } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

interface TransactionListProps {
  transactions: Transaction[]
  vendors: Vendor[]
  onTransactionsChange: () => void
  selectedVendorId?: string
}

export default function TransactionList({
  transactions,
  vendors,
  onTransactionsChange,
  selectedVendorId
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState<'card' | 'cash' | 'other'>('card')
  const [loading, setLoading] = useState(false)

  const filteredTransactions = selectedVendorId
    ? transactions.filter(t => t.vendor_id === selectedVendorId)
    : transactions

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

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setEditAmount(transaction.amount.toString())
    setEditDescription(transaction.description || '')
    setEditPaymentMethod(transaction.payment_method)
  }

  const handleUpdate = async () => {
    if (!editingTransaction) return

    const numAmount = parseFloat(editAmount)
    if (isNaN(numAmount) || numAmount <= 0) return

    setLoading(true)

    const { error } = await supabase
      .from('transactions')
      .update({
        amount: numAmount,
        description: editDescription.trim() || null,
        payment_method: editPaymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingTransaction.id)

    setLoading(false)

    if (!error) {
      setEditingTransaction(null)
      onTransactionsChange()
    }
  }

  const handleDelete = async (transaction: Transaction) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction.id)

    if (!error) {
      onTransactionsChange()
    }
  }

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Recent Transactions
          {selectedVendorId && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredTransactions.length} total)
            </span>
          )}
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold text-green-600">${totalAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No transactions yet</p>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-green-600">
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
                {!selectedVendorId && (
                  <p className="text-sm font-medium text-gray-700">
                    {getVendorName(transaction.vendor_id)}
                  </p>
                )}
                {transaction.description && (
                  <p className="text-sm text-gray-500 truncate">{transaction.description}</p>
                )}
                <p className="text-xs text-gray-400">{formatDate(transaction.created_at)}</p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => openEdit(transaction)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(transaction)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Transaction</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-4 py-2 text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['card', 'cash', 'other'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setEditPaymentMethod(method)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        editPaymentMethod === method
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 py-2 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
