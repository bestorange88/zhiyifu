# 云智医服 (Cloud Smart Medical Service)

## Overview

云智医服是一个移动优先的AI智能医疗咨询平台，使用React和Express构建。应用提供21+种AI专业工具，包括医疗问诊、健康评估、法律咨询、运势分析等。采用SSE实时流式响应的聊天界面，提供流畅的AI交互体验。

The application follows a monorepo structure with separate client and server directories, uses PostgreSQL for data persistence, and integrates with OpenAI-compatible APIs through Replit's AI integrations for chat and image generation capabilities.

## Branding
- **Platform Name**: 云智医服
- **Tagline**: 云端智能医疗服务
- **Logo**: Cloud-medical cross gradient icon (teal to emerald)
- **Primary Color**: #1FB6FF (Teal)
- **Secondary Color**: #34D399 (Emerald)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom Replit plugins for development

The frontend is organized as a mobile-first single-page application with five main tabs: Home, Tools, Chat, Service, and Mine. Each tool opens a dedicated chat interface with context-specific system prompts.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints with SSE for streaming chat responses
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Validation**: Zod for runtime type checking

The server uses a modular integration pattern with separate modules for chat, image generation, and batch processing located in `server/replit_integrations/`.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema**: Two main tables - `conversations` and `messages` with foreign key relationships
- **Migrations**: Managed via drizzle-kit with output to `./migrations`

### Build System
- **Development**: Vite dev server with HMR proxied through Express
- **Production**: Custom build script using esbuild for server bundling and Vite for client
- **Output**: Server bundles to `dist/index.cjs`, client to `dist/public`

### Shared Code
The `shared/` directory contains code used by both client and server:
- `schema.ts`: Database schema definitions and Zod types
- `routes.ts`: API route definitions with type-safe request/response schemas
- `models/`: Additional model definitions

## External Dependencies

### AI Services
- **OpenAI API**: Used via Replit AI Integrations for chat completions and image generation
- **Environment Variables**: 
  - `AI_INTEGRATIONS_OPENAI_API_KEY`: API key for OpenAI
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`: Custom base URL for API routing

### Database
- **PostgreSQL**: Primary data store
- **Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection string

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migration tooling
- `@tanstack/react-query`: Server state management
- `express`: HTTP server framework
- `openai`: OpenAI SDK for AI integrations
- `date-fns`: Date formatting utilities
- shadcn/ui components (multiple @radix-ui packages)

### Development Tools
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Replit-specific development tooling
- `tsx`: TypeScript execution for development server