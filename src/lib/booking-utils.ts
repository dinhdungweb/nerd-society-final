import { prisma } from './prisma'
import { format } from 'date-fns'

/**
 * Generate mã booking: NERD-YYYYMMDD-XXX
 */
export async function generateBookingCode(date: Date): Promise<string> {
    const dateStr = format(date, 'yyyyMMdd')
    const prefix = `NERD-${dateStr}`

    // Đếm số booking trong ngày để tạo số thứ tự
    const count = await prisma.booking.count({
        where: {
            bookingCode: {
                startsWith: prefix,
            },
        },
    })

    const suffix = (count + 1).toString().padStart(3, '0')
    return `${prefix}-${suffix}`
}

/**
 * Parse time string "HH:MM" thành phút từ đầu ngày
 */
export function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

/**
 * Thêm phút vào time string
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
    const totalMinutes = parseTimeToMinutes(time) + minutesToAdd
    const hours = Math.floor(totalMinutes / 60) % 24
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Tính duration giữa 2 time strings (phút)
 */
export function calculateDuration(startTime: string, endTime: string): number {
    const startMinutes = parseTimeToMinutes(startTime)
    const endMinutes = parseTimeToMinutes(endTime)
    return endMinutes - startMinutes
}

/**
 * Kiểm tra slot có trống không
 * @returns true nếu slot available
 */
export async function isSlotAvailable(
    roomId: string,
    date: Date,
    startTime: string,
    endTime: string
): Promise<boolean> {
    // Normalize date (chỉ lấy ngày, không có giờ)
    const bookingDate = new Date(date)
    bookingDate.setHours(0, 0, 0, 0)

    // Tìm booking trùng thời gian
    const conflictingBooking = await prisma.booking.findFirst({
        where: {
            roomId,
            date: bookingDate,
            status: {
                notIn: ['CANCELLED', 'NO_SHOW'],
            },
            // Overlap check: slot mới không được overlap với slot đã book
            // A overlaps B if: A.start < B.end AND A.end > B.start
            OR: [
                {
                    // Slot mới bắt đầu trong khoảng slot cũ
                    AND: [
                        { startTime: { lte: startTime } },
                        { endTime: { gt: startTime } },
                    ],
                },
                {
                    // Slot mới kết thúc trong khoảng slot cũ
                    AND: [
                        { startTime: { lt: endTime } },
                        { endTime: { gte: endTime } },
                    ],
                },
                {
                    // Slot mới bao trùm slot cũ
                    AND: [
                        { startTime: { gte: startTime } },
                        { endTime: { lte: endTime } },
                    ],
                },
            ],
        },
    })

    return !conflictingBooking
}

/**
 * Lấy danh sách slot đã book trong ngày
 * @param roomId - ID của phòng
 * @param dateStr - Ngày theo format YYYY-MM-DD (sẽ được parse như UTC midnight)
 */
export async function getBookedSlots(roomId: string, dateStr: string) {
    // Parse dateStr as UTC midnight to match how dates are stored in DB
    // DB stores dates as UTC midnight (e.g., "2025-12-15T00:00:00.000Z")
    // So we need to query with exact UTC midnight
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`)

    console.log('[DEBUG getBookedSlots]', {
        roomId,
        dateStr,
        targetDate: targetDate.toISOString(),
    })

    const bookings = await prisma.booking.findMany({
        where: {
            roomId,
            date: targetDate, // Exact match with UTC midnight
            status: {
                notIn: ['CANCELLED', 'NO_SHOW'],
            },
        },
        select: {
            startTime: true,
            endTime: true,
        },
        orderBy: {
            startTime: 'asc',
        },
    })

    console.log('[DEBUG getBookedSlots] Found bookings:', bookings)

    return bookings
}

/**
 * Operating hours mặc định
 */
export const OPERATING_HOURS = {
    open: '08:00',
    close: '22:00',
} as const

/**
 * Combine Date and Time string (HH:mm) into Date object
 */
export function getBookingDateTime(date: Date | string, time: string): Date {
    const dateTime = new Date(date)
    const [hours, minutes] = time.split(':').map(Number)
    dateTime.setHours(hours, minutes, 0, 0)
    return dateTime
}
