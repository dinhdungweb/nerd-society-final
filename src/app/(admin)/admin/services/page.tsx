'use client'

import { useState, useEffect } from 'react'
import {
    PlusIcon,
    PencilSquareIcon,
    CurrencyDollarIcon,
    ClockIcon,
    SparklesIcon,
    TrashIcon,
    BuildingOffice2Icon,
    UserIcon,
    UserGroupIcon,
    CubeIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/shared/Button'
import NcModal from '@/shared/NcModal'

interface Service {
    id: string
    name: string
    slug: string
    type: 'MEETING' | 'POD_MONO' | 'POD_MULTI'
    description: string | null
    priceSmall: number | null
    priceLarge: number | null
    priceFirstHour: number | null
    pricePerHour: number | null
    nerdCoinReward: number
    minDuration: number
    timeStep: number
    features: string[]
    icon: string | null
    isActive: boolean
}

const serviceTypeLabels: Record<string, string> = {
    MEETING: 'Meeting Room',
    POD_MONO: 'Mono Pod',
    POD_MULTI: 'Multi Pod',
}

const serviceTypeColors: Record<string, string> = {
    MEETING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    POD_MONO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    POD_MULTI: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

const ServiceTypeIcon = ({ type }: { type: string }) => {
    const iconClass = "w-7 h-7"
    switch (type) {
        case 'MEETING':
            return <BuildingOffice2Icon className={`${iconClass} text-blue-600`} />
        case 'POD_MONO':
            return <UserIcon className={`${iconClass} text-emerald-600`} />
        case 'POD_MULTI':
            return <UserGroupIcon className={`${iconClass} text-teal-600`} />
        default:
            return <CubeIcon className={`${iconClass} text-neutral-600`} />
    }
}

function formatPrice(price: number | null) {
    if (price === null) return '-'
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        type: 'MEETING',
        description: '',
        priceSmall: '',
        priceLarge: '',
        priceFirstHour: '',
        pricePerHour: '',
        nerdCoinReward: '0',
        minDuration: '60',
        timeStep: '30',
        features: '',
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/admin/services')
            if (res.ok) {
                const data = await res.json()
                setServices(data)
            }
        } catch (error) {
            console.error('Error fetching services:', error)
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setEditingService(null)
        setFormData({
            name: '',
            slug: '',
            type: 'MEETING',
            description: '',
            priceSmall: '',
            priceLarge: '',
            priceFirstHour: '',
            pricePerHour: '',
            nerdCoinReward: '0',
            minDuration: '60',
            timeStep: '30',
            features: '',
        })
        setIsModalOpen(true)
    }

    const openEditModal = (service: Service) => {
        setEditingService(service)
        setFormData({
            name: service.name,
            slug: service.slug,
            type: service.type,
            description: service.description || '',
            priceSmall: service.priceSmall?.toString() || '',
            priceLarge: service.priceLarge?.toString() || '',
            priceFirstHour: service.priceFirstHour?.toString() || '',
            pricePerHour: service.pricePerHour?.toString() || '',
            nerdCoinReward: service.nerdCoinReward.toString(),
            minDuration: service.minDuration.toString(),
            timeStep: service.timeStep.toString(),
            features: service.features.join(', '),
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const payload = {
                ...formData,
                features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
            }

            const url = editingService
                ? `/api/admin/services/${editingService.id}`
                : '/api/admin/services'
            const method = editingService ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (res.ok) {
                fetchServices()
                setIsModalOpen(false)
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to save service')
            }
        } catch (error) {
            console.error('Error saving service:', error)
        } finally {
            setSaving(false)
        }
    }

    const deleteService = async (service: Service) => {
        if (!confirm(`Bạn có chắc muốn xóa dịch vụ "${service.name}"?`)) return

        try {
            const res = await fetch(`/api/admin/services/${service.id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                fetchServices()
            } else {
                const error = await res.json()
                alert(error.error || 'Không thể xóa dịch vụ')
            }
        } catch (error) {
            console.error('Error deleting service:', error)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
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
                        Quản lý Dịch vụ
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Bảng giá và cấu hình dịch vụ
                    </p>
                </div>
                <Button onClick={openCreateModal}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Thêm dịch vụ
                </Button>
            </div>

            {/* Services List */}
            <div className="space-y-4">
                {services.map(service => (
                    <div
                        key={service.id}
                        className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5"
                    >
                        <div className="flex items-start justify-between">
                            {/* Left: Info */}
                            <div className="flex items-start gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-700">
                                    <ServiceTypeIcon type={service.type} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                            {service.name}
                                        </h3>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${serviceTypeColors[service.type]}`}>
                                            {serviceTypeLabels[service.type]}
                                        </span>
                                    </div>
                                    {service.description && (
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                            {service.description}
                                        </p>
                                    )}

                                    {/* Pricing */}
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        {service.type === 'MEETING' ? (
                                            <>
                                                <div className="flex items-center gap-1.5">
                                                    <CurrencyDollarIcon className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-neutral-600 dark:text-neutral-300">
                                                        &lt;8 người: <strong>{formatPrice(service.priceSmall)}/h</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CurrencyDollarIcon className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-neutral-600 dark:text-neutral-300">
                                                        8-20 người: <strong>{formatPrice(service.priceLarge)}/h</strong>
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1.5">
                                                    <CurrencyDollarIcon className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-neutral-600 dark:text-neutral-300">
                                                        Giờ đầu: <strong>{formatPrice(service.priceFirstHour)}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CurrencyDollarIcon className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-neutral-600 dark:text-neutral-300">
                                                        Sau đó: <strong>{formatPrice(service.pricePerHour)}/h</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <SparklesIcon className="w-4 h-4 text-amber-500" />
                                                    <span className="text-neutral-600 dark:text-neutral-300">
                                                        Tặng <strong>{service.nerdCoinReward} Nerd Coin</strong>
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <ClockIcon className="w-4 h-4 text-neutral-400" />
                                            <span className="text-neutral-600 dark:text-neutral-300">
                                                Tối thiểu: {service.minDuration} phút
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openEditModal(service)}
                                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                                >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    Sửa
                                </button>
                                <button
                                    onClick={() => deleteService(service)}
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
                modalTitle={editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
                renderTrigger={() => null}
                renderContent={() => (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Tên dịch vụ
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
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                    required
                                    disabled={!!editingService}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Loại dịch vụ
                            </label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                disabled={!!editingService}
                            >
                                <option value="MEETING">Meeting Room</option>
                                <option value="POD_MONO">Mono Pod</option>
                                <option value="POD_MULTI">Multi Pod</option>
                            </select>
                        </div>

                        {/* Pricing - Meeting */}
                        {formData.type === 'MEETING' && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Giá &lt;8 người (VND/h)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priceSmall}
                                        onChange={e => setFormData({ ...formData, priceSmall: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Giá 8-20 người (VND/h)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priceLarge}
                                        onChange={e => setFormData({ ...formData, priceLarge: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Pricing - Pod */}
                        {formData.type !== 'MEETING' && (
                            <div className="grid grid-cols-3 gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Giá giờ đầu (VND)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priceFirstHour}
                                        onChange={e => setFormData({ ...formData, priceFirstHour: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Giá từ giờ 2 (VND/h)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.pricePerHour}
                                        onChange={e => setFormData({ ...formData, pricePerHour: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Nerd Coin tặng
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.nerdCoinReward}
                                        onChange={e => setFormData({ ...formData, nerdCoinReward: e.target.value })}
                                        min="0"
                                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Thời gian tối thiểu (phút)
                                </label>
                                <input
                                    type="number"
                                    value={formData.minDuration}
                                    onChange={e => setFormData({ ...formData, minDuration: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Bước nhảy (phút)
                                </label>
                                <input
                                    type="number"
                                    value={formData.timeStep}
                                    onChange={e => setFormData({ ...formData, timeStep: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Mô tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" loading={saving}>
                                {editingService ? 'Cập nhật' : 'Tạo dịch vụ'}
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
