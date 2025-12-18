'use client'

import { Button } from '@/shared/Button'
import { CalendarDaysIcon, UsersIcon } from '@heroicons/react/24/outline'
import { ServiceType } from '@prisma/client'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useMemo } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import TimeSelect from './TimeSelect'
import DatePickerCustomHeaderSingleMonth from '@/components/DatePickerCustomHeaderSingleMonth'
import DatePickerCustomDay from '@/components/DatePickerCustomDay'


registerLocale('vi', vi)

interface BookedSlot {
    startTime: string
    endTime: string
}

interface PriceBreakdown {
    estimatedAmount: number
    depositAmount: number
    nerdCoinReward: number
    breakdown: Record<string, unknown>
}

interface BookingFormV2Props {
    roomId: string
    serviceType: ServiceType
    onSubmit: (data: {
        date: Date
        startTime: string
        endTime: string
        guests: number
        customerName: string
        customerPhone: string
        customerEmail?: string
        note?: string
    }) => void
    loading?: boolean
}

// Generate time slots from 08:00 to 22:00
function generateTimeSlots(step: number = 30): string[] {
    const slots: string[] = []
    for (let hour = 8; hour <= 21; hour++) {
        for (let minute = 0; minute < 60; minute += step) {
            if (hour === 21 && minute > 0) break
            slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
        }
    }
    slots.push('22:00')
    return slots
}

// Check if a time slot overlaps with booked slots
function isTimeSlotBooked(time: string, bookedSlots: BookedSlot[]): boolean {
    for (const slot of bookedSlots) {
        if (time >= slot.startTime && time < slot.endTime) {
            return true
        }
    }
    return false
}

// Check if the entire booking range overlaps with any booked slot
function isRangeOverlapping(startTime: string, endTime: string, bookedSlots: BookedSlot[]): boolean {
    if (!startTime || !endTime) return false
    for (const slot of bookedSlots) {
        // Overlap condition: A.start < B.end AND A.end > B.start
        if (startTime < slot.endTime && endTime > slot.startTime) {
            return true
        }
    }
    return false
}

// Calculate duration in minutes
function calculateDuration(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    return (endH * 60 + endM) - (startH * 60 + startM)
}

export default function BookingFormV2({
    roomId,
    serviceType,
    onSubmit,
    loading = false,
}: BookingFormV2Props) {
    const { data: session } = useSession()

    const [date, setDate] = useState<Date | null>(null)
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [guests, setGuests] = useState(1)
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [note, setNote] = useState('')

    const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [priceInfo, setPriceInfo] = useState<PriceBreakdown | null>(null)
    const [loadingPrice, setLoadingPrice] = useState(false)

    const timeStep = serviceType === 'MEETING' ? 30 : 15
    const allTimeSlots = generateTimeSlots(timeStep)
    const isMeeting = serviceType === 'MEETING'

    // Auto-fill customer info from session when logged in
    useEffect(() => {
        if (session?.user) {
            if (!customerName && session.user.name) {
                setCustomerName(session.user.name)
            }
            if (!customerEmail && session.user.email) {
                setCustomerEmail(session.user.email)
            }
            if (!customerPhone && (session.user as any).phone) {
                setCustomerPhone((session.user as any).phone)
            }
        }
    }, [session])

    // Check if selected date is today
    const today = new Date()
    const isToday = date ? (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    ) : false

    // Get current time + 15 min buffer (minimum booking lead time)
    const now = new Date()
    now.setMinutes(now.getMinutes() + 15) // 15 min buffer
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeWithBuffer = format(now, 'HH:mm')

    // Filter time slots: if today, only show future slots
    // If current time is past closing (22:00) or wrapped to next day, no slots available
    const isPastClosingTime = currentHour >= 22 || currentHour < 8 // Past 22:00 or before 08:00

    const timeSlots = isToday
        ? (isPastClosingTime
            ? [] // No slots available - all are in the past
            : allTimeSlots.filter(t => t >= currentTimeWithBuffer))
        : allTimeSlots



    // Fetch booked slots when date changes
    useEffect(() => {
        // Reset immediately to prevent stale data display
        setBookedSlots([])
        setStartTime('')
        setEndTime('')
        setPriceInfo(null)

        if (!date || !roomId) return

        const fetchSlots = async () => {
            setLoadingSlots(true)
            try {
                const dateStr = format(date, 'yyyy-MM-dd')
                const res = await fetch(`/api/booking/availability?roomId=${roomId}&date=${dateStr}`)
                const data = await res.json()
                setBookedSlots(data.bookedSlots || [])
            } catch (error) {
                console.error('Error fetching slots:', error)
                setBookedSlots([]) // Reset on error too
            } finally {
                setLoadingSlots(false)
            }
        }

        fetchSlots()
    }, [date, roomId])

    // Calculate price when times change
    useEffect(() => {
        if (!startTime || !endTime) {
            setPriceInfo(null)
            return
        }

        const duration = calculateDuration(startTime, endTime)
        if (duration <= 0) {
            setPriceInfo(null)
            return
        }

        const fetchPrice = async () => {
            setLoadingPrice(true)
            try {
                const res = await fetch('/api/booking/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serviceType,
                        durationMinutes: duration,
                        guests,
                    }),
                })
                const data = await res.json()
                setPriceInfo(data)
            } catch (error) {
                console.error('Error calculating price:', error)
            } finally {
                setLoadingPrice(false)
            }
        }

        fetchPrice()
    }, [startTime, endTime, guests, serviceType])

    // Filter end time options based on start time
    const endTimeOptions = timeSlots.filter(t => t > startTime)

    const handleSubmit = () => {
        if (!date || !startTime || !endTime || !customerName || !customerPhone) return

        onSubmit({
            date,
            startTime,
            endTime,
            guests,
            customerName,
            customerPhone,
            customerEmail: customerEmail || undefined,
            note: note || undefined,
        })
    }

    // Check if selected range overlaps with booked slots
    const hasOverlap = isRangeOverlapping(startTime, endTime, bookedSlots)

    const isValid = date && startTime && endTime && customerName && customerPhone && priceInfo && !hasOverlap

    return (
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
            {/* Date Selection */}
            <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Chọn ngày
                </label>
                <div className="relative">
                    <DatePicker
                        selected={date}
                        onChange={(d) => setDate(d)}
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}
                        locale="vi"
                        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 pl-11 text-neutral-900 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        placeholderText="Chọn ngày"
                        wrapperClassName="w-full"
                        calendarClassName="!border !border-neutral-200 !rounded-xl !shadow-xl !p-4 !bg-white dark:!bg-neutral-900 dark:!border-neutral-700 font-sans"
                        renderCustomHeader={(props) => <DatePickerCustomHeaderSingleMonth {...props} />}
                        renderDayContents={(day, date) => <DatePickerCustomDay dayOfMonth={day} date={date} />}
                    />
                    <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                </div>
            </div>

            {/* Time Selection */}
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Giờ bắt đầu
                    </label>
                    <TimeSelect
                        value={startTime}
                        onChange={(value) => {
                            setStartTime(value)
                            setEndTime('')
                        }}
                        options={timeSlots.map(time => ({
                            value: time,
                            label: time,
                            disabled: isTimeSlotBooked(time, bookedSlots)
                        }))}
                        placeholder="Chọn giờ bắt đầu"
                        disabled={!date || loadingSlots}
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Giờ kết thúc
                    </label>
                    <TimeSelect
                        value={endTime}
                        onChange={setEndTime}
                        options={endTimeOptions.map(time => ({
                            value: time,
                            label: time,
                            disabled: isTimeSlotBooked(time, bookedSlots)
                        }))}
                        placeholder="Chọn giờ kết thúc"
                        disabled={!startTime}
                    />
                </div>
            </div>

            {/* Guests (for Meeting) */}
            {isMeeting && (
                <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Số người tham gia
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={guests}
                            onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 pl-11 text-neutral-900 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                        <UsersIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                        {guests < 8 ? '< 8 người: 80,000đ/giờ' : '≥ 8 người: 100,000đ/giờ'}
                    </p>
                </div>
            )}

            {/* Customer Info */}
            <div className="border-t border-neutral-200 pt-6 dark:border-neutral-700">
                <h3 className="mb-4 font-semibold text-neutral-900 dark:text-white">
                    Thông tin người đặt
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Họ và tên *
                        </label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                            placeholder="Nhập họ tên"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Số điện thoại *
                        </label>
                        <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                            placeholder="0901234567"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Email
                        </label>
                        <input
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                            placeholder="email@example.com"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Ghi chú
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                            placeholder="Ghi chú (nếu có)"
                        />
                    </div>
                </div>
            </div>

            {/* Price Summary */}
            {priceInfo && (
                <div className="rounded-xl bg-primary-50 p-4 dark:bg-primary-900/10">
                    <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Tạm tính:</span>
                        <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {new Intl.NumberFormat('vi-VN').format(priceInfo.estimatedAmount)}đ
                        </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-primary-200 pt-2 dark:border-primary-800">
                        <span className="font-medium text-primary-700 dark:text-primary-300">Đặt cọc (50%):</span>
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {new Intl.NumberFormat('vi-VN').format(priceInfo.depositAmount)}đ
                        </span>
                    </div>
                    {priceInfo.nerdCoinReward > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-yellow-700 dark:text-yellow-400">
                            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">N</text>
                            </svg>
                            Nhận {priceInfo.nerdCoinReward} Nerd Coin khi check-in
                        </div>
                    )}
                </div>
            )}

            {/* Overlap Warning */}
            {hasOverlap && (
                <div className="rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    ⚠️ Khung giờ bạn chọn trùng với lịch đã đặt. Vui lòng chọn khung giờ khác.
                </div>
            )}

            {/* Submit Button */}
            <div className="border-t border-neutral-200 pt-6 dark:border-neutral-700">
                <Button
                    onClick={handleSubmit}
                    disabled={!isValid || loading || loadingPrice}
                    className="w-full"
                >
                    {loading ? 'Đang xử lý...' : 'Thanh toán cọc & Giữ phòng'}
                </Button>
                <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
                    Phòng sẽ được giữ sau khi bạn thanh toán cọc 50%
                </p>
            </div>
        </div>
    )
}
