'use client'

import { Transaction, Vendor } from '@/lib/database.types'
import { CreditCardIcon, CashIcon, ListIcon, StoreIcon } from '@/components/Icons'

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
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 glass-card p-5 bg-gradient-to-br from-[#43FF52]/20 to-[#43FF52]/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[#43FF52]/20">
              <CreditCardIcon className="w-5 h-5 text-[#43FF52]" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Collected</p>
          </div>
          <p className="text-4xl font-bold font-number text-gradient-green">${totalAmount.toFixed(2)}</p>
        </div>

        <div className="glass-card p-4 bg-gradient-to-br from-[#B34AFF]/20 to-[#B34AFF]/5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCardIcon className="w-4 h-4 text-[#B34AFF]" />
            <p className="text-xs text-gray-500">Card</p>
          </div>
          <p className="text-2xl font-bold font-number text-gradient-purple">${cardTotal.toFixed(2)}</p>
        </div>

        <div className="glass-card p-4 bg-gradient-to-br from-[#43FF52]/20 to-[#43FF52]/5">
          <div className="flex items-center gap-2 mb-2">
            <CashIcon className="w-4 h-4 text-[#43FF52]" />
            <p className="text-xs text-gray-500">Cash</p>
          </div>
          <p className="text-2xl font-bold font-number text-gradient-green">${cashTotal.toFixed(2)}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ListIcon className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">Transactions</p>
          </div>
          <p className="text-2xl font-bold font-number text-foreground">{transactions.length}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <StoreIcon className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">Vendors</p>
          </div>
          <p className="text-2xl font-bold font-number text-foreground">{vendors.length}</p>
        </div>
      </div>

      {/* Vendor Breakdown */}
      {vendorTotals.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Vendor Breakdown</h3>
          <div className="space-y-3">
            {vendorTotals.map(({ vendor, total, count }, index) => (
              <div key={vendor.id} className="flex items-center justify-between py-3 border-b border-gray-200/50 dark:border-gray-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? 'bg-[#43FF52]/20 text-[#43FF52]'
                      : index === 1
                      ? 'bg-[#B34AFF]/20 text-[#B34AFF]'
                      : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{count} transaction{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <p className="text-xl font-bold font-number text-gradient-green">${total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
