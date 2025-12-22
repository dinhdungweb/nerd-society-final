import FooterNerd from '@/components/landing/FooterNerd'
import HeaderNerd from '@/components/landing/HeaderNerd'
import { prisma } from '@/lib/prisma'

async function getSettings() {
    try {
        const settings = await prisma.setting.findMany()
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, string>)
    } catch (error) {
        return {}
    }
}

export default async function BookingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getSettings()

    return (
        <>
            <HeaderNerd logoUrl={settings.siteLogo} logoLightUrl={settings.siteLogoLight} />
            <main className="pt-20">
                {children}
            </main>
            <FooterNerd logoUrl={settings.siteLogoLight || settings.siteLogo} />
        </>
    )
}
