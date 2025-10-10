## Fixd Mobile App

A quotes-first marketplace flow connecting customers, providers, and admins. The app uses Firebase Auth + Firestore, React Navigation, and Expo modules.

### Roles & Flows

- Customer
  - Submit a quote request: `CustomQuoteRequestScreen`
  - Review quotes: `CustomerQuotesScreen`
  - Messaging: `PreAcceptanceChatScreen` (pre-acceptance)
  - Vehicles: `AddVehicleScreen`

- Provider
  - Browse published requests and submit quotes
  - Provider tabs and detail flows live under `navigation/ProviderTabNavigator.tsx`

- Admin
  - Manage requests: `AdminRequestsScreen`
    - Filters: Pending Approval, Published (No Quotes), Unpublished
    - Collapsible Create Quote: search/select a mechanic, set amount/message, submit
    - Assign a mechanic and manage status (publish/close)

### Data Model (Firestore)

- `users/{uid}`: role (admin/provider/customer), profile, notification token
- `quoteRequests/{requestId}`: customerId, description, status: `submitted | published | assigned | closed`
- `mechanicQuotes/{quoteId}`: requestId, customerId, mechanicId, amount, message, approved

### Navigation

- Root: `navigation/AppNavigator.tsx` routes by role to Admin, Provider, or Customer shells
- Customer: `navigation/CustomerNavigator.tsx`
- Provider: `navigation/ProviderTabNavigator.tsx`

### Tech

- React Native + Expo
- Firebase: Auth, Firestore
- Notifications: `expo-notifications`
- Icons: `lucide-react-native`

### Development

- Install deps: `npm install`
- Run app: `npm run start`

### Notes

- Legacy cart/checkout UI has been removed in favor of a quotes-first flow.