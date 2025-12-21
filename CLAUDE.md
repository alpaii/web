# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is TailAdmin, a Next.js 16 admin dashboard template built with React 19, TypeScript, and Tailwind CSS v4. It's a free and open-source template providing UI components and layouts for building feature-rich admin dashboards.

## Development Commands

### Basic Commands
```bash
npm install              # Install dependencies
npm run dev             # Start development server (default: http://localhost:3000)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
```

### Installation Notes
- Use `--legacy-peer-deps` flag if you encounter peer-dependency errors during installation
- Requires Node.js 18.x or later (recommended: Node.js 20.x or later)
- Windows users: place repository near root of drive if cloning issues occur

## Architecture

### Layout System

This project uses Next.js 16 App Router with a dual-layout architecture:

1. **Admin Layout** (`src/app/(admin)/layout.tsx`):
   - Wraps admin/dashboard pages with sidebar and header
   - Uses `SidebarContext` to manage sidebar state (expanded/collapsed/mobile)
   - Dynamically adjusts main content margin based on sidebar state
   - Applied to: dashboard, UI elements, forms, charts, tables, profile, calendar

2. **Full-Width Layout** (`src/app/(full-width-pages)/layout.tsx`):
   - Minimal layout without sidebar/header chrome
   - Applied to: authentication pages (signin/signup) and error pages (404)

Route groups (folders with parentheses) organize pages without affecting URL structure.

### Context Providers

The application uses two global context providers defined in the root layout:

- **ThemeProvider** (`src/context/ThemeContext.tsx`):
  - Manages light/dark theme state
  - Persists theme preference to localStorage
  - Toggles `dark` class on document element
  - Provides `useTheme()` hook

- **SidebarProvider** (`src/context/SidebarContext.tsx`):
  - Manages sidebar state: expanded, mobile open, hovered, active item, open submenu
  - Handles responsive behavior (mobile vs desktop)
  - Provides `useSidebar()` hook
  - Must be used within provider or will throw error

### Component Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── (admin)/           # Admin layout pages (with sidebar)
│   │   ├── (ui-elements)/ # UI component demos
│   │   └── (others-pages)/# Forms, charts, tables, calendar
│   ├── (full-width-pages)/# Auth and error pages (no sidebar)
│   └── layout.tsx         # Root layout with providers
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── calendar/         # Calendar components
│   ├── charts/           # Chart components (ApexCharts)
│   ├── common/           # Shared components
│   ├── ecommerce/        # E-commerce widgets
│   ├── form/             # Form elements
│   ├── header/           # Header components
│   ├── tables/           # Table components
│   ├── ui/               # UI elements (alerts, buttons, modals, etc.)
│   ├── user-profile/     # Profile components
│   └── videos/           # Video player components
├── context/              # React context providers
├── layout/               # Layout components (AppSidebar, AppHeader, Backdrop)
└── globals.css           # Global styles and Tailwind directives
```

### Styling

- **Tailwind CSS v4** is used for all styling
- Custom theme configuration may exist in globals.css
- Dark mode: toggled via `dark` class on `<html>` element (managed by ThemeProvider)
- Font: Outfit from Google Fonts (loaded in root layout)

### SVG Handling

SVGs are handled as React components via `@svgr/webpack`:
- Webpack config in `next.config.ts` includes SVGR loader
- Turbopack config also includes SVGR support
- Type definitions in `svg.d.ts` and `jsvectormap.d.ts`

### Path Aliases

TypeScript path alias `@/*` maps to `src/*` (configured in tsconfig.json).

Example:
```typescript
import { useTheme } from '@/context/ThemeContext';
import AppHeader from '@/layout/AppHeader';
```

## Key Libraries

- **Next.js 16**: App Router with React Server Components
- **React 19**: Latest React features
- **Tailwind CSS v4**: Utility-first CSS framework
- **ApexCharts**: Data visualization (via react-apexcharts)
- **FullCalendar**: Calendar component
- **JVectorMap**: Interactive maps (with React 19 compatibility overrides)
- **Flatpickr**: Date picker
- **React DnD**: Drag and drop functionality
- **React Dropzone**: File upload handling
- **Swiper**: Touch slider component

## Important Notes

### Peer Dependencies
- The project uses `overrides` in package.json to make @react-jvectormap compatible with React 19
- If adding new dependencies that don't support React 19, similar overrides may be needed

### Client vs Server Components
- Context providers (Theme, Sidebar) are client components (`"use client"`)
- Admin layout is a client component due to context usage
- When creating new components that use contexts or browser APIs, mark with `"use client"`

### Responsive Behavior
- Sidebar collapses on mobile (< 768px width)
- SidebarContext automatically detects mobile viewport and adjusts behavior
- Layout margins adjust based on sidebar state (90px collapsed, 290px expanded)

## Testing

No test framework is currently configured in this project.
