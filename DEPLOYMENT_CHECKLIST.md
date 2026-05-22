# Deployment Checklist

## Backend Setup

### 1. Database Migrations
Execute in this order:
```sql
-- First: Update subscriptions table schema
-- File: mock-backend/mock/migrations/update_subscriptions_table.sql
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_worker_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS worker_id;
-- ... (see file for full migration)

-- Second: Seed initial subscription plans
-- File: mock-backend/mock/migrations/seed_subscription_plans.sql
INSERT INTO subscriptions (plan_name, price, duration_days, status, created_at) VALUES
('FREE', 0, 1, 'ACTIVE', NOW()),
('BASIC', 49000, 30, 'ACTIVE', NOW()),
('PRO', 199000, 30, 'ACTIVE', NOW());
```

### 2. Backend Files Created/Modified
✅ Entity: `Subscription.java` - Updated schema
✅ Service: `SubscriptionService.java` - Interface
✅ Service Impl: `SubscriptionServiceImpl.java` - Implementation
✅ Controller: `SubscriptionController.java` - REST endpoints
✅ Repository: `SubscriptionRepository.java` - Data access
✅ DTOs:
  - `SubscribeRequest.java`
  - `SubscriptionPlanResponse.java`
  - `WorkerSubscriptionResponse.java`

### 3. Configuration (No changes needed)
- VNPay sandbox configured in `application.yaml`
- Security already configured for worker access
- Redis caching already in place

## Frontend Setup

### 1. Services Updated
✅ `mock-frontend/src/services/paymentService.js`
  - Added wallet operations
  - Added subscription operations
  - Fixed API paths to use `/api/v1`

### 2. Components Created
✅ `mock-frontend/src/modules/payment/components/WalletScreen.jsx`
✅ `mock-frontend/src/modules/payment/components/SubscriptionScreen.jsx`

### 3. Styles Created
✅ `mock-frontend/src/styles/pages/WalletScreen.css`
✅ `mock-frontend/src/styles/pages/SubscriptionScreen.css`

### 4. Navigation Updated
✅ `mock-frontend/src/routes/AppRoutes.jsx` - Added `/app/subscription` route
✅ `mock-frontend/src/layouts/MainLayout.jsx` - Added Subscription link
✅ `mock-frontend/src/pages/DashboardHome.jsx` - Added Wallet and Subscription rendering

## Testing Checklist

### Backend Testing
- [ ] Database migrations execute successfully
- [ ] Subscription plans seed correctly
- [ ] GET /api/v1/subscriptions/plans returns plans
- [ ] POST /api/v1/subscriptions/subscribe updates worker tier
- [ ] GET /api/v1/subscriptions/info shows current subscription
- [ ] Worker role authorization works
- [ ] Non-workers get 403 error

### Frontend Testing
- [ ] Wallet page loads and displays balance
- [ ] Top-up button redirects to VNPay
- [ ] Transaction history displays
- [ ] Subscription page loads
- [ ] Current subscription info shows correctly
- [ ] Subscribe buttons work for workers
- [ ] Navigation links work
- [ ] Mobile responsive design works

### VNPay Integration Testing
- [ ] Top-up redirects to VNPay sandbox
- [ ] Successful payment updates balance
- [ ] Failed payment shows error message
- [ ] Transaction history records all attempts

## Deployment Steps

### Step 1: Backend
```bash
cd mock-backend/mock
# Run migrations
mysql -u user -p database < migrations/update_subscriptions_table.sql
mysql -u user -p database < migrations/seed_subscription_plans.sql
# Build and deploy
mvn clean install
# Start application
java -jar target/mock-application.jar
```

### Step 2: Frontend
```bash
cd mock-frontend
# Install dependencies (if needed)
npm install
# Build for production
npm run build
# Deploy to hosting (or run dev server)
npm run dev
```

## Troubleshooting

### Issue: "Worker profile not found"
- Ensure worker account has corresponding WorkerProfile entity
- Check database for missing WorkerProfile records

### Issue: "Subscription plan not found"
- Run seed_subscription_plans.sql to populate plans
- Verify plans are active status in database

### Issue: "VNPay redirect not working"
- Check vnpay configuration in application.yaml
- Verify return-url matches frontend callback handler
- Check ngrok URL is updated if using ngrok

### Issue: "Balance not updating after VNPay"
- Check VNPay callback endpoint is public
- Verify signature validation logic
- Check Redis cache is running
- Review transaction history in database

## Files Summary

```
Backend:
├── entity/Subscription.java (MODIFIED)
├── service/SubscriptionService.java (NEW)
├── service/Impl/SubscriptionServiceImpl.java (NEW)
├── controller/SubscriptionController.java (NEW)
├── repository/SubscriptionRepository.java (NEW)
├── entity/DTO/request/SubscribeRequest.java (NEW)
├── entity/DTO/response/SubscriptionPlanResponse.java (NEW)
└── entity/DTO/response/WorkerSubscriptionResponse.java (NEW)

Frontend:
├── services/paymentService.js (MODIFIED)
├── modules/payment/components/WalletScreen.jsx (NEW)
├── modules/payment/components/SubscriptionScreen.jsx (NEW)
├── styles/pages/WalletScreen.css (NEW)
├── styles/pages/SubscriptionScreen.css (NEW)
├── routes/AppRoutes.jsx (MODIFIED)
├── layouts/MainLayout.jsx (MODIFIED)
└── pages/DashboardHome.jsx (MODIFIED)

Migrations:
├── migrations/update_subscriptions_table.sql (NEW)
└── migrations/seed_subscription_plans.sql (NEW)
```

## Next Steps

1. Execute database migrations
2. Rebuild backend
3. Rebuild frontend
4. Test all functionality
5. Deploy to production

## Support

For issues or questions:
- Check IMPLEMENTATION_SUMMARY.md for architecture details
- Review database migration files for schema changes
- Check component files for inline documentation
- Test VNPay sandbox credentials in application.yaml
