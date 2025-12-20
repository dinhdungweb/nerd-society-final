import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(req: Request) {
    try {
        const settings = await prisma.setting.findMany()
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, string>)

        return NextResponse.json(settingsMap)
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const updates = Object.entries(body).map(([key, value]) => {
            return prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            })
        })

        await Promise.all(updates)

        revalidatePath('/')
        revalidatePath('/(app)/(home-pages)', 'page') // Try specific path just in case

        return NextResponse.json({ message: 'Settings updated successfully' })
    } catch (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}
