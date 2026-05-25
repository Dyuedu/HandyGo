# VNPay + Wallet Implementation History

Date: 2026-05-16

## Scope
- VNPay payment flow with ngrok return URL.
- Wallet balance, top-up, history, and cache-aside with Redis.
- Wallet deduction using Redis Lua script (atomic balance check and update).

## VNPay Flow
- Create top-up transaction with required VNPay parameters.
- Generate payment URL with secure hash.
- Handle VNPay callback to update transaction status and wallet balance.
- Use return URL: https://frugality-creation-concrete.ngrok-free.dev/api/v1/payment/vnpay-callback
- Enforce VNPay requirements:
  - vnp_Locale = vn
  - vnp_OrderType = other
  - vnp_OrderInfo sanitized (no accents or special characters)

## Wallet Features
- Worker registration creates an initial wallet automatically.
- Wallet APIs are limited to worker accounts.
- Read worker wallet balance.
- Top up worker wallet via VNPay.
- Retrieve worker transaction history.
- Deduct worker balance using Redis Lua script with insufficient-funds protection.

## Cache-Aside (Redis)
- Account cached by username.
- Wallet balance cached by user id.
- Wallet history cached by wallet id.
- Cache updated or invalidated on balance-changing operations.

## Primary Endpoints
- POST /api/v1/wallet (create worker wallet if missing)
- GET /api/v1/wallet/balance
- POST /api/v1/wallet/topup
- GET /api/v1/wallet/history
- POST /api/v1/wallet/deduct
- GET /api/v1/payment/vnpay-callback

## Notes
- VNPay amount is sent as VND * 100 (no decimal separators).
- Wallet deduction uses Redis Lua to guarantee atomic check-and-update.
