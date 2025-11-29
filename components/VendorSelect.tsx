'use client'

import { Vendor } from '@/lib/database.types'

interface VendorSelectProps {
  vendors: Vendor[]
  selectedVendor: Vendor | null
  onSelect: (vendor: Vendor | null) => void
}

export default function VendorSelect({ vendors, selectedVendor, onSelect }: VendorSelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select Vendor
      </label>
      <select
        value={selectedVendor?.id || ''}
        onChange={(e) => {
          const vendor = vendors.find(v => v.id === e.target.value)
          onSelect(vendor || null)
        }}
        className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="">-- Select a vendor --</option>
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name}
          </option>
        ))}
      </select>
    </div>
  )
}
