# Mybooki.ai

A modern restaurant booking management system built with React and Vite.

## Features

- 📅 **Reservations Management** - View and manage restaurant bookings
- 👥 **Guest Management** - Track customer information and booking history
- 📊 **Statistics Dashboard** - Real-time analytics and insights
- ⚙️ **Availability Settings** - Configure restaurant capacity and time slots
- 💳 **Payment Tracking** - Monitor payment status and transactions
- 📱 **Set Number Integration** - Manage phone number settings
- 🔐 **Authentication** - Secure login and signup system

## Tech Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Mybooki.ai
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
cp .env.example .env
```

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Lint

Run ESLint to check code quality:
```bash
npm run lint
```

## Project Structure

```
Mybooki.ai/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components (Reservations, Guests, etc.)
│   ├── services/       # API services and business logic
│   ├── store/          # Zustand state management
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   ├── styles/         # Global styles
│   └── App.jsx         # Main application component
├── public/             # Static assets
└── index.html          # Entry HTML file
```

## API Configuration

The application connects to the backend API at:
```
https://mybookiapi.jarviscalling.ai
```

You can modify the API base URL in `src/config/api.js`

## Available Pages

- `/login` - User login
- `/signup` - User registration
- `/reservations` - Manage bookings
- `/guests` - View guest information
- `/stats` - Analytics dashboard
- `/availability` - Configure availability
- `/set-number` - Phone number settings
- `/payments` - Payment tracking
- `/settings` - Application settings

## License

Private - All rights reserved
