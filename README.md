# Teen Alpha

A Project mamagement system designed for high school students to build ambitious projects with adult mentorship and AI guidance.

## Project Structure

- 'apps/web' - Next.js web application
- 'apps/mobile' - Expo mobile application (iOS/Android)
- 'packages/database' - Shared Supabase client and queries
- 'packages/ui' - Shared UI components
- 'packages/utils' - Shared utilities and business logic
- 'supabase' - Database migrations and schemas
- 'docs' - Documentation

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
'''bash
# Install dependencies
npm install

# Run web app
npm run web

# Run mobile app
npm run mobile
'''

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React Native (Expo)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI**: Shadcn/ui, Tailwind CSS, NativeWind
- **AI**: Anthropic Claude API
- **Deployment**: Vercel (web), EAS (mobile)

## Development

This is a turborepo monorepo. All apps and packages share dependencies and can be debeloped simultaneously.

### Useful Commands

- 'npm run dev' - Start all apps in development mode
- 'npm run build' - Build all apps
- 'npm run web' - Start only web app
- 'npm run mobile' - Start only mobile app
- 'npm run lint' - Run linting across all apps

