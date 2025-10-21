# AI Jewelry Designer

A full-stack application for AI-powered jewelry design using React, TypeScript, and Express.

## Features

- AI-powered jewelry design generation using Gemini API
- Interactive chat interface for design modifications
- Base design gallery with various jewelry categories
- Real-time design iteration and refinement
- File upload support for custom designs
- Responsive design with modern UI components

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Wouter
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Google Gemini API
- **Build Tools**: Vite, ESBuild

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ai_jewelry_designer

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── db.ts              # Database configuration
│   └── storage.ts         # Data storage layer
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema
└── uploads/               # File uploads directory
```

## API Endpoints

- `GET /api/base-designs` - Get all base designs
- `GET /api/sub-designs` - Get all sub designs
- `POST /api/generate-design` - Generate new design with AI
- `POST /api/chat` - Chat with AI about designs
- `POST /api/upload` - Upload image files
- `POST /api/projects` - Create new project

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License
