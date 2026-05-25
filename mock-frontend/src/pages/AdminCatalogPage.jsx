import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppIcon } from '../components/AppIcon'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDateTime as formatLocalizedDateTime, formatMoney } from '../i18n/formatters'
import {
  createAdminSubscriptionPlan,
  createAdminVoucher,
  getAdminSubscriptionPlans,
  getAdminVouchers,
} from '../services/adminService'
import '../styles/pages/AdminDashboard.css'
import '../styles/pages/AdminCatalogPage.css'

const initialPlanForm = {
  planName: '',
  price: '',
  durationDays: '30',
  status: 'ACTIVE',
}

const initialVoucherForm = {
  code: '',
  discountType: 'FIXED_AMOUNT',
  value: '',
  discountPercent: '',
  maxDiscountAmount: '',
  expiryDate: '',
  maxUses: '',
}

function toMoney(value, language) {
  if (value === null || value === undefined || value === '') return '-'
  return formatMoney(value, language)
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  return Number(value)
}

function toDateTimeOrNull(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

function normalizeVoucherPayload(form) {
  const isPercentage = form.discountType === 'PERCENTAGE'

  return {
    code: form.code.trim(),
    discountType: form.discountType,
    value: isPercentage ? null : toNumberOrNull(form.value),
    discountPercent: isPercentage ? toNumberOrNull(form.discountPercent) : null,
    maxDiscountAmount: isPercentage ? toNumberOrNull(form.maxDiscountAmount) : null,
    expiryDate: toDateTimeOrNull(form.expiryDate),
    maxUses: toNumberOrNull(form.maxUses),
  }
}

function normalizePlanPayload(form) {
  return {
    planName: form.planName.trim(),
    price: toNumberOrNull(form.price),
    durationDays: toNumberOrNull(form.durationDays),
    status: form.status,
  }
}

export function AdminCatalogPage() {
  const queryClient = useQueryClient()
  const { language, t } = useLanguage()
  const [planForm, setPlanForm] = useState(initialPlanForm)
  const [voucherForm, setVoucherForm] = useState(initialVoucherForm)
  const [planMessage, setPlanMessage] = useState('')
  const [voucherMessage, setVoucherMessage] = useState('')

  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansError,
  } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: getAdminSubscriptionPlans,
  })

  const {
    data: vouchers = [],
    isLoading: vouchersLoading,
    error: vouchersError,
  } = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: getAdminVouchers,
  })

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(a.price || 0) - Number(b.price || 0)),
    [plans],
  )

  const createPlanMutation = useMutation({
    mutationFn: createAdminSubscriptionPlan,
    onSuccess: () => {
      setPlanForm(initialPlanForm)
      setPlanMessage(t('catalog.planCreated'))
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
    },
    onError: (error) => {
      setPlanMessage(error.message || t('catalog.planCreateError'))
    },
  })

  const createVoucherMutation = useMutation({
    mutationFn: createAdminVoucher,
    onSuccess: () => {
      setVoucherForm(initialVoucherForm)
      setVoucherMessage(t('catalog.voucherCreated'))
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] })
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
    },
    onError: (error) => {
      setVoucherMessage(error.message || t('catalog.voucherCreateError'))
    },
  })

  const handlePlanSubmit = (event) => {
    event.preventDefault()
    setPlanMessage('')
    createPlanMutation.mutate(normalizePlanPayload(planForm))
  }

  const handleVoucherSubmit = (event) => {
    event.preventDefault()
    setVoucherMessage('')
    createVoucherMutation.mutate(normalizeVoucherPayload(voucherForm))
  }

  const updatePlanField = (field, value) => {
    setPlanForm((current) => ({ ...current, [field]: value }))
  }

  const updateVoucherField = (field, value) => {
    setVoucherForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="admin-catalog-page">
      <header className="admin-catalog-header">
        <div>
          <h1>{t('catalog.title')}</h1>
          <p>{t('catalog.description')}</p>
        </div>
      </header>

      <section className="catalog-grid">
        <form className="catalog-form" onSubmit={handlePlanSubmit}>
          <div className="catalog-form-title">
            <span className="catalog-title-icon">
              <AppIcon name="crown" size={22} />
            </span>
            <div>
              <h2>{t('catalog.createPlan')}</h2>
              <p>{t('catalog.planHint')}</p>
            </div>
          </div>

          <label>
            {t('catalog.planName')}
            <input
              value={planForm.planName}
              onChange={(event) => updatePlanField('planName', event.target.value)}
              placeholder={t('catalog.planPlaceholder')}
              required
            />
          </label>

          <div className="field-row">
            <label>
              {t('catalog.price')}
              <input
                type="number"
                min="0"
                value={planForm.price}
                onChange={(event) => updatePlanField('price', event.target.value)}
                placeholder="199000"
                required
              />
            </label>
            <label>
              {t('catalog.duration')}
              <input
                type="number"
                min="1"
                value={planForm.durationDays}
                onChange={(event) => updatePlanField('durationDays', event.target.value)}
                required
              />
            </label>
          </div>

          <label>
            {t('catalog.status')}
            <select value={planForm.status} onChange={(event) => updatePlanField('status', event.target.value)}>
              <option value="ACTIVE">{t('status.ACTIVE')}</option>
              <option value="INACTIVE">{t('catalog.inactive')}</option>
            </select>
          </label>

          {planMessage && <p className="catalog-message">{planMessage}</p>}

          <button type="submit" className="catalog-submit" disabled={createPlanMutation.isPending}>
            <AppIcon name="plus" size={18} />
            {createPlanMutation.isPending ? t('catalog.creating') : t('catalog.createPlan')}
          </button>
        </form>

        <form className="catalog-form" onSubmit={handleVoucherSubmit}>
          <div className="catalog-form-title">
            <span className="catalog-title-icon">
              <AppIcon name="ticket" size={22} />
            </span>
            <div>
              <h2>{t('catalog.createVoucher')}</h2>
              <p>{t('catalog.voucherHint')}</p>
            </div>
          </div>

          <div className="field-row">
            <label>
              {t('catalog.voucherCode')}
              <input
                value={voucherForm.code}
                onChange={(event) => updateVoucherField('code', event.target.value)}
                placeholder="GIAM30K"
                required
              />
            </label>
            <label>
              {t('catalog.discountType')}
              <select
                value={voucherForm.discountType}
                onChange={(event) => updateVoucherField('discountType', event.target.value)}
              >
                <option value="FIXED_AMOUNT">{t('catalog.fixedAmount')}</option>
                <option value="PERCENTAGE">{t('catalog.percentage')}</option>
              </select>
            </label>
          </div>

          {voucherForm.discountType === 'FIXED_AMOUNT' ? (
            <label>
              {t('catalog.discountAmount')}
              <input
                type="number"
                min="1"
                value={voucherForm.value}
                onChange={(event) => updateVoucherField('value', event.target.value)}
                placeholder="30000"
                required
              />
            </label>
          ) : (
            <div className="field-row">
              <label>
                {t('catalog.discountPercent')}
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  value={voucherForm.discountPercent}
                  onChange={(event) => updateVoucherField('discountPercent', event.target.value)}
                  placeholder="10"
                  required
                />
              </label>
              <label>
                {t('catalog.maxDiscount')}
                <input
                  type="number"
                  min="1"
                  value={voucherForm.maxDiscountAmount}
                  onChange={(event) => updateVoucherField('maxDiscountAmount', event.target.value)}
                  placeholder="50000"
                />
              </label>
            </div>
          )}

          <div className="field-row">
            <label>
              {t('catalog.expiryDate')}
              <input
                type="datetime-local"
                value={voucherForm.expiryDate}
                onChange={(event) => updateVoucherField('expiryDate', event.target.value)}
              />
            </label>
            <label>
              {t('catalog.maxUses')}
              <input
                type="number"
                min="1"
                value={voucherForm.maxUses}
                onChange={(event) => updateVoucherField('maxUses', event.target.value)}
                placeholder="20"
              />
            </label>
          </div>

          {voucherMessage && <p className="catalog-message">{voucherMessage}</p>}

          <button type="submit" className="catalog-submit" disabled={createVoucherMutation.isPending}>
            <AppIcon name="plus" size={18} />
            {createVoucherMutation.isPending ? t('catalog.creating') : t('catalog.createVoucher')}
          </button>
        </form>
      </section>

      <section className="catalog-list-section">
        <div className="catalog-list-header">
          <h2>{t('catalog.planList')}</h2>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('catalog.planName')}</th>
                <th>{t('catalog.price')}</th>
                <th>{t('catalog.duration')}</th>
                <th>{t('catalog.status')}</th>
                <th>{t('catalog.createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {plansLoading ? (
                <tr>
                  <td colSpan="5" className="empty-state">{t('catalog.loadingPlans')}</td>
                </tr>
              ) : plansError ? (
                <tr>
                  <td colSpan="5" className="empty-state error-text">{plansError.message}</td>
                </tr>
              ) : sortedPlans.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">{t('catalog.emptyPlans')}</td>
                </tr>
              ) : (
                sortedPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td><span className="badge tier-badge">{plan.planName}</span></td>
                    <td>{toMoney(plan.price, language)}</td>
                    <td>{t('subscription.days', { count: plan.durationDays })}</td>
                    <td>
                      <span className={`badge status-badge ${plan.status?.toLowerCase()}`}>
                        {plan.status === 'ACTIVE' ? t('status.ACTIVE') : t('catalog.inactive')}
                      </span>
                    </td>
                    <td>{formatLocalizedDateTime(plan.createdAt, language, t('catalog.noLimit'))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="catalog-list-section">
        <div className="catalog-list-header">
          <h2>{t('catalog.voucherList')}</h2>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('booking.code')}</th>
                <th>{t('catalog.offer')}</th>
                <th>{t('catalog.discountType')}</th>
                <th>{t('catalog.expiry')}</th>
                <th>{t('catalog.uses')}</th>
                <th>{t('catalog.status')}</th>
              </tr>
            </thead>
            <tbody>
              {vouchersLoading ? (
                <tr>
                  <td colSpan="6" className="empty-state">{t('catalog.loadingVouchers')}</td>
                </tr>
              ) : vouchersError ? (
                <tr>
                  <td colSpan="6" className="empty-state error-text">{vouchersError.message}</td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">{t('catalog.emptyVouchers')}</td>
                </tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td><span className="voucher-code">{voucher.code}</span></td>
                    <td>{voucher.discountPreview}</td>
                    <td>{voucher.discountType === 'PERCENTAGE' ? t('catalog.percentage') : t('catalog.fixedAmount')}</td>
                    <td>{formatLocalizedDateTime(voucher.expiryDate, language, t('catalog.noLimit'))}</td>
                    <td>
                      {voucher.maxUses
                        ? `${voucher.usedCount || 0}/${voucher.maxUses}`
                        : t('catalog.noLimit')}
                    </td>
                    <td>
                      <span className={`badge status-badge ${voucher.used ? 'blocked' : 'active'}`}>
                        {voucher.used ? t('catalog.used') : t('catalog.available')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
