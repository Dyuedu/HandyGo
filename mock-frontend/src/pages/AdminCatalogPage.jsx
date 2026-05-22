import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppIcon } from '../components/AppIcon'
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

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function toMoney(value) {
  if (value === null || value === undefined || value === '') return '-'
  return moneyFormatter.format(Number(value))
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  return Number(value)
}

function toDateTimeOrNull(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

function formatDateTime(value) {
  if (!value) return 'Không giới hạn'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
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
      setPlanMessage('Đã tạo gói cước mới.')
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
    },
    onError: (error) => {
      setPlanMessage(error.message || 'Không thể tạo gói cước.')
    },
  })

  const createVoucherMutation = useMutation({
    mutationFn: createAdminVoucher,
    onSuccess: () => {
      setVoucherForm(initialVoucherForm)
      setVoucherMessage('Đã tạo voucher mới.')
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] })
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
    },
    onError: (error) => {
      setVoucherMessage(error.message || 'Không thể tạo voucher.')
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
          <h1>Gói cước & Voucher</h1>
          <p>Tạo dữ liệu thương mại để thợ đăng ký gói và khách hàng dùng ưu đãi khi đặt lịch.</p>
        </div>
      </header>

      <section className="catalog-grid">
        <form className="catalog-form" onSubmit={handlePlanSubmit}>
          <div className="catalog-form-title">
            <span className="catalog-title-icon">
              <AppIcon name="crown" size={22} />
            </span>
            <div>
              <h2>Tạo gói cước</h2>
              <p>Gói đang hoạt động sẽ hiển thị cho thợ đăng ký.</p>
            </div>
          </div>

          <label>
            Tên gói
            <input
              value={planForm.planName}
              onChange={(event) => updatePlanField('planName', event.target.value)}
              placeholder="Ví dụ: PRO"
              required
            />
          </label>

          <div className="field-row">
            <label>
              Giá gói
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
              Thời hạn
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
            Trạng thái
            <select value={planForm.status} onChange={(event) => updatePlanField('status', event.target.value)}>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm ẩn</option>
            </select>
          </label>

          {planMessage && <p className="catalog-message">{planMessage}</p>}

          <button type="submit" className="catalog-submit" disabled={createPlanMutation.isPending}>
            <AppIcon name="plus" size={18} />
            {createPlanMutation.isPending ? 'Đang tạo...' : 'Tạo gói cước'}
          </button>
        </form>

        <form className="catalog-form" onSubmit={handleVoucherSubmit}>
          <div className="catalog-form-title">
            <span className="catalog-title-icon">
              <AppIcon name="ticket" size={22} />
            </span>
            <div>
              <h2>Tạo voucher</h2>
              <p>Voucher khả dụng sẽ xuất hiện ở luồng đặt lịch.</p>
            </div>
          </div>

          <div className="field-row">
            <label>
              Mã voucher
              <input
                value={voucherForm.code}
                onChange={(event) => updateVoucherField('code', event.target.value)}
                placeholder="GIAM30K"
                required
              />
            </label>
            <label>
              Kiểu giảm
              <select
                value={voucherForm.discountType}
                onChange={(event) => updateVoucherField('discountType', event.target.value)}
              >
                <option value="FIXED_AMOUNT">Giảm tiền</option>
                <option value="PERCENTAGE">Giảm phần trăm</option>
              </select>
            </label>
          </div>

          {voucherForm.discountType === 'FIXED_AMOUNT' ? (
            <label>
              Số tiền giảm
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
                Phần trăm giảm
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
                Giảm tối đa
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
              Hạn sử dụng
              <input
                type="datetime-local"
                value={voucherForm.expiryDate}
                onChange={(event) => updateVoucherField('expiryDate', event.target.value)}
              />
            </label>
            <label>
              Số lượt dùng
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
            {createVoucherMutation.isPending ? 'Đang tạo...' : 'Tạo voucher'}
          </button>
        </form>
      </section>

      <section className="catalog-list-section">
        <div className="catalog-list-header">
          <h2>Danh sách gói cước</h2>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên gói</th>
                <th>Giá</th>
                <th>Thời hạn</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {plansLoading ? (
                <tr>
                  <td colSpan="5" className="empty-state">Đang tải gói cước...</td>
                </tr>
              ) : plansError ? (
                <tr>
                  <td colSpan="5" className="empty-state error-text">{plansError.message}</td>
                </tr>
              ) : sortedPlans.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">Chưa có gói cước.</td>
                </tr>
              ) : (
                sortedPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td><span className="badge tier-badge">{plan.planName}</span></td>
                    <td>{toMoney(plan.price)}</td>
                    <td>{plan.durationDays} ngày</td>
                    <td>
                      <span className={`badge status-badge ${plan.status?.toLowerCase()}`}>
                        {plan.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td>{formatDateTime(plan.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="catalog-list-section">
        <div className="catalog-list-header">
          <h2>Danh sách voucher</h2>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Ưu đãi</th>
                <th>Kiểu</th>
                <th>Hạn dùng</th>
                <th>Lượt dùng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {vouchersLoading ? (
                <tr>
                  <td colSpan="6" className="empty-state">Đang tải voucher...</td>
                </tr>
              ) : vouchersError ? (
                <tr>
                  <td colSpan="6" className="empty-state error-text">{vouchersError.message}</td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">Chưa có voucher.</td>
                </tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td><span className="voucher-code">{voucher.code}</span></td>
                    <td>{voucher.discountPreview}</td>
                    <td>{voucher.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Giảm tiền'}</td>
                    <td>{formatDateTime(voucher.expiryDate)}</td>
                    <td>
                      {voucher.maxUses
                        ? `${voucher.usedCount || 0}/${voucher.maxUses}`
                        : 'Không giới hạn'}
                    </td>
                    <td>
                      <span className={`badge status-badge ${voucher.used ? 'blocked' : 'active'}`}>
                        {voucher.used ? 'Đã dùng' : 'Khả dụng'}
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
