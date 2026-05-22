# Wallet & Subscription API Reference

## Wallet API

### 1. Create Wallet
```
POST /api/v1/wallet
Authorization: Bearer <token>

Response:
{
  "balance": 0,
  "currency": "VND"
}
```

### 2. Get Wallet Balance
```
GET /api/v1/wallet/balance
Authorization: Bearer <token>

Response:
{
  "balance": 50000,
  "currency": "VND"
}
```

### 3. Initiate Top-up (VNPay)
```
POST /api/v1/wallet/topup
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "amount": 100000,
  "orderInfo": "Wallet deposit",
  "bankCode": "NCB"  // Optional
}

Response:
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "vnpTxnRef": "1621234567890123",
  "amount": 100000
}
```

### 4. Get Transaction History
```
GET /api/v1/wallet/history
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "vnpTxnRef": "1621234567890123",
    "amount": 100000,
    "status": "SUCCESS",
    "vnpResponseCode": "00",
    "vnpTransactionNo": "VNP123456",
    "vnpPayDate": "20240520100000",
    "createdAt": "2024-05-20T10:00:00"
  }
]
```

### 5. VNPay Callback
```
GET /api/v1/payment/vnpay-callback?vnp_Amount=...&vnp_BankCode=...&vnp_TxnRef=...&vnp_SecureHash=...
(Called by VNPay automatically)

Response:
{
  "success": true,
  "message": "Success",
  "vnpTxnRef": "1621234567890123"
}
```

---

## Subscription API

### 1. Get All Active Plans
```
GET /api/v1/subscriptions/plans
Authorization: Bearer <token>

Response:
[
  {
    "id": 2,
    "planName": "BASIC",
    "price": 49000,
    "durationDays": 30,
    "status": "ACTIVE",
    "createdAt": "2024-05-20T10:00:00"
  },
  {
    "id": 3,
    "planName": "PRO",
    "price": 199000,
    "durationDays": 30,
    "status": "ACTIVE",
    "createdAt": "2024-05-20T10:00:00"
  }
]
```

### 2. Subscribe to a Plan
```
POST /api/v1/subscriptions/subscribe
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "subscriptionPlanId": 2
}

Response:
{
  "tierType": "BASIC",
  "tierExpiredAt": "2024-06-20T10:00:00",
  "subscriptionName": "BASIC"
}
```

### 3. Get Current Subscription Info
```
GET /api/v1/subscriptions/info
Authorization: Bearer <token>

Response:
{
  "tierType": "BASIC",
  "tierExpiredAt": "2024-06-20T10:00:00",
  "subscriptionName": "BASIC"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "status": 400,
  "message": "Invalid request body"
}
```

### 403 Forbidden (Non-worker)
```json
{
  "status": 403,
  "code": "SUBSCRIPTION_ACCESS_DENIED",
  "message": "Only workers can manage subscriptions"
}
```

### 404 Not Found
```json
{
  "status": 404,
  "code": "PLAN_NOT_FOUND",
  "message": "Subscription plan not found or inactive"
}
```

### 500 Server Error
```json
{
  "status": 500,
  "message": "Internal server error"
}
```

---

## Bank Codes for VNPay

| Code | Bank Name |
|------|-----------|
| NCB | Ngân hàng Ngoại Thương (NCB) |
| AGRIBANK | Ngân hàng Nông nghiệp |
| SCB | Ngân hàng Sài Gòn |
| SACOMBANK | Ngân hàng Sài Gòn Thương Tín |
| TECHCOMBANK | Techcombank |
| VPBANK | Ngân hàng VP |
| JPMORGANCHASE | JP Morgan Chase |
| ICBC | ICBC |
| HSBC | HSBC |

---

## Frontend Integration Examples

### Get Wallet Balance
```javascript
import { getWalletBalance } from '../services/paymentService'

const fetchBalance = async () => {
  try {
    const data = await getWalletBalance()
    console.log('Balance:', data.balance)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

### Initiate Top-up
```javascript
import { topUpWallet } from '../services/paymentService'

const handleTopup = async (amount, bankCode) => {
  try {
    const response = await topUpWallet(amount, 'Wallet deposit', bankCode)
    // Redirect to payment URL
    window.location.href = response.paymentUrl
  } catch (error) {
    console.error('Error:', error)
  }
}
```

### Get Subscription Plans
```javascript
import { getSubscriptionPlans } from '../services/paymentService'

const loadPlans = async () => {
  try {
    const plans = await getSubscriptionPlans()
    console.log('Available plans:', plans)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

### Subscribe to Plan
```javascript
import { subscribeToplan } from '../services/paymentService'

const subscribe = async (planId) => {
  try {
    const subscription = await subscribeToplan(planId)
    console.log('New tier:', subscription.tierType)
    console.log('Expires:', subscription.tierExpiredAt)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

---

## Database Schema

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  plan_name VARCHAR(20) NOT NULL,
  price DECIMAL(19,4) NOT NULL,
  duration_days INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CHECK (duration_days > 0)
);
```

### Wallets Table
```sql
CREATE TABLE wallets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id UUID UNIQUE NOT NULL,
  balance DECIMAL(19,4) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'VND',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  version BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Worker Profile Fields
```sql
-- Existing fields used for subscription tracking:
-- tier_type VARCHAR(20) DEFAULT 'FREE'
-- tier_expired_at TIMESTAMP NULL
```

---

## Performance Notes

- Wallet balance is cached in Redis (300 seconds TTL)
- Transaction history is cached (120 seconds TTL)
- Optimistic locking on wallet balance to prevent race conditions
- Use subscription plan IDs (not names) for all operations
