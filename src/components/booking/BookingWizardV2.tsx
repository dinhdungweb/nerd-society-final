'use client'

import BookingFormV2 from '@/components/booking/BookingFormV2'
import LocationSelector from '@/components/booking/LocationSelector'
import RoomSelector from '@/components/booking/RoomSelector'
import ServiceSelector from '@/components/booking/ServiceSelector'
import { CheckIcon } from '@heroicons/react/24/outline'
import { RoomType, ServiceType } from '@prisma/client'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Location {
    id: string
    name: string
    address: string
    image: string | null
}

interface Service {
    id: string
    name: string
    slug: string
    type: ServiceType
    description?: string | null
    priceSmall?: number | null
    priceLarge?: number | null
    priceFirstHour?: number | null
    pricePerHour?: number | null
    nerdCoinReward: number
    minDuration: number
    timeStep: number
    features: string[]
    icon?: string | null
}

interface Room {
    id: string
    name: string
    type: RoomType
    description?: string | null
    capacity: number
    amenities: string[]
    image?: string | null
}

interface BookingWizardV2Props {
    locations: Location[]
}

const steps = [
    { id: 1, name: 'Cơ sở' },
    { id: 2, name: 'Dịch vụ' },
    { id: 3, name: 'Phòng' },
    { id: 4, name: 'Đặt lịch' },
]

export default function BookingWizardV2({ locations }: BookingWizardV2Props) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Selected values
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

    // Fetched data
    const [services, setServices] = useState<Service[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [loadingServices, setLoadingServices] = useState(false)
    const [loadingRooms, setLoadingRooms] = useState(false)

    // Fetch services on mount
    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true)
            try {
                const res = await fetch('/api/booking/services')
                const data = await res.json()
                setServices(data.services || [])
            } catch (error) {
                console.error('Error fetching services:', error)
                toast.error('Không thể tải danh sách dịch vụ')
            } finally {
                setLoadingServices(false)
            }
        }
        fetchServices()
    }, [])

    // Fetch rooms when location and service change
    useEffect(() => {
        if (!selectedLocation || !selectedService) {
            setRooms([])
            return
        }

        const fetchRooms = async () => {
            setLoadingRooms(true)
            try {
                const res = await fetch(
                    `/api/booking/rooms?locationId=${selectedLocation}&serviceType=${selectedService.type}`
                )
                const data = await res.json()
                setRooms(data.rooms || [])
            } catch (error) {
                console.error('Error fetching rooms:', error)
                toast.error('Không thể tải danh sách phòng')
            } finally {
                setLoadingRooms(false)
            }
        }
        fetchRooms()
    }, [selectedLocation, selectedService])

    // Handlers
    const handleLocationSelect = (id: string) => {
        setSelectedLocation(id)
        setSelectedRoom(null)
        setCurrentStep(2)
    }

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service)
        setSelectedRoom(null)
        setCurrentStep(3)
    }

    const handleRoomSelect = (room: Room) => {
        setSelectedRoom(room)
        setCurrentStep(4)
    }

    const handleBookingSubmit = async (data: {
        date: Date
        startTime: string
        endTime: string
        guests: number
        customerName: string
        customerPhone: string
        customerEmail?: string
        note?: string
    }) => {
        if (!selectedLocation || !selectedRoom || !selectedService) return

        setLoading(true)
        try {
            const response = await fetch('/api/booking/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: selectedRoom.id,
                    locationId: selectedLocation,
                    serviceType: selectedService.type,
                    date: format(data.date, 'yyyy-MM-dd'),
                    startTime: data.startTime,
                    endTime: data.endTime,
                    guests: data.guests,
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    customerEmail: data.customerEmail,
                    note: data.note,
                }),
            })

            if (response.ok) {
                const result = await response.json()
                toast.success('Đặt phòng thành công!')

                // Redirect to payment URL hoặc success page
                if (result.paymentUrl) {
                    window.location.href = result.paymentUrl
                } else {
                    router.push(`/booking/success?id=${result.booking.id}`)
                }
            } else {
                const error = await response.json()
                toast.error(error.error || 'Có lỗi xảy ra, vui lòng thử lại')
            }
        } catch (error) {
            console.error('Booking error:', error)
            toast.error('Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    const goBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    return (
        <div>
            {/* Steps Indicator */}
            <div className="mb-12">
                <div className="relative flex items-center justify-between">
                    {/* Progress Bar */}
                    <div className="absolute left-[40px] right-[40px] top-5 h-0.5">
                        <div className="absolute inset-0 bg-neutral-700" />
                        <div
                            className="absolute inset-y-0 left-0 bg-primary-500 transition-all duration-300"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />
                    </div>

                    {steps.map((step) => {
                        const isCompleted = currentStep > step.id
                        const isCurrent = currentStep === step.id

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                <div
                                    className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors duration-300 ${isCompleted
                                        ? 'border-primary-500 bg-primary-500 text-white'
                                        : isCurrent
                                            ? 'border-primary-500 bg-neutral-950 text-primary-500'
                                            : 'border-neutral-700 bg-neutral-950 text-neutral-400'
                                        }`}
                                >
                                    {isCompleted ? <CheckIcon className="size-6" /> : <span>{step.id}</span>}
                                </div>
                                <span
                                    className={`text-sm font-medium ${isCurrent ? 'text-primary-400' : 'text-neutral-400'
                                        }`}
                                >
                                    {step.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-4xl">
                {/* Step 1: Location */}
                {currentStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
                            Chọn cơ sở gần bạn
                        </h2>
                        <LocationSelector
                            locations={locations}
                            selectedLocationId={selectedLocation || ''}
                            onSelect={handleLocationSelect}
                        />
                    </div>
                )}

                {/* Step 2: Service */}
                {currentStep === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                Chọn loại dịch vụ
                            </h2>
                            <button
                                onClick={goBack}
                                className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                            >
                                ← Quay lại
                            </button>
                        </div>
                        {loadingServices ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800 h-48" />
                                ))}
                            </div>
                        ) : (
                            <ServiceSelector
                                services={services}
                                selectedServiceType={selectedService?.type || null}
                                onSelect={handleServiceSelect}
                            />
                        )}
                    </div>
                )}

                {/* Step 3: Room */}
                {currentStep === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                Chọn phòng
                            </h2>
                            <button
                                onClick={goBack}
                                className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                            >
                                ← Quay lại
                            </button>
                        </div>
                        <RoomSelector
                            rooms={rooms}
                            selectedRoomId={selectedRoom?.id || null}
                            onSelect={handleRoomSelect}
                            loading={loadingRooms}
                        />
                    </div>
                )}

                {/* Step 4: Booking Form */}
                {currentStep === 4 && selectedRoom && selectedService && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    Đặt lịch
                                </h2>
                                <p className="mt-1 text-sm text-neutral-500">
                                    {selectedRoom.name} - {selectedService.name}
                                </p>
                            </div>
                            <button
                                onClick={goBack}
                                className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                            >
                                ← Quay lại
                            </button>
                        </div>
                        <BookingFormV2
                            roomId={selectedRoom.id}
                            serviceType={selectedService.type}
                            onSubmit={handleBookingSubmit}
                            loading={loading}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
