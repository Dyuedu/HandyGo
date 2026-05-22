import { getWalletBalance, getWalletHistory, createWallet } from '../../../services/paymentService.js'
import { useState, useEffect } from 'react'
import { AppIcon } from '../../../components/AppIcon.jsx'
import '../../../styles/pages/WalletScreen.css'

export function WalletScreen() {
  const [balance, setBalance] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWalletData()
  }, [])

  const loadWalletData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to get balance, if wallet doesn't exist, create it
      try {
        const balanceData = await getWalletBalance()
        setBalance(balanceData.balance)
      } catch (err) {
        if (err.status === 404 || err.status === 500) {
          // Wallet doesn't exist, create it
          const walletData = await createWallet()
          setBalance(walletData.balance)
        } else {
          throw err
        }
      }

      // Load transaction history
      try {
        const historyData = await getWalletHistory()
        setHistory(historyData || [])
      } catch (err) {
        console.error('Không thể tải lịch sử giao dịch:', err)
      }
    } catch (err) {
      console.error('Không thể tải dữ liệu ví:', err)
      setError('Không thể tải dữ liệu ví. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('vi-VN')
  }

  return (
    <div className="wallet-screen">
      <div className="wallet-hero">
        <h1>Ví tiền của bạn</h1>
        <p>Quản lý số dư ví và lịch sử giao dịch</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="wallet-container">
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-header">
            <h2>Số dư hiện tại</h2>
            <button className="refresh-btn" type="button" onClick={loadWalletData} title="Làm mới" aria-label="Làm mới ví">
              <AppIcon name="refresh" size={20} />
            </button>
          </div>
          <div className="balance-amount">
            {loading && !balance ? (
              <span className="loading">Đang tải...</span>
            ) : (
              formatCurrency(balance)
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="history-card">
          <h3>Lịch sử giao dịch</h3>
          {history.length === 0 ? (
            <p className="no-history">Chưa có giao dịch nào</p>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Ngày giờ</th>
                    <th>Mã giao dịch</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((transaction) => (
                    <tr key={transaction.id} className={`status-${transaction.status?.toLowerCase()}`}>
                      <td>{formatDate(transaction.createdAt)}</td>
                      <td className="txn-ref">{transaction.vnpTxnRef}</td>
                      <td className="amount">{formatCurrency(transaction.amount)}</td>
                      <td>
                        <span className={`status-badge status-${transaction.status?.toLowerCase()}`}>
                          {transaction.status === 'SUCCESS' ? 'Thành công' : 
                           transaction.status === 'FAILED' ? 'Thất bại' : 
                           'Chờ xử lý'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletScreen
