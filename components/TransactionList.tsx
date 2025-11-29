'use client'

import { useState } from 'react'
import { Transaction, Vendor } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { EditIcon, TrashIcon, CreditCardIcon, CashIcon, DotsIcon, XIcon, ClockIcon } from '@/components/Icons'

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

  const PaymentMethodIcon = ({ method }: { method: string }) => {
    switch (method) {
      case 'card': return <CreditCardIcon className="w-3.5 h-3.5" />
      case 'cash': return <CashIcon className="w-3.5 h-3.5" />
      default: return <DotsIcon className="w-3.5 h-3.5" />
    }
  }

  const paymentMethods = [
    { id: 'card' as const, label: 'Card', icon: CreditCardIcon },
    { id: 'cash' as const, label: 'Cash', icon: CashIcon },
    { id: 'other' as const, label: 'Other', icon: DotsIcon },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Recent Transactions
          {selectedVendorId && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredTransactions.length} total)
            </span>
          )}
        </h2>
        <div className="text-right glass-card px-3 py-2">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold font-number text-gradient-green">${totalAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 glass-card"
            >
              <div className="flex-1 min-w-0">
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
                {!selectedVendorId && (
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {getVendorName(transaction.vendor_id)}
                  </p>
                )}
                {transaction.description && (
                  <p className="text-sm text-gray-500 truncate">{transaction.description}</p>
                )}
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <ClockIcon className="w-3 h-3" />
                  {formatDate(transaction.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-3">
                <button
                  onClick={() => openEdit(transaction)}
                  className="p-2 btn-secondary rounded-xl"
                  title="Edit"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(transaction)}
                  className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="glass-card w-full max-w-md bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Transaction</h3>
              <button
                onClick={() => setEditingTransaction(null)}
                className="p-2 btn-secondary rounded-xl"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-4 py-3 text-xl font-bold font-number glass-input text-center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setEditPaymentMethod(method.id)}
                        className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                          editPaymentMethod === method.id
                            ? 'btn-primary'
                            : 'btn-secondary'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{method.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-4 py-3 glass-input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 py-3 px-4 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 py-3 px-4 btn-primary disabled:opacity-50"
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
