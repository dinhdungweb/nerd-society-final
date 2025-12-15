import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string
    subject: string
    html: string
}) {
    try {
        // Skip if SMTP is not configured or using placeholder values
        if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your-email')) {
            console.log('⚠️ Email SMTP not configured. Skipping email:', { to, subject })
            return
        }

        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Nerd Society" <no-reply@nerdsociety.com.vn>',
            to,
            subject,
            html,
        })
        console.log('✅ Email sent to:', to)
    } catch (error) {
        console.error('❌ Email error:', error)
    }
}

export async function sendBookingEmail(booking: any) {
    console.log('📧 Sending email for booking:', booking.bookingCode, {
        status: booking.status,
        paymentMethod: booking.payment?.method,
        paymentStatus: booking.payment?.status
    })

    // Determine recipient email - prefer user email, fallback to customerEmail
    const recipientEmail = booking.user?.email || booking.customerEmail
    if (!recipientEmail) {
        console.log('⚠️ No email address found for booking:', booking.bookingCode)
        return
    }

    // Get name - prefer user name, fallback to customerName
    const customerName = booking.user?.name || booking.customerName || 'Quý khách'

    // Get service name - prefer room, fallback to combo (for backward compatibility)
    const serviceName = booking.room?.name || booking.combo?.name || 'Dịch vụ'

    // Get amount - prefer estimatedAmount, fallback to totalAmount
    const amount = booking.estimatedAmount || booking.totalAmount || 0

    const isConfirmed = booking.status === 'CONFIRMED'

    let description = 'Chúng tôi đã nhận được yêu cầu đặt lịch của bạn. Vui lòng thanh toán để hoàn tất.'
    if (isConfirmed) {
        if (booking.payment?.method === 'CASH') {
            description = 'Đặt lịch của bạn đã được xác nhận. Vui lòng thanh toán tại quầy khi đến.'
        } else {
            description = 'Cảm ơn bạn đã thanh toán. Đặt lịch của bạn đã được xác nhận.'
        }
    }

    const subject = isConfirmed
        ? `[Nerd Society] Xác nhận đặt lịch #${booking.bookingCode}`
        : `[Nerd Society] Tiếp nhận đặt lịch #${booking.bookingCode}`

    const html = `
    <div style="font-family: sans-serif; max-w-600px; margin: 0 auto;">
      <h1 style="color: #4f46e5;">${isConfirmed ? 'Đặt lịch thành công!' : 'Đã nhận yêu cầu đặt lịch'}</h1>
      <p>Xin chào ${customerName},</p>
      <p>${description}</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Thông tin chi tiết:</h3>
        <p><strong>Mã đặt lịch:</strong> ${booking.bookingCode}</p>
        <p><strong>Cơ sở:</strong> ${booking.location?.name || 'N/A'}</p>
        <p><strong>Dịch vụ:</strong> ${serviceName}</p>
        <p><strong>Thời gian:</strong> ${new Date(booking.date).toLocaleDateString('vi-VN')} | ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</p>
      </div>

      <p>Bạn có thể xem chi tiết và quản lý đặt lịch tại:</p>
      <a href="${process.env.NEXTAUTH_URL}/profile/bookings/${booking.id}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Xem chi tiết</a>
      
      <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">Nerd Society - Study & Work Space</p>
    </div>
  `

    await sendEmail({ to: recipientEmail, subject, html })
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    const subject = '[Nerd Society] Yêu cầu đặt lại mật khẩu'

    const html = `
    <div style="font-family: sans-serif; max-w-600px; margin: 0 auto;">
      <h1 style="color: #4f46e5;">Đặt lại mật khẩu</h1>
      <p>Xin chào,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Nerd Society của bạn.</p>
      <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu (đường dẫn có hiệu lực trong 1 giờ):</p>
      
      <div style="text-align: left; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Đặt lại mật khẩu</a>
      </div>

      <p>Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.</p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">Nerd Society - Study & Work Space</p>
    </div>
  `

    await sendEmail({ to: email, subject, html })
}
