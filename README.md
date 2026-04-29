# Booki.ai — AI Restaurant Booking Management Dashboard

A production-ready React SPA for restaurant owners to manage AI-assisted reservations, guests, payments, availability, bot configuration, and an embedded AI voice widget.

**Live URL:** [https://booki.co.za](https://booki.co.za)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Routing Reference](#routing-reference)
- [API Reference](#api-reference)
- [Code Reference](#code-reference)

---

## Architecture Overview

```
Browser (React SPA)
        │
        ├── Reservations API (mybookiapis.jarviscalling.ai)  ← Reservations, guests, availability
        │
        ├── Jarvis Config API (phone.jarviscalling.ai)       ← Bot settings, question flow, payments
        │
        ├── Widget API (widget.jarviscalling.ai)             ← AI chat widget conversations & questions
        │
        ├── Jarvis Voice API (phone.jarviscalling.ai)        ← Manual bookings, phone verification
        │
        └── Registration API (register.jarviscalling.ai)     ← New restaurant onboarding
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | React 19 (ESM, Vite) |
| Routing | React Router v7 |
| State Management | Zustand |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| HTTP Client | Axios (with interceptors) |
| Phone Input | `react-phone-number-input` |
| Build Tool | Vite 7 |

---

## Project Structure

```
.
├── index.html                      # Vite entry HTML
├── vite.config.js                  # Vite config with React plugin
├── vercel.json                     # Vercel SPA routing fallback config
└── src/
    ├── main.jsx                    # React DOM entry point
    ├── App.jsx                     # Root router — public and dashboard routes
    ├── config/
    │   ├── api.js                  # API base URL, timeout, default headers
    │   └── constants.js            # App-wide constants (storage keys, statuses, sources)
    ├── layouts/
    │   ├── DashboardLayout.jsx     # Authenticated layout with Sidebar
    │   └── PublicLayout.jsx        # Public layout for login / landing pages
    ├── pages/
    │   ├── Login.jsx               # Login page
    │   ├── Signup.jsx              # Multi-step restaurant registration form
    │   ├── RegistrationPending.jsx # Post-signup waiting screen
    │   ├── LandingPage.jsx         # Landing page route
    │   ├── Reservations.jsx        # Daily reservation view with date picker + status management
    │   ├── Guests.jsx              # Guest list with search and inline editing
    │   ├── Availability.jsx        # Operating hours and capacity configuration
    │   ├── Stats.jsx               # Restaurant statistics overview
    │   ├── Payments.jsx            # PayFast payment history
    │   ├── FailedBookings.jsx      # Failed/incomplete AI call bookings
    │   ├── Settings.jsx            # Address, deposit amount, and password settings
    │   ├── BotSetting.jsx          # AI bot question flow editor
    │   ├── SetNumber.jsx           # Twilio phone number assignment
    │   ├── Widget.jsx              # Embedded AI chat widget preview and config
    │   ├── WidgetConversations.jsx # Widget chat conversation history
    │   └── Context.jsx             # Context page (detailed view)
    ├── components/
    │   ├── Sidebar.jsx             # Navigation sidebar
    │   ├── Navigation.jsx          # Top navigation bar
    │   ├── ConversationModal.jsx   # Modal for viewing call transcript + details
    │   ├── CreateReservationModal.jsx  # Modal for creating manual reservations
    │   ├── landingpage.jsx         # Landing page component tree
    │   ├── landingpage/            # Landing page sub-components (privacy policy, ToS)
    │   └── ui/                     # Shared primitive UI components
    ├── services/
    │   ├── auth.js                 # Auth logic — login (mock), register, decode token
    │   ├── reservations.js         # Reservations CRUD — fetch, create, manual, update, delete
    │   ├── guests.js               # Guest list fetch and inline update
    │   ├── settings.js             # Address, password, deposit amount, bot config CRUD
    │   ├── payments.js             # PayFast payment history fetch
    │   ├── failedBookings.js       # Failed bookings fetch by date
    │   ├── stats.js                # Restaurant statistics overview fetch
    │   ├── widgetService.js        # Widget API — questions, question flow, conversations
    │   ├── phoneVerification.js    # Twilio Lookup phone number verification
    │   └── api/
    │       ├── axios.js            # Axios instance with request/response interceptors
    │       └── endpoints.js        # Centralized endpoint factory functions
    ├── store/
    │   └── useAuthStore.js         # Zustand store — user, token, restaurantId, login, logout
    ├── utils/
    │   ├── dateUtils.js            # Date formatting and manipulation helpers
    │   └── errorHandler.js         # Axios error extraction and user-friendly messages
    └── hooks/
        └── use-media-query.js      # Custom hook for responsive breakpoints
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_VERIFICATION_API_URL=https://phone.jarviscalling.ai
VITE_WIDGET_API_URL=https://widget.jarviscalling.ai
```

> The main reservations API base URL (`https://mybookiapis.jarviscalling.ai`) is hardcoded in `src/config/api.js`. The Jarvis config/payment endpoints auto-switch between `localhost:9000` (dev) and `https://phone.jarviscalling.ai` (prod) based on `import.meta.env.MODE`.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build
```

The dev server runs on `http://localhost:5173` by default.

---

## Routing Reference

### Public Routes

| Path | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Marketing landing page |
| `/login` | `Login` | Restaurant owner login |
| `/signup` | `Signup` | Multi-step restaurant registration |
| `/registration-pending` | `RegistrationPending` | Post-signup awaiting approval screen |
| `/privacy-policy` | `PrivacyPolicy` | Privacy policy page |
| `/terms-of-service` | `TermsAndConditions` | Terms of service page |

### Dashboard Routes (authenticated, with Sidebar)

| Path | Component | Description |
|---|---|---|
| `/reservations` | `Reservations` | Daily reservations with date picker + status controls |
| `/guests` | `Guests` | Full guest list with inline edit |
| `/availability` | `Availability` | Operating hours and cover capacity settings |
| `/stats` | `Stats` | Restaurant statistics overview |
| `/payments` | `Payments` | PayFast payment history |
| `/failed-bookings` | `FailedBookings` | Failed/incomplete AI call bookings |
| `/settings` | `Settings` | Address, deposit, password settings |
| `/botsettings` | `BotSetting` | AI bot question flow editor |
| `/set-number` | `SetNumber` | Twilio phone number management |
| `/widget` | `Widget` | AI chat widget preview and configuration |
| `/widget-conversations` | `WidgetConversations` | Widget conversation history |

---

## API Reference

### Reservations API (`mybookiapis.jarviscalling.ai`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/restaurants/:restaurantId/reservations?date=YYYY-MM-DD` | Fetch reservations for a date |
| `GET` | `/restaurants/:restaurantId/reservations/:id` | Fetch single reservation detail |
| `POST` | `/restaurants/:restaurantId/reservations` | Create a new reservation |
| `PUT` | `/restaurants/:restaurantId/reservations/:id` | Update a reservation |
| `DELETE` | `/restaurants/:restaurantId/reservations/:id` | Delete a reservation |
| `GET` | `/restaurants/:restaurantId/failed-bookings?date=YYYY-MM-DD` | Fetch failed bookings for a date |
| `GET` | `/restaurants/:restaurantId/guests` | Fetch all guests |
| `PATCH` | `/restaurants/:restaurantId/guests/:id` | Update a guest |
| `GET` | `/restaurants/:restaurantId/address` | Fetch restaurant address |
| `PUT` | `/restaurants/:restaurantId/address` | Update restaurant address |
| `POST` | `/restaurants/:restaurantId/availability` | Set availability / operating hours |
| `GET` | `/restaurants/:restaurantId/transcriptions/:bookingId` | Fetch call transcription |
| `PATCH` | `/settings/password` | Change password |

### Jarvis Config & Payment API (`phone.jarviscalling.ai`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/restaurant/:restaurantId/details` | Fetch bot config, deposit, question flow |
| `POST` | `/api/update-config` | Update restaurant settings / deposit amount |
| `POST` | `/api/question/add` | Add a question to the bot flow |
| `DELETE` | `/api/question/delete` | Delete a question from the bot flow |
| `GET` | `/api/payfast/payments/:restaurantId` | Fetch PayFast payment history |
| `POST` | `/api/booking/manual/:restaurantId` | Create a manual booking with SMS notification |
| `POST` | `/api/verify/phone` | Verify a phone number via Twilio Lookup |

### Widget API (`widget.jarviscalling.ai`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/restaurants/:restaurantId` | Fetch full restaurant profile + question flow |
| `POST` | `/api/restaurants/:restaurantId/questions` | Add a question to widget flow |
| `PUT` | `/api/restaurants/:restaurantId/questions` | Replace entire question flow |
| `DELETE` | `/api/restaurants/:restaurantId/questions/:questionId` | Delete a question |
| `GET` | `/api/conversations?restaurantId=:id` | Fetch widget conversation history |

### Registration API (`register.jarviscalling.ai`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register new restaurant (multipart/form-data) |

---

## Code Reference

### `src/App.jsx`

Root router. Splits routes into public (no sidebar) and dashboard (with Sidebar). Dashboard routes are nested under a `*` catch-all that renders the `Sidebar` + `main` layout shell.

---

### `src/config/api.js`

| Export | Value | Purpose |
|---|---|---|
| `API_BASE_URL` | `https://mybookiapis.jarviscalling.ai` | Base URL for all Axios requests |
| `API_TIMEOUT` | `30000` ms | Global request timeout |
| `DEFAULT_HEADERS` | `{ Content-Type, Accept }` | Default JSON headers |
| `isDevelopment` / `isProduction` | `boolean` | Environment flags |

---

### `src/config/constants.js`

| Export | Keys | Purpose |
|---|---|---|
| `STORAGE_KEYS` | `AUTH_TOKEN`, `USER`, `IS_AUTHENTICATED` | localStorage key names |
| `DATE_FORMATS` | `API`, `DISPLAY_SHORT`, `DISPLAY_LONG` | Standard date format strings |
| `RESERVATION_STATUS` | `confirmed`, `pending`, `cancelled`, `completed`, `no_show` | Reservation status enum |
| `RESERVATION_SOURCE` | `ai_call`, `manual`, `online` | Booking source enum |

---

### `src/store/useAuthStore.js`

Zustand store. Persists auth session to localStorage on login and clears it on logout.

| State / Action | Type | Purpose |
|---|---|---|
| `user` | Object \| `null` | Decoded user payload (`email`, `name`, `role`, `restaurantId`) |
| `token` | String \| `null` | Stored JWT / mock token |
| `restaurantId` | String \| `null` | Active restaurant ID — passed to all scoped API calls |
| `isAuthenticated` | `boolean` | Auth gate flag |
| `login(credentials)` | `async fn` | Calls `authService.login`; persists token + restaurantId |
| `logout()` | `fn` | Clears localStorage and resets all auth state |

---

### `src/services/api/axios.js`

Centralized Axios instance. Auto-attaches `Authorization: Bearer <token>` on every request. Handles 401/403/404/500 in a response interceptor.

| Export | Purpose |
|---|---|
| `apiClient` (default) | Pre-configured Axios instance used by all services |

---

### `src/services/api/endpoints.js`

Centralized endpoint factory functions. All restaurant-scoped endpoints accept `restaurantId` as a parameter.

| Export | Endpoints | Purpose |
|---|---|---|
| `RESERVATION_ENDPOINTS` | `GET_BY_DATE`, `GET_BY_ID`, `CREATE`, `UPDATE`, `DELETE` | Reservation CRUD paths |
| `FAILED_BOOKINGS_ENDPOINTS` | `GET_BY_DATE` | Failed bookings path |
| `GUEST_ENDPOINTS` | `GET_ALL`, `UPDATE` | Guest paths |
| `AVAILABILITY_ENDPOINTS` | `SET` | Availability path |
| `ADDRESS_ENDPOINTS` | `GET`, `UPDATE` | Address paths |
| `TRANSCRIPTION_ENDPOINTS` | `GET_BY_BOOKING_ID` | Transcription path |
| `AUTH_ENDPOINTS` | `UPDATE_PASSWORD` | Password change path |
| `PAYMENT_ENDPOINTS` | `GET_BY_RESTAURANT` | PayFast payments path |
| `JARVIS_CONFIG_ENDPOINTS` | `GET_DETAILS`, `UPDATE`, `ADD_QUESTION`, `DELETE_QUESTION` | Bot config paths |

---

### `src/services/auth.js`

| Method | Input | Output | Purpose |
|---|---|---|---|
| `authService.login(credentials)` | `{ email, password }` | `Promise<{ success, token, user }>` | Validates against mock user list; returns signed token |
| `authService.decodeToken(token)` | Token string | Decoded payload object \| `null` | Decodes base64 mock-JWT to restore session on refresh |
| `authService.changePassword(currentPassword, newPassword)` | Two password strings | `Promise<{ success, message }>` | Mock password change with length validation |
| `authService.register(formData, verificationDoc)` | Form fields + `File` | `Promise<{ message, registrationId }>` | POSTs multipart registration to `register.jarviscalling.ai` |

---

### `src/services/reservations.js`

All methods require `restaurantId` to scope requests to the correct restaurant.

| Method | Input | Output | Purpose |
|---|---|---|---|
| `reservationService.getReservations(date, restaurantId)` | `Date` object + restaurant ID | `Promise<{ date, totalBookings, totalGuests, capacity, reservations[] }>` | Fetches and transforms reservations for a specific date |
| `reservationService.getReservationDetails(id, restaurantId)` | Reservation ID + restaurant ID | `Promise<Object>` — formatted detail | Fetches single reservation with call summary and duration |
| `reservationService.createReservation(reservationData, restaurantId)` | Payload object + restaurant ID | `Promise<Object>` | Creates a standard reservation |
| `reservationService.createManualReservation(reservationData, restaurantId)` | Payload object + restaurant ID | `Promise<Object>` | Creates a manual booking via Jarvis API (triggers SMS) |
| `reservationService.updateReservation(id, updateData, restaurantId)` | Reservation ID + partial data + restaurant ID | `Promise<Object>` | Updates an existing reservation |
| `reservationService.deleteReservation(id, restaurantId)` | Reservation ID + restaurant ID | `Promise<void>` | Deletes a reservation |

---

### `src/services/guests.js`

| Method | Input | Output | Purpose |
|---|---|---|---|
| `guestService.getGuests(restaurantId)` | Restaurant ID | `Promise<Array>` | Fetches all guests; maps flat API fields to camelCase UI names |
| `guestService.updateGuest(guest, restaurantId)` | Guest object (with `id`) + restaurant ID | `Promise<Object>` | PATCHes `name`, `phone`, `email` for a guest |

---

### `src/services/settings.js`

| Method | Input | Output | Purpose |
|---|---|---|---|
| `settingsService.getAddress(restaurantId)` | Restaurant ID | `Promise<{ streetLine1, city, province, postalCode }>` | Fetches restaurant address |
| `settingsService.updateAddress(restaurantId, addressData)` | Restaurant ID + address object | `Promise<Object>` | Updates restaurant address |
| `settingsService.changePassword(currentPassword, newPassword)` | Two password strings | `Promise<Object>` | Changes password via auth endpoint |
| `settingsService.getDepositAmount(restaurantId)` | Restaurant ID | `Promise<number \| string>` | Fetches deposit amount from Jarvis config |
| `settingsService.updateDepositAmount(restaurantId, amount)` | Restaurant ID + amount | `Promise<Object>` | Updates deposit amount in Jarvis config |
| `settingsService.getBotConfig(restaurantId)` | Restaurant ID | `Promise<Object>` | Fetches full bot config including question flow |
| `settingsService.updateBotConfig(restaurantId, questionFlow)` | Restaurant ID + question array | `Promise<Object>` | Replaces full question flow in Jarvis config |
| `settingsService.addQuestion(restaurantId, questionData)` | Restaurant ID + `{ title, botMessage, isRequired }` | `Promise<Object>` | Adds a new question via Jarvis config API |
| `settingsService.deleteQuestion(restaurantId, questionId)` | Restaurant ID + question ID | `Promise<Object>` | Deletes a question from the bot flow |

---

### `src/services/payments.js`

| Method | Input | Output | Purpose |
|---|---|---|---|
| `paymentService.getPayments(restaurantId)` | Restaurant ID | `Promise<{ payments[], total, totalAmount }>` | Fetches PayFast payment history for a restaurant |

---

### `src/services/failedBookings.js`

| Method | Input | Output | Purpose |
|---|---|---|---|
| `failedBookingsService.getFailedBookings(date, restaurantId)` | `Date` object + restaurant ID | `Promise<Object>` | Fetches failed/incomplete bookings for a specific date |

---

### `src/services/stats.js`

| Method | Input | Output | Purpose |
|---|---|---|---|
| `statsService.getOverview()` | — | `Promise<{ avgMonthlyBookings, avgMonthlyCovers, avgCoversPerBooking, avgMonthlyCancellations, avgMonthlyNoShows }>` | Fetches restaurant statistics overview |

---

### `src/services/widgetService.js`

Dedicated Axios client pointing to `widget.jarviscalling.ai`. Handles the AI chat widget's question flow and conversation history.

| Method | Input | Output | Purpose |
|---|---|---|---|
| `widgetService.getSettings(restaurantId)` | Restaurant ID | `Promise<Object>` | Fetches full restaurant profile (name, settings, questionFlow) |
| `widgetService.getQuestions(restaurantId)` | Restaurant ID | `Promise<{ success, data: Array }>` | Extracts and returns questionFlow from restaurant profile |
| `widgetService.addQuestion(restaurantId, payload)` | Restaurant ID + `{ title, botMessage, isRequired }` | `Promise<Object>` | Adds new question; server inserts it second-to-last |
| `widgetService.replaceQuestionFlow(restaurantId, questionsArray)` | Restaurant ID + full question array | `Promise<Object>` | Full replacement of question flow (used for edit and reorder) |
| `widgetService.deleteQuestion(restaurantId, questionId)` | Restaurant ID + question ID | `Promise<Object>` | Deletes question by ID; Greeting and Confirmation are protected |
| `widgetService.getConversations(restaurantId)` | Restaurant ID | `Promise<Object>` | Fetches all widget conversations sorted newest first |

---

### `src/services/phoneVerification.js`

| Method | Input | Output | Purpose |
|---|---|---|---|
| `phoneVerificationService.verifyPhoneNumber(phoneNumber)` | E.164 phone string | `Promise<{ success, valid, phoneNumber, nationalFormat, countryCode, lineTypeIntelligence }>` | Verifies phone number via Twilio Lookup v2 through Jarvis API |

---

### `src/utils/dateUtils.js`

| Function | Input | Output | Purpose |
|---|---|---|---|
| `formatDateForAPI(date)` | `Date` object | `"YYYY-MM-DD"` string | Formats date for all API query params |
| `formatDateForDisplay(date)` | `Date` object | `"MM/DD/YYYY"` string | Short display format |
| `formatDateLong(date)` | `Date` object | `"Thursday, January 22, 2026"` string | Long human-readable date |
| `parseAPIDate(dateString)` | `"YYYY-MM-DD"` string | `Date` object | Parses API date string to JS Date (avoids timezone shift) |
| `getToday()` | — | `Date` at midnight | Returns today's date normalized to start of day |
| `addDays(date, days)` | `Date` + integer | New `Date` object | Adds (or subtracts) days from a date |
| `formatTime12Hour(timeString)` | `"HH:mm"` or `"HH:mm:ss"` or `"h:mm AM/PM"` | `"hh:mm AM/PM"` string | Converts 24-hour to 12-hour; returns AM/PM strings unchanged |

---

### `src/utils/errorHandler.js`

| Function | Input | Output | Purpose |
|---|---|---|---|
| `getErrorMessage(error)` | Axios error object | Human-readable string | Extracts message from `response.data.message`, `response.data.error`, or `error.message` |
| `getStatusMessage(status)` | HTTP status code | User-friendly string | Maps 400/401/403/404/500/502/503 to readable messages |
| `handleApiError(error, customMessage?)` | Axios error + optional override | Error message string | Logs in dev, returns custom message or extracted message |
