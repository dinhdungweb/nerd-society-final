'use client'

import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { ServiceType } from '@prisma/client'
import clsx from 'clsx'

interface Service {
    id: string
    name: string
    slug: string
    type: ServiceType
    description?: string | null
    priceSmall?: number | null        // Meeting < 8 người
    priceLarge?: number | null        // Meeting >= 8 người
    priceFirstHour?: number | null    // Pod giờ đầu
    pricePerHour?: number | null      // Pod từ giờ 2
    nerdCoinReward: number
    minDuration: number
    timeStep: number
    features: string[]
    icon?: string | null
}

interface ServiceSelectorProps {
    services: Service[]
    selectedServiceType: ServiceType | null
    onSelect: (service: Service) => void
}

const serviceIcons: Record<ServiceType, React.ReactNode> = {
    MEETING: (
        <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    POD_MONO: (
        <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    POD_MULTI: (
        <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function getPriceDisplay(service: Service): string {
    if (service.type === 'MEETING') {
        return `${formatPrice(service.priceSmall || 0)}đ - ${formatPrice(service.priceLarge || 0)}đ/giờ`
    }
    return `${formatPrice(service.priceFirstHour || 0)}đ giờ đầu`
}

function getSubtitle(service: Service): string {
    switch (service.type) {
        case 'MEETING':
            return 'Phòng họp nhóm 6-20 người'
        case 'POD_MONO':
            return 'Pod làm việc cá nhân'
        case 'POD_MULTI':
            return 'Pod làm việc 2 người'
        default:
            return ''
    }
}

export default function ServiceSelector({
    services,
    selectedServiceType,
    onSelect,
}: ServiceSelectorProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
                const isSelected = selectedServiceType === service.type
                return (
                    <div
                        key={service.id}
                        onClick={() => onSelect(service)}
                        className={clsx(
                            'group relative cursor-pointer overflow-hidden rounded-xl border-2 p-6 transition-all',
                            isSelected
                                ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/10'
                                : 'border-transparent bg-white shadow-sm hover:border-primary-200 hover:shadow-md dark:bg-neutral-900 dark:hover:border-primary-800'
                        )}
                    >
                        {/* Icon */}
                        <div className={clsx(
                            'mb-4 inline-flex rounded-xl p-3 transition-colors',
                            isSelected
                                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        )}>
                            {serviceIcons[service.type]}
                        </div>

                        {/* Selected indicator */}
                        {isSelected && (
                            <div className="absolute right-4 top-4">
                                <CheckCircleIcon className="size-6 text-primary-500" />
                            </div>
                        )}

                        {/* Title & Subtitle */}
                        <h3 className={clsx(
                            'text-lg font-semibold transition-colors',
                            isSelected
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-neutral-900 dark:text-white'
                        )}>
                            {service.name}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {getSubtitle(service)}
                        </p>

                        {/* Price */}
                        <div className="mt-4 flex items-center gap-1.5 text-base font-bold text-primary-600 dark:text-primary-400">
                            <CurrencyDollarIcon className="size-5" />
                            {getPriceDisplay(service)}
                        </div>

                        {/* Nerd Coin badge */}
                        {service.nerdCoinReward > 0 && (
                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                🪙 +{service.nerdCoinReward} Nerd Coin
                            </div>
                        )}

                        {/* Features */}
                        {service.features.length > 0 && (
                            <ul className="mt-4 space-y-1.5">
                                {service.features.slice(0, 3).map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                                        <span className="size-1 rounded-full bg-primary-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
