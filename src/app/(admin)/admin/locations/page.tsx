'use client'

import { useState, useEffect } from 'react'
import {
    PlusIcon,
    MapPinIcon,
    PencilSquareIcon,
    PhoneIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/shared/Button'
import NcModal from '@/shared/NcModal'

interface Location {
    id: string
    name: string
    address: string
    phone: string
    mapUrl: string | null
    isActive: boolean
    _count?: { bookings: number }
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLocation, setEditingLocation] = useState<Location | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        mapUrl: '',
        isActive: true,
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchLocations()
    }, [])

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/admin/locations')
            if (res.ok) {
                const data = await res.json()
                setLocations(data)
            }
        } catch (error) {
            console.error('Error fetching locations:', error)
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setEditingLocation(null)
        setFormData({
            name: '',
            address: '',
            phone: '',
            mapUrl: '',
            isActive: true,
        })
        setIsModalOpen(true)
    }

    const openEditModal = (location: Location) => {
        setEditingLocation(location)
        setFormData({
            name: location.name,
            address: location.address,
            phone: location.phone,
            mapUrl: location.mapUrl || '',
            isActive: location.isActive,
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const url = editingLocation
                ? `/api/admin/locations/${editingLocation.id}`
                : '/api/admin/locations'
            const method = editingLocation ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                fetchLocations()
                setIsModalOpen(false)
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to save location')
            }
        } catch (error) {
            console.error('Error saving location:', error)
        } finally {
            setSaving(false)
        }
    }

    const toggleStatus = async (location: Location) => {
        try {
            await fetch(`/api/admin/locations/${location.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !location.isActive }),
            })
            fetchLocations()
        } catch (error) {
            console.error('Error toggling status:', error)
        }
    }

    const deleteLocation = async (location: Location) => {
        if (!confirm(`Bạn có chắc muốn xóa cơ sở "${location.name}"?`)) return

        try {
            const res = await fetch(`/api/admin/locations/${location.id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                fetchLocations()
            } else {
                const error = await res.json()
                alert(error.error || 'Không thể xóa cơ sở')
            }
        } catch (error) {
            console.error('Error deleting location:', error)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="h-48 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        Quản lý Cơ sở
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Quản lý các chi nhánh Nerd Society
                    </p>
                </div>
                <Button onClick={openCreateModal}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Thêm cơ sở
                </Button>
            </div>

            {/* Locations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {locations.map(location => (
                    <div
                        key={location.id}
                        className={`bg-white dark:bg-neutral-800 rounded-xl border ${location.isActive
                            ? 'border-neutral-200 dark:border-neutral-700'
                            : 'border-red-200 dark:border-red-800 opacity-60'
                            } p-5 hover:shadow-lg transition-shadow`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
                                    {location.name}
                                </h3>
                                <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${location.isActive
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {location.isActive ? 'Đang hoạt động' : 'Tạm đóng'}
                                </span>
                            </div>
                            <button
                                onClick={() => toggleStatus(location)}
                                className={`p-1.5 rounded-full transition-colors ${location.isActive
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                    : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    }`}
                                title={location.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                            >
                                {location.isActive ? (
                                    <CheckCircleIcon className="w-5 h-5" />
                                ) : (
                                    <XCircleIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {/* Info */}
                        <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <div className="flex items-start gap-2">
                                <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{location.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <PhoneIcon className="w-4 h-4" />
                                <span>{location.phone}</span>
                            </div>
                            {location.mapUrl && (
                                <a
                                    href={location.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                >
                                    Xem trên bản đồ →
                                </a>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                            <span className="text-xs text-neutral-500">
                                {location._count?.bookings || 0} lượt đặt
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openEditModal(location)}
                                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                                >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    Sửa
                                </button>
                                <button
                                    onClick={() => deleteLocation(location)}
                                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <NcModal
                isOpenProp={isModalOpen}
                onCloseModal={() => setIsModalOpen(false)}
                modalTitle={editingLocation ? 'Sửa cơ sở' : 'Thêm cơ sở mới'}
                renderTrigger={() => null}
                renderContent={() => (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Tên cơ sở
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Địa chỉ
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Số điện thoại
                            </label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Link Google Maps (tuỳ chọn)
                            </label>
                            <input
                                type="url"
                                value={formData.mapUrl}
                                onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                                placeholder="https://maps.google.com/..."
                                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                className="rounded border-neutral-300"
                            />
                            <label htmlFor="isActive" className="text-sm text-neutral-700 dark:text-neutral-300">
                                Đang hoạt động
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" loading={saving}>
                                {editingLocation ? 'Cập nhật' : 'Tạo cơ sở'}
                            </Button>
                            <Button type="button" outline onClick={() => setIsModalOpen(false)}>
                                Hủy
                            </Button>
                        </div>
                    </form>
                )}
            />
        </div>
    )
}
