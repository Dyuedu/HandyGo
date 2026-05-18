import { authMessages } from '../../../constants/authMessages'
import './AuthSessionBar.css'

export function AuthSessionBar({ session, submitting, onLogout }) {
  if (!session) return null

  return (
    <div className="session-bar">
      <div>
        <strong>Phiên đang hoạt động</strong>
        {session.workerVerificationStatus && (
          <span>{session.workerVerificationStatus === 'PENDING' ? authMessages.workerPending : 'Hồ sơ thợ đã xác minh'}</span>
        )}
      </div>
      <button type="button" className="secondary" onClick={onLogout} disabled={submitting}>
        Đăng xuất
      </button>
    </div>
  )
}
