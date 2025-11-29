'use client'

import { useState } from 'react'
import { Vendor } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

interface VendorManagerProps {
  vendors: Vendor[]
  onVendorsChange: () => void
}

export default function VendorManager({ vendors, onVendorsChange }: VendorManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setDescription('')
    setContactName('')
    setContactPhone('')
    setEditingVendor(null)
    setError('')
  }

  const openCreate = () => {
    resetForm()
    setIsOpen(true)
  }

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setName(vendor.name)
    setDescription(vendor.description || '')
    setContactName(vendor.contact_name || '')
    setContactPhone(vendor.contact_phone || '')
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Vendor name is required')
      return
    }

    setLoading(true)
    setError('')

    if (editingVendor) {
      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          contact_name: contactName.trim() || null,
          contact_phone: contactPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingVendor.id)

      if (updateError) {
        setError('Failed to update vendor')
        setLoading(false)
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('vendors')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          contact_name: contactName.trim() || null,
          contact_phone: contactPhone.trim() || null,
        })

      if (insertError) {
        setError('Failed to add vendor')
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setIsOpen(false)
    resetForm()
    onVendorsChange()
  }

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete "${vendor.name}"? This will also delete all their transactions.`)) {
      return
    }

    const { error: deleteError } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendor.id)

    if (deleteError) {
      alert('Failed to delete vendor')
      return
    }

    onVendorsChange()
  }

  const copyShareLink = async (vendor: Vendor) => {
    const link = `${window.location.origin}/vendor/${vendor.share_token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(vendor.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Manage Vendors</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          + Add Vendor
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {vendors.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No vendors yet. Add your first vendor!</p>
        ) : (
          vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{vendor.name}</p>
                {vendor.description && (
                  <p className="text-sm text-gray-500 truncate">{vendor.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => copyShareLink(vendor)}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="Copy share link"
                >
                  {copiedId === vendor.id ? 'Copied!' : 'Share'}
                </button>
                <button
                  onClick={() => openEdit(vendor)}
                  className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vendor)}
                  className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Fresh Produce Co."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Organic fruits and vegetables"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g., John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g., 555-123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      resetForm()
                    }}
                    className="flex-1 py-2 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors"
                  >
                    {loading ? 'Saving...' : editingVendor ? 'Update' : 'Add Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
