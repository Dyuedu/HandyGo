import { useAuth } from '../hooks/useAuth'
import './DashboardHome.css'

const content = {
  Home: {
    customerTitle: 'Home Map',
    technicianTitle: 'Home Jobs',
    description: 'Khu vực chính thay đổi theo role thật của Account sau khi đăng nhập.',
  },
  Activity: {
    customerTitle: 'Activity',
    technicianTitle: 'Activity',
    description: 'Theo dõi lịch sử đặt lịch, trạng thái công việc và các cập nhật mới nhất.',
  },
  Chat: {
    customerTitle: 'Chat',
    technicianTitle: 'Chat',
    description: 'Không gian nhắn tin giữa khách hàng và thợ.',
  },
  Wallet: {
    customerTitle: 'Wallet',
    technicianTitle: 'Wallet · Voucher/Thu nhập',
    description: 'Theo dõi thu nhập, ví tiền và voucher dành cho worker.',
  },
  Profile: {
    customerTitle: 'Profile',
    technicianTitle: 'Profile',
    description: 'Quản lý thông tin cá nhân và trạng thái xác minh.',
  },
}

export function DashboardHome({ section = 'Home' }) {
  const { mode } = useAuth()
  const page = content[section] || content.Home
  const title = mode === 'TECHNICIAN' ? page.technicianTitle : page.customerTitle

  return (
    <section className="dashboard-surface">
      <div className="dashboard-hero">
        <p>{mode === 'TECHNICIAN' ? 'Worker mode' : 'User mode'}</p>
        <h1>{title}</h1>
        <span>{page.description}</span>
      </div>

      <div className="dashboard-grid">
        <article>
          <strong>Trạng thái</strong>
          <span>Sẵn sàng tích hợp module business.</span>
        </article>
        <article>
          <strong>Role hiện tại</strong>
          <span>{mode}</span>
        </article>
        <article>
          <strong>Module</strong>
          <span>{section}</span>
        </article>
      </div>
    </section>
  )
}
