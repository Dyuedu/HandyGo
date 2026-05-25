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

const VIETQR_BANKS = [
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970422', name: 'MBBank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970426', name: 'MSB' },
  { bin: '970448', name: 'OCB' },
  { bin: '970440', name: 'SeABank' },
  { bin: '970449', name: 'LPBank' },
  { bin: '970412', name: 'PVcomBank' },
  { bin: '970428', name: 'Nam A Bank' }
]

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
    if (status === 'COMPLETED') return t('wallet.withdraw.status.completed')
    if (status === 'REJECTED') return t('wallet.withdraw.status.rejected')
    return t('wallet.withdraw.status.pending')
  }

  const handleWithdrawChange = (event) => {
    const { name, value } = event.target
    setWithdrawForm((current) => ({ ...current, [name]: value }))
  }

  const handleBankChange = (event) => {
    const bank = VIETQR_BANKS.find((item) => item.bin === event.target.value)
    setWithdrawForm((current) => ({
      ...current,
      bankBin: bank?.bin || '',
      bankName: bank?.name || ''
    }))
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
      setSuccessMessage(t('wallet.withdraw.success'))
      await loadWalletData()
    } catch (err) {
      console.error('Không thể tạo yêu cầu rút tiền:', err)
      setError(err.message || t('wallet.withdraw.submitError'))
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
          <h3>{t('wallet.withdraw.title')}</h3>
          <form className="withdraw-form" onSubmit={handleWithdrawSubmit}>
            <label>
              <span>{t('wallet.withdraw.amount')}</span>
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
              <span>{t('wallet.withdraw.bank')}</span>
              <select
                name="bankBin"
                value={withdrawForm.bankBin}
                onChange={handleBankChange}
                required
              >
                <option value="">{t('wallet.withdraw.chooseBank')}</option>
                {VIETQR_BANKS.map((bank) => (
                  <option key={bank.bin} value={bank.bin}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {withdrawForm.bankBin && (
                <small className="bank-bin-preview">{t('wallet.withdraw.bankBin', { bin: withdrawForm.bankBin })}</small>
              )}
            </label>
            <label>
              <span>{t('wallet.withdraw.accountNo')}</span>
              <input
                type="text"
                name="accountNo"
                value={withdrawForm.accountNo}
                onChange={handleWithdrawChange}
                required
              />
            </label>
            <label>
              <span>{t('wallet.withdraw.accountName')}</span>
              <input
                type="text"
                name="accountName"
                value={withdrawForm.accountName}
                onChange={handleWithdrawChange}
                placeholder={t('wallet.withdraw.accountNamePlaceholder')}
                required
              />
            </label>
            <button className="withdraw-submit" type="submit" disabled={submittingWithdrawal}>
              {submittingWithdrawal ? t('wallet.withdraw.submitting') : t('wallet.withdraw.submit')}
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
          <h3>{t('wallet.withdraw.requestsTitle')}</h3>
          {withdrawals.length === 0 ? (
            <p className="no-history">{t('wallet.withdraw.empty')}</p>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>{t('wallet.date')}</th>
                    <th>{t('wallet.amount')}</th>
                    <th>{t('wallet.withdraw.bank')}</th>
                    <th>{t('wallet.withdraw.transferContent')}</th>
                    <th>{t('wallet.status')}</th>
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
