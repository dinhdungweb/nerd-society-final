import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

// GET /api/admin/bookings/[id]
export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                location: true,
                room: true,
                payment: true,
            }
        })

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Add calculated fields or transformations if needed
        // e.g. service type normalized
        let serviceType: any = 'MEETING'
        if (booking.room.type === 'POD_MONO') serviceType = 'POD_MONO'
        if (booking.room.type === 'POD_MULTI') serviceType = 'POD_MULTI'

        const response = {
            ...booking,
            serviceType,
            // Fallback for combo field if frontend still expects it (not needed for admin specific views usually)
            // But let's keep clean.
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error fetching booking detail:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH /api/admin/bookings/[id]
export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params
        const body = await req.json()
        const {
            customerName,
            customerPhone,
            customerEmail,
            note,
            // Future: support changing room/time
        } = body

        if (!id) {
            return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 })
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                customerName,
                customerPhone,
                customerEmail,
                note,
            }
        })

        return NextResponse.json(updatedBooking)

    } catch (error) {
        console.error('Error updating booking:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
