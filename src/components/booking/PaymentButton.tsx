'use client'


import { Button } from '@/shared/Button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PaymentButtonProps {
    bookingId: string
    amount: number
}

export default function PaymentButton({ bookingId, amount }: PaymentButtonProps) {
    const [loading, setLoading] = useState(false)
    const paymentMethod = 'VNPAY' // Only VNPAY available for online bookings
    const router = useRouter()

    const handlePayment = async () => {
        setLoading(true)
        try {
            if (paymentMethod === 'VNPAY') {
                const res = await fetch('/api/payment/vnpay/create-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookingId }),
                })

                const data = await res.json()
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl
                } else {
                    alert('Lỗi tạo thanh toán')
                }
            } else {
                // Pay at counter - update payment method to CASH and confirm booking
                const res = await fetch('/api/payment/cash', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookingId }),
                })

                if (res.ok) {
                    router.push(`/booking/success?id=${bookingId}&payment=cash`)
                    router.refresh()
                } else {
                    alert('Lỗi xử lý thanh toán')
                }
            }
        } catch (error) {
            console.error(error)
            alert('Đã xảy ra lỗi')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
                <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Chọn phương thức thanh toán:
                </p>
                <div className="space-y-2">
                    <label className="flex items-center justify-between rounded-lg border border-primary-500 bg-white p-3 shadow-sm dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <input type="radio" name="payment" checked readOnly className="text-primary-500 focus:ring-primary-500" />
                            <span className="font-medium text-neutral-900 dark:text-white">VNPay</span>
                        </div>
                        <img src="https://vnpay.vn/assets/images/logo-icon/logo-primary.svg" alt="VNPay" className="h-6" />
                    </label>

                    {/* MoMo - Coming soon */}
                    <label className="flex cursor-not-allowed items-center justify-between rounded-lg border border-neutral-200 bg-neutral-100 p-3 opacity-60 dark:border-neutral-700 dark:bg-neutral-800">
                        <div className="flex items-center gap-3">
                            <input type="radio" name="payment" disabled className="text-neutral-400" />
                            <span className="font-medium text-neutral-500">MoMo (Sắp có)</span>
                        </div>
                        <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" className="h-6 opacity-50" />
                    </label>
                </div>
            </div>

            <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full justify-center"
            >
                {loading ? 'Đang xử lý...' : `Thanh toán ${new Intl.NumberFormat('vi-VN').format(amount)}đ`}
            </Button>
        </div>
    )
}

