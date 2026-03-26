# BoostPanel - SMM Panel

## Current State
New project. Empty Motoko backend and React frontend scaffold.

## Requested Changes (Diff)

### Add
- User authentication (register/login) with role-based access (admin/user)
- Service categories and services catalog with pricing per 1000 units
- Order creation: category + service selection, link, quantity, auto-price calculation
- Mass order: bulk order submission
- Orders list with status tracking (pending/processing/completed/cancelled)
- Add Funds page: UPI QR code display, UPI ID, payment screenshot upload (blob-storage), UTR/transaction ID input, amount input, submit
- Payment requests flow: user submits → admin approves/rejects → balance updated
- Transaction history for balance changes
- Admin panel: manage services, view/manage orders, approve/reject payments, view users
- Dashboard: username, total orders, balance, account status, recent orders
- Sidebar navigation with all required pages
- API page showing user's API key
- Account settings page
- Notifications (toast) for success/error
- Responsive mobile layout
- Telegram/WhatsApp support links
- Live chat button

### Modify
- Backend actor: implement all business logic

### Remove
- Nothing

## Implementation Plan
1. Select: authorization, blob-storage components
2. Generate Motoko backend with:
   - Users (id, username, email, password hash, role, balance, status, apiKey)
   - ServiceCategories (id, name)
   - Services (id, categoryId, name, pricePerThousand, minQty, maxQty, isActive)
   - Orders (id, userId, serviceId, link, quantity, cost, status, createdAt)
   - PaymentRequests (id, userId, screenshotBlobId, utrNumber, amount, status, createdAt)
   - Transactions (id, userId, type, amount, description, createdAt)
   - Auth: register, login (returns JWT-like token), getProfile
   - Admin: CRUD services/categories, list users, list orders, update order status, list payment requests, approve/reject payment
   - User: placeOrder, listMyOrders, submitPayment, getBalance, getTransactions, getApiKey
3. Frontend: dark-mode SaaS dashboard with sidebar, all pages listed above
