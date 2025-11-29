'use client'

import { useState } from 'react'
import { Vendor } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { PlusIcon, EditIcon, TrashIcon, ShareIcon, CheckIcon, XIcon } from '@/components/Icons'

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
        <h2 className="text-lg font-semibold text-foreground">Manage Vendors</h2>
        <button
          onClick={openCreate}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {vendors.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No vendors yet. Add your first vendor!</p>
        ) : (
          vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between p-4 glass-card"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{vendor.name}</p>
                {vendor.description && (
                  <p className="text-sm text-gray-500 truncate">{vendor.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-3">
                <button
                  onClick={() => copyShareLink(vendor)}
                  className={`p-2 rounded-xl transition-all ${
                    copiedId === vendor.id
                      ? 'bg-[#43FF52]/20 text-[#43FF52]'
                      : 'btn-secondary'
                  }`}
                  title="Copy share link"
                >
                  {copiedId === vendor.id ? <CheckIcon className="w-4 h-4" /> : <ShareIcon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(vendor)}
                  className="p-2 btn-secondary rounded-xl"
                  title="Edit"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(vendor)}
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

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md bg-white dark:bg-gray-900">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    resetForm()
                  }}
                  className="p-2 btn-secondary rounded-xl"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 glass-card bg-red-500/10 text-red-600 text-sm border-l-4 border-red-500">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Fresh Produce Co."
                    className="w-full px-4 py-3 glass-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Organic fruits and vegetables"
                    className="w-full px-4 py-3 glass-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g., John Smith"
                    className="w-full px-4 py-3 glass-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g., 555-123-4567"
                    className="w-full px-4 py-3 glass-input"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      resetForm()
                    }}
                    className="flex-1 py-3 px-4 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 btn-primary disabled:opacity-50"
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
