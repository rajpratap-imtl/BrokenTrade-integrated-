# BrokenTrade.com & PaperTrading Integration

This is a unified monorepo for the BrokenTrade.com educational trading platform and the paperTrading algorithmic trading feature.

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running on `localhost:27017`
- All dependencies installed in each service

### Starting All Services

From the root directory, run:

```bash
npm run dev
```

This single command starts all four services:
- **BrokenTrade Backend** on port 5000
- **BrokenTrade Frontend** on port 5173
- **PaperTrading Backend** on port 5001
- **PaperTrading Frontend** on port 5174

### Stopping All Services

Press `Ctrl+C` in the terminal where `npm run dev` is running. This will stop all four services.

## Project Structure

```
.
├── BrokenTrade.com/
│   ├── backend/          # Express backend (port 5000)
│   └── frontend/         # React frontend (port 5173)
├── paperTrading/
│   ├── backend/          # Express backend (port 5001)
│   └── frontend/         # Vue 3 frontend (port 5174)
├── .env                  # Shared environment configuration
└── package.json          # Root package with dev scripts
```

## Environment Configuration

The root `.env` file contains shared configuration for all services:

- **MONGODB_URI**: Shared MongoDB database connection
- **JWT_SECRET**: Shared authentication secret
- **Service Ports**: Configured ports for all four services
- **CORS Origins**: Allowed cross-origin request URLs

## Individual Service Scripts

You can also run services individually:

```bash
npm run dev:bt-backend    # BrokenTrade backend only
npm run dev:bt-frontend   # BrokenTrade frontend only
npm run dev:pt-backend    # PaperTrading backend only
npm run dev:pt-frontend   # PaperTrading frontend only
```

## Integration Features

- **Unified Development**: Single command starts all services
- **Shared Authentication**: JWT-based auth across both platforms
- **Shared Database**: Both backends use the same MongoDB database
- **Cross-Origin Support**: CORS configured for seamless communication
- **Seamless Navigation**: Navigate from BrokenTrade to PaperTrading with authentication

## Next Steps

See the `.kiro/specs/paper-trading-integration/` directory for:
- `requirements.md` - Detailed requirements
- `design.md` - Technical architecture and design
- `tasks.md` - Implementation tasks
