# Voucher Calculation

## Voucher Fields

The `vouchers` table supports two discount types:

| Field | Meaning |
| --- | --- |
| `discount_type` | `FIXED_AMOUNT` or `PERCENTAGE` |
| `value` | Fixed discount amount, used when `discount_type = FIXED_AMOUNT` |
| `discount_percent` | Percentage value, used when `discount_type = PERCENTAGE` |
| `max_discount_amount` | Maximum discount cap for percentage vouchers |

## Fixed Amount Voucher

Used for vouchers like `discount 50,000 VND`.

Formula:

```text
discountAmount = min(voucher.value, totalAmount)
finalAmount = totalAmount - discountAmount
```

Example:

```text
totalAmount = 300,000
voucher.value = 50,000

discountAmount = 50,000
finalAmount = 250,000
```

If the voucher value is greater than the total:

```text
totalAmount = 40,000
voucher.value = 50,000

discountAmount = 40,000
finalAmount = 0
```

## Percentage Voucher With Cap

Used for vouchers like `discount 30%, maximum 50,000 VND`.

Formula:

```text
rawDiscount = totalAmount * discountPercent / 100
discountAmount = min(rawDiscount, maxDiscountAmount)
discountAmount = min(discountAmount, totalAmount)
finalAmount = totalAmount - discountAmount
```

Example 1, discount below cap:

```text
totalAmount = 100,000
discountPercent = 30
maxDiscountAmount = 50,000

rawDiscount = 100,000 * 30 / 100 = 30,000
discountAmount = min(30,000, 50,000) = 30,000
finalAmount = 70,000
```

Example 2, discount exceeds cap:

```text
totalAmount = 300,000
discountPercent = 30
maxDiscountAmount = 50,000

rawDiscount = 300,000 * 30 / 100 = 90,000
discountAmount = min(90,000, 50,000) = 50,000
finalAmount = 250,000
```

Example 3, final amount cannot be negative:

```text
totalAmount = 40,000
discountPercent = 100
maxDiscountAmount = 50,000

rawDiscount = 40,000
discountAmount = min(40,000, 50,000) = 40,000
finalAmount = 0
```

## Booking Flow

When a customer creates a booking with `voucherId`, the booking stores a pending voucher usage:

```text
bookings.id -> voucher_usage.booking_id
vouchers.id -> voucher_usage.voucher_id
voucher_usage.status = PENDING
```

When the technician enters or updates the payment amount:

```http
PATCH /api/v1/bookings/{bookingId}/payment

{
  "totalAmount": 300000
}
```

The backend recalculates:

```text
booking.totalAmount
booking.discountAmount
booking.finalAmount
voucher_usage.appliedDiscountAmount
```

## Technician Reimbursement

After the customer confirms completion:

```http
PATCH /api/v1/bookings/{bookingId}/confirm
```

The voucher usage becomes:

```text
voucher_usage.status = REDEEMED
```

Then the backend reimburses the technician wallet:

```text
workerWallet.balance += voucher_usage.appliedDiscountAmount
```

A transaction history row is created:

```text
vnp_order_type = VOUCHER_REIMBURSEMENT
amount = voucher_usage.appliedDiscountAmount
status = SUCCESS
```

## SQL Examples

Fixed amount voucher:

```sql
INSERT INTO vouchers (
  code,
  discount_type,
  value,
  expiry_date,
  is_used
) VALUES (
  'FIXED50K',
  'FIXED_AMOUNT',
  50000,
  '2026-12-31 23:59:59',
  false
);
```

Percentage voucher with cap:

```sql
INSERT INTO vouchers (
  code,
  discount_type,
  discount_percent,
  max_discount_amount,
  expiry_date,
  is_used
) VALUES (
  'SALE30MAX50K',
  'PERCENTAGE',
  30,
  50000,
  '2026-12-31 23:59:59',
  false
);
```

