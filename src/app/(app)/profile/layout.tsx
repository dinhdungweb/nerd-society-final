import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ProfileSidebar from '@/components/profile/ProfileSidebar'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="bg-neutral-50 min-h-screen py-10 dark:bg-neutral-950">
            <div className="container max-w-[100rem]">
                <h1 className="mb-8 text-3xl font-bold text-neutral-900 dark:text-white">
                    Tài khoản của tôi
                </h1>
                <div className="grid gap-8 lg:grid-cols-4">
                    {/* Sidebar */}
                    <div className="space-y-1 lg:col-span-1">
                        <ProfileSidebar />
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
