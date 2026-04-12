# Design System — TeenAlpha

## Product Context
- **What this is:** A purpose-finding platform where teens discover their unique path, build real projects, and earn their first dollar. File-over-app philosophy: artifacts belong to the teen, not the platform.
- **Who it's for:** Teens (13-18) and their parents
- **Space:** NOT ed-tech. Personal empowerment, mentorship, teen entrepreneurship.
- **Project type:** Web app (dashboard-driven) + marketing landing pages
- **Personality:** Warm, playful, human. Snapchat/TikTok energy with real tools. Should never feel corporate, clinical, or AI-generated.

## Aesthetic Direction
- **Direction:** Playful Warm Workspace
- **Decoration level:** Intentional (subtle warmth, gentle shadows, no decorative clutter)
- **Mood:** "This is YOUR space, and building things here feels good." Think the energy of customizing your Tumblr, but with real tools. The content IS the decoration: projects, sprint progress, first-dollar milestones.
- **Ambient motion:** The explore page has a moving background animation. Keep and extend this to other pages as a subtle warmth layer.

## Typography
- **Display/Hero:** Cabinet Grotesk (bold, geometric, youthful without being childish)
- **Body:** Plus Jakarta Sans (warm, readable, modern)
- **UI/Labels:** Plus Jakarta Sans 600 weight
- **Data/Tables:** Geist Mono (tabular-nums)
- **Code:** Geist Mono
- **Loading:** Google Fonts / Bunny Fonts CDN, font-display: swap
- **Scale (rem):**
  - xs: 0.75rem (12px)
  - sm: 0.875rem (14px)
  - base: 1rem (16px)
  - lg: 1.125rem (18px)
  - xl: 1.25rem (20px)
  - 2xl: 1.5rem (24px)
  - 3xl: 1.875rem (30px)
  - 4xl: 2.25rem (36px)
  - 5xl: 3rem (48px)
  - hero: 3.5rem (56px)

## Color
- **Approach:** Balanced warm palette. No blue-gray corporate colors.
- **Primary:** #FF6B35 (warm orange, energetic, stands out from blue/purple teen platforms)
- **Primary hover:** #E85A24
- **Secondary:** #2EC4B6 (teal, fresh and modern)
- **Sprint/Earn accent:** #00C853 (money green, used for sprint progress and first-dollar moments)
- **Neutrals (warm grays):**
  - Lightest (bg): #FAF9F7
  - Surface: #FFFFFF
  - Surface hover: #F5F4F2
  - Border: #E8E6E3
  - Muted text: #9C9690
  - Secondary text: #6B6560
  - Darkest (text): #1A1A1A
- **Semantic:** success #06D6A0 | warning #FFD166 | error #EF476F | info #2EC4B6
- **Dark mode strategy:**
  - Surfaces use elevation (not just lightness inversion)
  - Text off-white #FAF9F7, not pure white
  - Primary desaturated 10-15%
  - Dark bg: #1A1A1A, dark surface: #2A2826, dark border: #3E3C3A

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable (teens need breathing room)
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)
- **Touch targets:** Minimum 44px on all interactive elements

## Layout
- **Approach:** Hybrid
  - Marketing pages (sprint landing): creative-editorial energy, dark standalone theme OK
  - App pages (dashboard, sprint, messages): comfortable grid-disciplined layout with generous whitespace, light theme
- **Max content width:** 960px (app), 1280px (landing pages)
- **Border radius hierarchy:**
  - sm: 4px (inputs, small badges)
  - md: 8px (buttons, alerts)
  - lg: 12px (cards, modals)
  - xl: 16px (major containers, dashboard sections)
  - full: 9999px (avatars, pills)

## Motion
- **Approach:** Intentional (Framer Motion)
- **Easing:** enter(ease-out), exit(ease-in), move(ease-in-out), spring(stiffness: 200)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **Patterns:**
  - Page entrance: fade-in + slight translateY (0.6s, ease-out)
  - Card hover: translateY(-2px) + subtle shadow (0.15s)
  - Task completion: spring animation (stiffness: 200)
  - Ambient background: keep the existing animated background from explore page
- **Never:** scroll-jacking, decorative particles, transition: all
- **Respect:** prefers-reduced-motion

## Anti-Patterns (never use)
- Purple/violet gradients as default accent
- 3-column feature grid with icons in colored circles
- Centered everything with uniform spacing
- Uniform bubbly border-radius on all elements
- Emoji as design elements in headings
- XP bars, level badges, or gamification chrome (the sprint IS the game)
- "Welcome to TeenAlpha" or "Unlock the power of..." copy
- Ed-tech visual language (grade books, progress rings, achievement badges)

## Two-Theme Strategy
- **Landing pages (/sprint, marketing):** Dark theme is OK for these standalone pages. They should feel punchy, high-energy, and different from the app. Always include a nav bar linking back to the main site.
- **Authenticated app (/dashboard, /messages, /projects):** Always light theme. Consistent, warm, approachable. The teen's workspace.
- **Transition:** When a user goes from dark landing page to light app (e.g., /sprint -> /signup -> /dashboard), the shift should feel intentional, like walking from a cool event entrance into a warm studio.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-12 | Initial design system | Created by /design-consultation. Warm orange + teal palette, Cabinet Grotesk + Plus Jakarta Sans, playful workspace aesthetic. |
| 2026-04-12 | Orange as primary over blue/purple | Every teen platform trends blue/purple. Orange says energy, creation, warmth. Differentiation. |
| 2026-04-12 | No gamification chrome | Sprint progress is the game. First dollar is the reward. Focus on real outcomes. |
| 2026-04-12 | File-over-app philosophy | Teen's journey, projects, portfolio belong to THEM. Design should reinforce ownership. |
