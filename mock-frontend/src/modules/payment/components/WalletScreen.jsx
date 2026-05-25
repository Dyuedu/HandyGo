import { getWalletBalance, getWalletHistory, createWallet } from '../../../services/paymentService.js'
import { useState, useEffect } from 'react'
import { AppIcon } from '../../../components/AppIcon.jsx'
import { useLanguage } from '../../../i18n/LanguageContext.jsx'
import { formatCoins as formatCoinsValue, formatDateTime } from '../../../i18n/formatters.js'
import '../../../styles/pages/WalletScreen.css'

export function WalletScreen() {
  const { language, t } = useLanguage()
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

  return (
    <div className="wallet-screen">
      <div className="wallet-hero">
        <h1>{t('wallet.title')}</h1>
        <p>{t('wallet.description')}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
      </div>
    </div>
  )
}

export default WalletScreen
