# Secret House Web

A modern, luxury-themed booking website for Secret House - a private event space in Minsk, Belarus. Built with React, TypeScript, and Vite for optimal performance and user experience.

## Features

- **Responsive Design**: Mobile-first approach with luxury aesthetic
- **Photo Gallery**: Interactive gallery with multiple categories (Interior, Atmosphere, Details)
- **Yandex Maps Integration**: Location display with interactive map
- **Telegram Bot Integration**: Direct booking through Telegram
- **Social Media Links**: Instagram and Telegram channel integration
- **Modern Tech Stack**: React 19, TypeScript, Tailwind CSS v4
- **Fast Builds**: Powered by rolldown-vite for improved build performance

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd secret-house-web
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
# Location coordinates for Yandex Maps
VITE_LOCATION_LAT=53.934202
VITE_LOCATION_LON=27.300385
VITE_LOCATION_ADDRESS=Минск, Беларусь

# Telegram bot username (without @)
VITE_BOT_USERNAME=the_secret_house_booking_bot

# Social media and contacts
VITE_TELEGRAM_ADMIN=the_secret_house
VITE_TELEGRAM_CHANNEL=sekret_blr
VITE_INSTAGRAM_USERNAME=private_sekret_blr
VITE_PHONE_NUMBER=+375257908378
```

See `.env.example` for a template.

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Code Quality

Run ESLint to check for code issues:

```bash
npm run lint
```

Type-check TypeScript files:

```bash
npx tsc -b
```

## Tech Stack

### Core
- **React 19.2.0**: UI library with latest features
- **TypeScript**: Type-safe JavaScript
- **Vite (rolldown-vite 7.2.5)**: Fast build tool with Rolldown bundler
- **React Router DOM**: Client-side routing

### Styling
- **Tailwind CSS v4**: Utility-first CSS framework
- **PostCSS**: CSS processing with autoprefixer
- **Custom Utilities**: Luxury gradients, gold colors, shadow effects

### Development Tools
- **ESLint**: Code linting with TypeScript and React rules
- **@vitejs/plugin-react**: Fast Refresh with Babel

## Project Structure

```
secret-house-web/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component with routing
│   ├── assets/               # Static assets (images, SVGs)
│   └── *.css                 # Component and global styles
├── public/                   # Static public assets
├── index.html                # HTML entry point
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── eslint.config.js          # ESLint configuration
├── postcss.config.js         # PostCSS configuration
├── package.json              # Dependencies and scripts
├── CLAUDE.md                 # AI assistant instructions
└── README.md                 # This file
```

## Routing

The application uses React Router DOM for navigation:

- `/` - Home page with all content sections
- `/book`, `/booking`, `/telegram` - Auto-redirect to Telegram bot
- Gallery state is managed via URL parameters (`?gallery=open&category=...`)
- Browser back button closes the gallery and returns to the home page

## Environment Variables

All environment variables are prefixed with `VITE_` to be accessible in the client-side code:

- **VITE_LOCATION_LAT/LON/ADDRESS**: Configure Yandex Maps location
- **VITE_BOT_USERNAME**: Telegram bot username for booking
- **VITE_TELEGRAM_ADMIN**: Admin contact username
- **VITE_TELEGRAM_CHANNEL**: Public channel username
- **VITE_INSTAGRAM_USERNAME**: Instagram profile handle
- **VITE_PHONE_NUMBER**: Contact phone in international format

## Deployment

The project includes Docker configuration for containerized deployment:

```bash
docker build -t secret-house-web .
docker run -p 80:80 secret-house-web
```

See `Dockerfile` for deployment configuration.

## Browser Support

Modern browsers with ES2022 support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

## License

Private project - All rights reserved.

## Contact

For inquiries about Secret House:
- Telegram: [@the_secret_house](https://t.me/the_secret_house)
- Instagram: [@private_sekret_blr](https://instagram.com/private_sekret_blr)
- Channel: [@sekret_blr](https://t.me/sekret_blr)
