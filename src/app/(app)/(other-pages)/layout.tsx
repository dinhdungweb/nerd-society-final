import Header from '@/components/Header/Header'
import { Metadata } from 'next'
import { ApplicationLayout } from '../application-layout'

export const metadata: Metadata = {
  title: 'Nerd Society',
  description:
    'Nerd Society - Không gian làm việc và học tập chuyên nghiệp dành cho bạn. Đặt phòng họp, pod làm việc nhanh chóng.',
  keywords: ['Nerd Society', 'Coworking', 'Booking', 'Meeting Room', 'Pod', 'Study Space'],
}

export default function Layout({ children, params }: { children: React.ReactNode; params: any }) {
  return <ApplicationLayout header={<Header hasBorderBottom={true} />}>{children}</ApplicationLayout>
}
