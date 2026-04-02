# Conmomet App - AI Coding Agent Instructions

## Architecture Overview

This is a Next.js 15 enterprise management system with TypeScript, Material-UI, and a separate backend API (Node.js on port 4000). The architecture follows Next.js App Router conventions with client-side authentication via JWT tokens stored in localStorage.

**Key architectural decisions:**
- All interactive components use `'use client'` directive (Material-UI components require client-side rendering)
- Authentication handled entirely client-side via `TokenManager` class in `src/utils/auth.ts`
- Protected routes wrapped with `<ProtectedRoute>` component that checks JWT validity and redirects to `/login`
- API communication centralized in `src/utils/api.ts` with service classes (`UserService`, `ClientService`, etc.)

## Critical Setup Requirements

**Node Version:** Must use Node 22 (specified in README.md)

**Development workflow:**
```bash
npm run dev      # Starts dev server on localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
```

**Backend API:** Expected at `http://localhost:4000` (configurable via `NEXT_PUBLIC_API_BASE_URL`)

**Test credentials:**
- Email: `admin@mail.com`
- Password: `123456`

## Authentication Pattern

Authentication uses a singleton `TokenManager` class (not React hooks for base operations):

```typescript
// Save after login
TokenManager.saveToken(token);
TokenManager.saveUser(userData);

// Check auth status
TokenManager.isAuthenticated(); // Returns boolean

// Get auth headers for API calls
TokenManager.getAuthHeaders(); // Returns headers object with Bearer token

// Logout
TokenManager.removeToken();
```

**Important:** The `useAuth()` hook in `src/utils/auth.ts` provides React-friendly access but wraps `TokenManager`.

**Route Protection:** Wrap dashboard pages with `<ProtectedRoute>` component - see `src/app/dashboard/layout.tsx` for example.

## Styling & UI Conventions

**Material-UI Theme:** Centralized in `src/app/theme.ts` with custom overrides:
- Primary color: `#1976d2` (blue)
- Button text transform: `none` (no uppercase)
- Card border radius: `12px`
- Font: Uses Next.js Geist font via CSS variables

**Hybrid styling approach:**
- Material-UI `sx` prop for component-specific styles
- TailwindCSS available but rarely used (mostly MUI)
- Global styles in `src/app/globals.css`

**Layout pattern for dashboard pages:**
```tsx
export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <Box with Drawer and AppBar>
        {/* Sidebar navigation */}
        {children}
      </Box>
    </ProtectedRoute>
  );
}
```

## API Integration Pattern

All API calls go through service classes in `src/utils/api.ts`:

```typescript
// Example: Fetching users
const users = await UserService.getAll();

// Creating a client
const newClient = await ClientService.create({
  razonSocial: "Company Name",
  email: "contact@company.com",
  phone: "123456789"
});
```

**Key behaviors:**
- All services use `TokenManager.authenticatedFetch()` which auto-includes JWT
- API responses logged to console with emoji prefixes (🔍, 📡, ❌)
- CORS issues handled by backend - frontend assumes backend CORS configured

## Component Patterns

**Sliders:** Two slider components exist:
- `ImageSlider` (Swiper-based) for hero images - see landing page
- `CardSlider` (custom MUI) for news cards with navigation dots

**Forms:** Create forms follow Material-UI patterns with `TextField`, `Select`, and `Button` - see `src/app/dashboard/clients/CreateClientForm.tsx`

**Client Components:** Almost everything needs `'use client'` due to MUI and interactive elements

## File Organization

**Routes:**
- Landing: `src/app/page.tsx` (public)
- Login: `src/app/login/page.tsx` (public)
- Dashboard: `src/app/dashboard/*` (all protected)

**Shared Components:** `src/components/` (ProtectedRoute, sliders)

**Utils:** `src/utils/` (auth.ts, api.ts)

**Path Alias:** Use `@/*` for imports from `src/` (configured in tsconfig.json)

## Common Gotchas

1. **'use client' directive required:** Always add at top of files using hooks, MUI components, or browser APIs
2. **Window check in TokenManager:** Methods check `typeof window !== 'undefined'` for SSR safety
3. **Backend must be running:** Frontend expects backend at localhost:4000 - start it before testing
4. **Environment variables:** Must prefix with `NEXT_PUBLIC_` for client-side access
5. **JWT expiration:** `TokenManager.isAuthenticated()` decodes JWT payload to check `exp` claim

## Adding New Dashboard Pages

1. Create route in `src/app/dashboard/[page-name]/page.tsx`
2. Wrap content with `<ProtectedRoute>` or rely on layout protection
3. Add menu item to `menuItems` array in `src/app/dashboard/layout.tsx`
4. Create corresponding service class in `src/utils/api.ts` if CRUD needed
5. Import and use Material-UI icons from `@mui/icons-material`

## Spanish Language Convention

All user-facing text in Spanish (Argentina). Variable names and code comments in English.
