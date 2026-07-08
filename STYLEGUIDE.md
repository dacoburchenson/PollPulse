# PollPulse Style Guide

## Brand Colors

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| **Primary** | `#8000FF` | `hsl(270 100% 50%)` | Main CTAs, active states, links |
| **Primary (dark)** | `#B366FF` | `hsl(270 100% 65%)` | Primary on dark backgrounds |
| **Accent** | `#FF0080` | `hsl(330 100% 50%)` | Highlights, secondary actions |
| **Accent (dark)** | `#FF66B2` | `hsl(330 100% 65%)` | Accent on dark backgrounds |
| **Background** | `#F0F0FF` | `hsl(240 100% 97%)` | Page background (light mode) |
| **Background (dark)** | `hsl(240 10% 3.9%)` | — | Page background (dark mode) |

## Typography

| Token | Font | Usage |
|-------|------|-------|
| `font-headline` | **Space Grotesk** | Headings, short emphasis text |
| `font-body` | Inter | Body text, paragraphs, UI labels |

Headline classes: `font-headline font-bold tracking-tight`

## Components

- **All UI components** from shadcn/ui (Radix-based, accessible)
- **Icons:** Lucide React (filled/minimalist style)
- **Charts:** Recharts
- **Form validation:** Zod (for AI flow schemas), manual state for campaign forms

## Spacing

Use Tailwind spacing scale. Cards use consistent `space-y-4` / `space-y-6` for content padding. Page sections separated by `space-y-8`.

## Naming Conventions

- Routes: `(app)/dashboard/` for brand, `(auth)/` for login/signup, `consumer/` for consumer
- Components: PascalCase files, default exports
- Hooks: `use-*` kebab-case filenames
- Actions: Server Actions in `actions.ts` alongside page files
