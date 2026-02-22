# DRBY Racing League

A real-time multiplayer racing simulation application built with React, Netlify Functions, and Ably WebSockets.

![DRBY Racing](https://img.shields.io/badge/DRBY-Racing%20League-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Netlify](https://img.shields.io/badge/Netlify-Functions-00C7B7?logo=netlify)

## Features

- **Real-time Racing**: Watch races unfold in real-time with live position updates
- **Multiplayer Synchronization**: Multiple browser instances see the same race via Ably WebSockets
- **Dynamic Standings**: Points and medal counts calculated automatically from race results
- **Racer Profiles**: View detailed stats, health, and performance history
- **Multiple Tracks**: Race on different surfaces (asphalt, dirt, grass) with varying lengths
- **Persistent Season**: Schedule and standings persist across page refreshes

## Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + React Native Web
- **Backend**: Netlify Functions (Node.js/TypeScript)
- **Data Storage**: Netlify Blobs (serverless object storage)
- **Real-time**: Ably Pub/Sub WebSockets
- **Animations**: React Native Reanimated (Shared Values for 60fps performance)

### Project Structure

```
drby/
├── netlify/
│   └── functions/          # Serverless functions
│       ├── tracks.ts       # Track data management
│       ├── racers.ts       # Racer data management
│       ├── races.ts        # Race results & schedule
│       └── race-manager.ts # Real-time race orchestration
├── src/
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client & services
│   ├── scripts/           # Database seeding scripts
│   └── utils/             # Helper functions
├── .env                   # Environment variables (not in git)
├── .env.example          # Environment template (safe for git)
└── netlify.toml          # Netlify configuration
```

## Quick Start

### Prerequisites

- Node.js 18+
- Netlify account
- Ably account (for real-time features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd drby
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   NETLIFY_SITE_ID=your-site-id
   NETLIFY_AUTH_TOKEN=your-token
   API_KEY=your-random-api-key
   ABLY_API_KEY=your-ably-key
   ```

4. **Seed initial data**
   ```bash
   # Load environment variables and run seed scripts
   export $(cat .env | xargs)
   node src/scripts/seed-racers.cjs
   ```

5. **Start development server**
   ```bash
   npx netlify dev
   ```

6. **Open the app**
   ```
   http://localhost:8888
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NETLIFY_SITE_ID` | Your Netlify site ID | Yes |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token | Yes |
| `API_KEY` | Custom API key for function authentication | Yes |
| `ABLY_API_KEY` | Ably API key for real-time races | Yes |

**Security Note**: Never commit `.env` to git. It's already in `.gitignore`.

## How It Works

### Race Lifecycle

1. **Countdown**: Races start every 10 minutes (configurable)
2. **Race Start**: Server initializes race via `race-manager` function
3. **Real-time Updates**: Server publishes position updates every 200ms via Ably
4. **Client Sync**: All connected clients receive updates and render racers
5. **Race Finish**: Results saved to Netlify Blobs, standings recalculated

### Data Flow

```
Client A ←──Ably──→ Race Manager ←──Ably──→ Client B
                ↕
         Netlify Blobs
         (schedule, results, standings)
```

### Points System

- **1st Place**: 5 points
- **2nd Place**: 3 points
- **3rd Place**: 1 point

Standings are dynamically calculated from race results to ensure accuracy.

## API Endpoints

### Races

- `GET /api/races` - List all races
- `GET /api/races/:id` - Get specific race
- `POST /api/races` - Create race
- `GET /api/races/schedule` - Get season schedule
- `POST /api/races/schedule` - Save season schedule
- `GET /api/races/standings` - Get calculated standings

### Racers

- `GET /api/racers` - List all racers

### Tracks

- `GET /api/tracks` - List all tracks

### Race Manager

- `POST /api/race-manager` - Start a real-time race (requires x-api-key header)

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Seeding Data

**Tracks:**
```bash
node src/scripts/seed-tracks.js
```

**Racers:**
```bash
node src/scripts/seed-racers.cjs
```

**Note**: These scripts require `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` environment variables to be set.

## Deployment

### Deploy to Netlify

1. **Connect your repository** to Netlify
2. **Set environment variables** in Netlify dashboard:
   - Site Settings → Environment Variables
   - Add all variables from your `.env` file
3. **Deploy** - Netlify will auto-deploy on git push

### Manual Deploy

```bash
netlify deploy --prod
```

## Troubleshooting

### Races not starting
- Check that `ABLY_API_KEY` is set correctly
- Verify `race-manager` function is deployed
- Check browser console for WebSocket errors

### Standings not updating
- Standings are calculated dynamically from race results
- Check that races are being marked as completed
- Verify `races/standings` endpoint returns correct data

### Port already in use
```bash
# Kill existing Netlify dev processes
pkill -f "netlify"
```

## Security Best Practices

✅ **Implemented**:
- All secrets in environment variables
- API key authentication on functions
- `.env` in `.gitignore`
- No hardcoded credentials

⚠️ **For Production**:
- Rotate API keys regularly
- Use Netlify Identity for user auth
- Enable CORS restrictions
- Add rate limiting

## License

MIT License - feel free to use this project as a starting point for your own racing applications!

## Credits

Built with ❤️ using:
- [React](https://react.dev)
- [Netlify](https://netlify.com)
- [Ably](https://ably.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Note**: This is a demo application. For production use, consider adding proper authentication, error handling, and rate limiting.
