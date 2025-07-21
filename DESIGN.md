RoboLike Desktop App Design System

  Design Philosophy

  Transform from retro dark theme to a clean, modern, professional SaaS-style interface
   that builds trust and credibility while maintaining subtle brand personality.

  Color Palette

  /* Core Neutrals */
  --color-charcoal: #2a2a2a        /* Deep charcoal for dark accents */
  --color-slate: #3d4043           /* Mid-tone slate for secondary elements */
  --color-steel: #5a6169           /* Steel blue-grey for borders/dividers */
  --color-platinum: #e8e9ea        /* Clean platinum for light backgrounds */
  --color-white: #ffffff           /* Pure white for main backgrounds */

  /* Primary Brand Colors */
  --color-primaryOrange: #e85a0d    /* Deep burnt orange (primary CTA) */
  --color-secondaryOrange: #ff7625  /* Lighter orange for hovers */
  --color-accent: #1a365d          /* Deep navy blue for trust elements */

  /* Strategic Accents */
  --color-successGreen: #2d7d32    /* Forest green for success states */
  --color-warningAmber: #f57c00    /* Amber for alerts/warnings */
  --color-infoBlue: #1565c0        /* Professional blue for info */
  --color-metallic: #8d9db6        /* Metallic blue-grey for subtle accents */

  Typography Hierarchy

  - Headings: Bold, clean sans-serif with gradient text for primary headings
  - Body text: text-gray-600 for readability on white backgrounds
  - Labels: text-gray-700 medium weight
  - Captions: text-gray-500 small size

  Layout & Spacing

  - Background: Clean white (bg-white) or light gray (bg-gray-50)
  - Cards: White background with subtle borders (border-gray-200)
  - Padding: Generous spacing using 4, 6, 8, 12, 16px increments
  - Margins: Consistent vertical rhythm with 4, 6, 8, 16, 24px spacing

  Shadow System

  /* Light, subtle shadows for depth without heaviness */
  shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
  shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
  shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)

  Component Patterns

  - Buttons: Orange primary (bg-orange-600) with hover states (hover:bg-orange-700)
  - Form inputs: White background, gray borders, orange focus rings
  - Cards: Rounded corners (rounded-lg), subtle borders, minimal shadows
  - Navigation: Clean horizontal/vertical layouts with subtle hover states

  Interactive States

  - Hover: Subtle color shifts, no dramatic transformations
  - Focus: Orange ring (focus:ring-orange-500) for accessibility
  - Active: Slightly darker shade of base color
  - Disabled: 50% opacity with cursor-not-allowed

  Brand Elements

  - Gradient text: bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600
  - Accent colors: Use sparingly for highlights and CTAs
  - Trust indicators: Deep navy blue for security-related elements

  Specific Desktop App Considerations

  - Window chrome: Clean, minimal title bars
  - Sidebars: Light gray backgrounds with white content areas
  - Status indicators: Use semantic colors (green for success, amber for warnings)
  - Data visualization: Clean charts with the brand color palette
  - Settings panels: Card-based layout with clear sections
  - Loading states: Subtle animations with brand colors

  Migration Strategy

  1. Start with core components (buttons, inputs, cards)
  2. Update layout containers and spacing
  3. Transform navigation and chrome elements
  4. Apply typography hierarchy consistently
  5. Add subtle shadows and polish

  This creates a cohesive, professional experience that matches the website while
  feeling native to a desktop application environment.