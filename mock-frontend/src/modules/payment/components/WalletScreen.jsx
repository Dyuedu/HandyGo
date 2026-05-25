import {
  getWalletBalance,
  getWalletHistory,
  createWallet,
  createWithdrawalRequest,
  getWithdrawalRequests
} from '../../../services/paymentService.js'
import { useState, useEffect } from 'react'
import { AppIcon } from '../../../components/AppIcon.jsx'
import { useLanguage } from '../../../i18n/LanguageContext.jsx'
import { formatCoins as formatCoinsValue, formatDateTime } from '../../../i18n/formatters.js'
import '../../../styles/pages/WalletScreen.css'

export function WalletScreen() {
  const { language, t } = useLanguage()
  const [balance, setBalance] = useState(null)
  const [history, setHistory] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bankBin: '',
    bankName: '',
    accountNo: '',
    accountName: ''
  })
  const [loading, setLoading] = useState(false)
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

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

      try {
        const withdrawalData = await getWithdrawalRequests()
        setWithdrawals(withdrawalData || [])
      } catch (err) {
        console.error('Không thể tải yêu cầu rút tiền:', err)
      }
    } catch (err) {
      console.error('Không thể tải dữ liệu ví:', err)
      setError(t('wallet.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const formatCoins = (value) => {
    return formatCoinsValue(value, language, t('wallet.coinUnit'))
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return formatDateTime(dateString, language, '')
  }

  const withdrawalStatusLabel = (status) => {
    if (status === 'COMPLETED') return 'Đã chuyển'
    if (status === 'REJECTED') return 'Từ chối'
    return 'Đang chờ'
  }

  const handleWithdrawChange = (event) => {
    const { name, value } = event.target
    setWithdrawForm((current) => ({ ...current, [name]: value }))
  }

  const handleWithdrawSubmit = async (event) => {
    event.preventDefault()
    setSubmittingWithdrawal(true)
    setError(null)
    setSuccessMessage('')

    try {
      await createWithdrawalRequest({
        ...withdrawForm,
        amount: Number(withdrawForm.amount)
      })
      setWithdrawForm({
        amount: '',
        bankBin: '',
        bankName: '',
        accountNo: '',
        accountName: ''
      })
      setSuccessMessage('Đã tạo yêu cầu rút tiền. Số xu đã được khóa để admin xử lý.')
      await loadWalletData()
    } catch (err) {
      console.error('Không thể tạo yêu cầu rút tiền:', err)
      setError(err.message || 'Không thể tạo yêu cầu rút tiền')
    } finally {
      setSubmittingWithdrawal(false)
    }
  }

  return (
    <div className="wallet-screen">
      <div className="wallet-hero">
        <h1>{t('wallet.title')}</h1>
        <p>{t('wallet.description')}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="wallet-container">
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-header">
            <h2>{t('wallet.balance')}</h2>
            <button className="refresh-btn" type="button" onClick={loadWalletData} title={t('profile.refresh')} aria-label={t('wallet.refresh')}>
              <AppIcon name="refresh" size={20} />
            </button>
          </div>
          <div className="balance-amount">
            {loading && balance === null ? (
              <span className="loading">{t('common.loading')}</span>
            ) : (
              formatCoins(balance)
            )}
          </div>
          <p className="coin-rate">{t('wallet.rate')}</p>
        </div>

        <div className="withdraw-card">
          <h3>Rút xu về ngân hàng</h3>
          <form className="withdraw-form" onSubmit={handleWithdrawSubmit}>
            <label>
              <span>Số xu muốn rút</span>
              <input
                type="number"
                name="amount"
                min="1"
                step="1"
                value={withdrawForm.amount}
                onChange={handleWithdrawChange}
                required
              />
            </label>
            <label>
              <span>Ngân hàng</span>
              <input
                type="text"
                name="bankName"
                value={withdrawForm.bankName}
                onChange={handleWithdrawChange}
                placeholder="VD: Vietcombank"
                required
              />
            </label>
            <label>
              <span>BIN ngân hàng</span>
              <input
                type="text"
                name="bankBin"
                value={withdrawForm.bankBin}
                onChange={handleWithdrawChange}
                placeholder="VD: 970436"
                required
              />
            </label>
            <label>
              <span>Số tài khoản</span>
              <input
                type="text"
                name="accountNo"
                value={withdrawForm.accountNo}
                onChange={handleWithdrawChange}
                required
              />
            </label>
            <label>
              <span>Tên chủ tài khoản</span>
              <input
                type="text"
                name="accountName"
                value={withdrawForm.accountName}
                onChange={handleWithdrawChange}
                placeholder="NGUYEN VAN A"
                required
              />
            </label>
            <button className="withdraw-submit" type="submit" disabled={submittingWithdrawal}>
              {submittingWithdrawal ? 'Đang gửi...' : 'Tạo yêu cầu rút'}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="history-card">
          <h3>{t('wallet.history')}</h3>
          {history.length === 0 ? (
            <p className="no-history">{t('wallet.noHistory')}</p>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>{t('wallet.date')}</th>
                    <th>{t('wallet.transactionCode')}</th>
                    <th>{t('wallet.amount')}</th>
                    <th>{t('wallet.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((transaction) => (
                    <tr key={transaction.id} className={`status-${transaction.status?.toLowerCase()}`}>
                      <td>{formatDate(transaction.createdAt)}</td>
                      <td className="txn-ref">{transaction.vnpTxnRef}</td>
                      <td className="amount">{formatCoins(transaction.amount)}</td>
                      <td>
                        <span className={`status-badge status-${transaction.status?.toLowerCase()}`}>
                          {transaction.status === 'SUCCESS' ? t('status.SUCCESS') :
                           transaction.status === 'FAILED' ? t('status.FAILED') :
                           t('status.WAITING')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="history-card">
          <h3>Yêu cầu rút tiền</h3>
          {withdrawals.length === 0 ? (
            <p className="no-history">Chưa có yêu cầu rút tiền</p>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Ngày tạo</th>
                    <th>Số xu</th>
                    <th>Ngân hàng</th>
                    <th>Nội dung CK</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((request) => (
                    <tr key={request.id} className={`status-${request.status?.toLowerCase()}`}>
                      <td>{formatDate(request.createdAt)}</td>
                      <td className="amount">{formatCoins(request.amount)}</td>
                      <td>{request.bankName}</td>
                      <td className="txn-ref">{request.transferContent}</td>
                      <td>
                        <span className={`status-badge status-${request.status?.toLowerCase()}`}>
                          {withdrawalStatusLabel(request.status)}
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
