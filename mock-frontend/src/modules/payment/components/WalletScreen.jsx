import { getWalletBalance, topUpWallet, getWalletHistory, createWallet } from '../../../services/paymentService.js'
import { useState, useEffect } from 'react'
import '../../../styles/pages/WalletScreen.css'

export function WalletScreen() {
  const [balance, setBalance] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

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
        if (err.response?.status === 404 || err.response?.status === 500) {
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
        console.error('Failed to load history:', err)
      }
    } catch (err) {
      console.error('Error loading wallet data:', err)
      setError('Failed to load wallet data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTopup = async () => {
    try {
      setError(null)
      setSuccessMessage(null)

      if (!topupAmount || parseFloat(topupAmount) <= 0) {
        setError('Please enter a valid amount')
        return
      }

      setLoading(true)
      const response = await topUpWallet(
        parseFloat(topupAmount),
        'Wallet deposit',
        bankCode || null
      )

      if (response.paymentUrl) {
        setSuccessMessage('Redirecting to VNPay payment...')
        // Redirect to VNPay payment page
        window.location.href = response.paymentUrl
      }
    } catch (err) {
      console.error('Error initiating topup:', err)
      setError(err.response?.data?.message || 'Failed to initiate payment')
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
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="wallet-container">
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-header">
            <h2>Số dư hiện tại</h2>
            <span className="refresh-btn" onClick={loadWalletData} title="Refresh">↻</span>
          </div>
          <div className="balance-amount">
            {loading && !balance ? (
              <span className="loading">Loading...</span>
            ) : (
              formatCurrency(balance)
            )}
          </div>
        </div>

        {/* Top-up Form */}
        <div className="topup-card">
          <h3>Nạp tiền vào ví</h3>
          <div className="form-group">
            <label htmlFor="amount">Số tiền (VND)</label>
            <input
              id="amount"
              type="number"
              min="10000"
              step="10000"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="Enter amount (minimum 10,000 VND)"
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bankCode">Chọn ngân hàng (tùy chọn)</label>
            <select
              id="bankCode"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="form-input"
              disabled={loading}
            >
              <option value="">Để VNPay chọn</option>
              <option value="NCB">Ngân hàng Ngoại Thương (NCB)</option>
              <option value="AGRIBANK">Ngân hàng Nông nghiệp</option>
              <option value="SCB">Ngân hàng Sài Gòn</option>
              <option value="SACOMBANK">Ngân hàng Sài Gòn Thương Tín</option>
              <option value="TECHCOMBANK">Techcombank</option>
              <option value="VPBANK">Ngân hàng VP</option>
              <option value="JPMORGANCHASE">JP Morgan Chase</option>
              <option value="ICBC">ICBC</option>
              <option value="HSBC">HSBC</option>
            </select>
          </div>

          <div className="topup-quick-amounts">
            <h4>Nạp nhanh</h4>
            <div className="quick-amounts">
              {[100000, 200000, 500000, 1000000].map((amount) => (
                <button
                  key={amount}
                  className="quick-amount-btn"
                  onClick={() => setTopupAmount(amount.toString())}
                  disabled={loading}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
          </div>

          <button
            className="topup-btn"
            onClick={handleTopup}
            disabled={loading || !topupAmount}
          >
            {loading ? 'Processing...' : 'Nạp tiền qua VNPay'}
          </button>
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
