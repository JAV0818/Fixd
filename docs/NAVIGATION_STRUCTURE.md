# Navigation Structure Reference

This document clarifies which screens are used for which user roles to avoid confusion.

## User Roles

- **Provider** = Mechanics (people who fix cars)
- **Admin** = Master accounts (you, the owner)
- **Customer** = End users requesting services

## Provider Navigation (`ProviderTabNavigator.tsx`)

**Used when:** User role is `provider` (mechanic)

**Tabs:**
1. **MARKETPLACE** → `QuoteMarketplaceScreen` (`screens/provider/QuoteMarketplaceScreen.tsx`)
2. **REPAIR QUEUE** → `RepairOrdersScreen` (`screens/provider/RepairOrdersScreen.tsx`) ⚠️ **THIS IS THE PROVIDER SCREEN**
3. **MESSENGER** → `ProviderMessagingScreen` (`screens/provider/ProviderMessagingScreen.tsx`)
4. **PROFILE** → `ProfileStack` → `ProviderProfileScreen` (`screens/provider/ProviderProfileScreen.tsx`)

**Key Provider Screens:**
- `screens/provider/RepairOrdersScreen.tsx` - Provider's repair queue
- `screens/provider/QuoteMarketplaceScreen.tsx` - Provider's marketplace
- `screens/provider/ProviderMessagingScreen.tsx` - Provider's messaging
- `screens/provider/ProviderProfileScreen.tsx` - Provider's profile

---

## Admin Navigation (`AdminTabNavigator.tsx`)

**Used when:** User role is `admin` (master account)

**Tabs:**
1. **REQUESTS** → `AdminRequestsScreen` (`screens/admin/AdminRequestsScreen.tsx`)
2. **REPAIR QUEUE** → `AdminRepairQueueScreen` (`screens/admin/AdminRepairQueueScreen.tsx`) ⚠️ **THIS IS THE ADMIN SCREEN**
3. **MESSAGES** → `AdminMessagingScreen` (`screens/admin/AdminMessagingScreen.tsx`)
4. **PROFILE** → `ProfileScreen` (`screens/customer/ProfileScreen.tsx`)

**Key Admin Screens:**
- `screens/admin/AdminRepairQueueScreen.tsx` - Admin's repair queue
- `screens/admin/AdminRequestsScreen.tsx` - Admin's requests
- `screens/admin/AdminMessagingScreen.tsx` - Admin's messaging

---

## Customer Navigation (`CustomerNavigator.tsx`)

**Used when:** User role is `customer`

**Tabs:**
1. **HOME** → `HomeScreen` (`screens/customer/HomeScreen.tsx`)
2. **ORDERS** → `OrdersScreen` (`screens/customer/OrdersScreen.tsx`)
3. **MESSAGES** → `MechanicChatScreen` (`screens/customer/MechanicChatScreen.tsx`)
4. **PROFILE** → `ProfileScreen` (`screens/customer/ProfileScreen.tsx`)

---

## How to Determine Which Screen to Edit

### When working on "Repair Queue" screen:

1. **Check the user's role:**
   - If logged in as **provider** → Edit `screens/provider/RepairOrdersScreen.tsx`
   - If logged in as **admin** → Edit `screens/admin/AdminRepairQueueScreen.tsx`

2. **Check the navigation file:**
   - `ProviderTabNavigator.tsx` uses `RepairOrdersScreen` (provider)
   - `AdminTabNavigator.tsx` uses `AdminRepairQueueScreen` (admin)

3. **Check the file path:**
   - Provider screens are in `screens/provider/`
   - Admin screens are in `screens/admin/`

### Quick Reference Table

| Feature | Provider Screen | Admin Screen |
|---------|----------------|--------------|
| Repair Queue | `screens/provider/RepairOrdersScreen.tsx` | `screens/admin/AdminRepairQueueScreen.tsx` |
| Requests | `screens/provider/RequestsScreen.tsx` | `screens/admin/AdminRequestsScreen.tsx` |
| Messaging | `screens/provider/ProviderMessagingScreen.tsx` | `screens/admin/AdminMessagingScreen.tsx` |
| Profile | `screens/provider/ProviderProfileScreen.tsx` | `screens/customer/ProfileScreen.tsx` |

---

## Common Mistakes to Avoid

❌ **DON'T:** Edit `AdminRepairQueueScreen.tsx` when working on provider features
✅ **DO:** Edit `RepairOrdersScreen.tsx` for provider features

❌ **DON'T:** Assume both roles use the same screen
✅ **DO:** Check which role you're testing with and edit the correct screen

❌ **DON'T:** Edit provider screens when logged in as admin
✅ **DO:** Log in as a provider to test provider screens

---

## Verification Checklist

Before making changes to a "Repair Queue" screen:

- [ ] Check which role you're logged in as
- [ ] Verify the correct screen file path (`provider/` vs `admin/`)
- [ ] Check the navigation file to confirm which component is used
- [ ] Test with the correct user role after making changes

