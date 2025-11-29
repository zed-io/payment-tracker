'use client'

import { Transaction, Vendor } from '@/lib/database.types'

interface DashboardSummaryProps {
  transactions: Transaction[]
  vendors: Vendor[]
}

export default function DashboardSummary({ transactions, vendors }: DashboardSummaryProps) {
  const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const cardTotal = transactions
    .filter(t => t.payment_method === 'card')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const cashTotal = transactions
    .filter(t => t.payment_method === 'cash')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const vendorTotals = vendors.map(vendor => {
    const vendorTransactions = transactions.filter(t => t.vendor_id === vendor.id)
    const total = vendorTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    return { vendor, total, count: vendorTransactions.length }
  }).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-green-100 text-sm">Total Collected</p>
          <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-blue-100 text-sm">Card Payments</p>
          <p className="text-2xl font-bold">${cardTotal.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <p className="text-emerald-100 text-sm">Cash Payments</p>
          <p className="text-2xl font-bold">${cashTotal.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-purple-100 text-sm">Transactions</p>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </div>
      </div>

      {/* Vendor Breakdown */}
      {vendorTotals.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Vendor Breakdown</h3>
          <div className="space-y-2">
            {vendorTotals.map(({ vendor, total, count }) => (
              <div key={vendor.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{vendor.name}</p>
                  <p className="text-sm text-gray-500">{count} transaction{count !== 1 ? 's' : ''}</p>
                </div>
                <p className="text-lg font-bold text-green-600">${total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
