# Design Guidelines: App Review Summarizer

## Design Approach

**Selected Approach:** Design System (Utility-Focused)

**Justification:** This is a data-analysis tool requiring clarity, efficiency, and information density. The application prioritizes usability and quick comprehension over visual storytelling.

**Design Philosophy:** Inspired by Linear's precision and Vercel's restraint, combined with data visualization best practices. The design emphasizes clean hierarchy, generous whitespace for complex information, and purposeful interactions.

**Core Principles:**
1. Information clarity over decoration
2. Purposeful spacing that creates breathing room around dense data
3. Consistent, predictable patterns for quick learning
4. Performance-optimized interactions

---

## Typography

**Font Families:**
- Primary: Inter (via Google Fonts) - body text, UI elements, data
- Monospace: JetBrains Mono (via Google Fonts) - numerical data, ratings, technical info

**Type Scale:**
- Hero/H1: text-5xl font-bold (48px) - Home page headline
- H2: text-3xl font-semibold (30px) - Page sections, "Your app analysis"
- H3: text-xl font-semibold (20px) - Card headers
- Body Large: text-lg (18px) - Input labels, important UI text
- Body: text-base (16px) - Standard text, review content
- Small: text-sm (14px) - Metadata, timestamps
- Tiny: text-xs (12px) - Labels, helper text

**Font Weights:**
- Regular (400): Body text, descriptions
- Medium (500): Labels, subheadings
- Semibold (600): Section headers, card titles
- Bold (700): Main headlines, emphasis

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24**
- Micro spacing (p-2, gap-2): Between related elements
- Standard spacing (p-4, p-6, gap-4): Component padding, grid gaps
- Section spacing (p-8, p-12): Card internal padding
- Large spacing (p-16, p-20, p-24): Page sections, vertical rhythm

**Container Strategy:**
- Home Page: max-w-2xl mx-auto (centered, focused input)
- Analysis Page: max-w-7xl mx-auto (wide for data display)
- Mobile: px-4, Desktop: px-8

**Grid System:**
- Analysis Cards: grid-cols-1 md:grid-cols-3 gap-6
- Review Table: Full-width with responsive scroll
- Chart Area: Full container width

---

## Component Library

### Home Page Components

**Hero Section:**
- Height: min-h-screen flex items-center justify-center
- Vertical centering with generous top/bottom padding (py-20)
- Content: Centered column (flex flex-col items-center gap-8)

**Header:**
- H1 headline: text-5xl font-bold text-center
- Subtitle: text-xl text-center max-w-xl with reduced opacity
- Spacing between: gap-4

**Input Form:**
- Container: w-full max-w-2xl
- Input field: h-14 px-6 rounded-lg border-2 with focus ring
- Typography: text-lg
- Submit button: h-14 px-8 rounded-lg font-semibold
- Form layout: flex flex-col md:flex-row gap-4

**Loading Spinner:**
- Centered: flex items-center justify-center min-h-screen
- Spinner: w-12 h-12 animate-spin
- Loading text: text-lg below spinner with gap-4

### Analysis Page Components

**Page Header:**
- Container: mb-12
- H2: "Your app analysis" with app name displayed
- App metadata row: flex items-center gap-4 (store badge, total reviews)

**Info Cards (3-column grid):**
- Card structure: p-8 rounded-xl border
- Icon area: w-12 h-12 rounded-lg mb-4
- Card title: text-sm font-medium uppercase tracking-wide
- Main value: text-4xl font-bold mt-2
- Supporting text: text-sm mt-2

**Category Lists (Positive/Negative):**
- Display as: flex flex-wrap gap-2
- Each tag: px-4 py-2 rounded-full text-sm font-medium
- Hover state: subtle scale transform

**Top Negative Reviews Table:**
- Container: rounded-xl border overflow-hidden
- Header: p-6 border-b
- Row structure: p-6 border-b last:border-0
- Review text: text-base line-clamp-2 (truncate long reviews)
- Mobile: Stack rating and review vertically

**Trend Chart:**
- Container: p-8 rounded-xl border
- Chart height: h-80
- Chart.js configuration: Clean grid, minimal styling
- Responsive: Full width, auto height on mobile

**Action Button:**
- "Try another app": Fixed position or page bottom
- Size: px-6 py-3 rounded-lg font-semibold
- Icon: Include arrow or refresh icon from Heroicons

### Shared Components

**Error States:**
- Container: rounded-xl border p-8 text-center
- Icon: w-16 h-16 mx-auto mb-4
- Message: text-lg font-medium
- Helper text: text-sm mt-2

**Empty States:**
- Similar structure to error states
- Illustration or icon-based
- Action prompt with button

---

## Interaction Patterns

**Hover States:**
- Cards: subtle elevation (shadow-lg transition)
- Buttons: slight scale (scale-105) and shadow increase
- Category tags: slight brightness shift

**Focus States:**
- Input fields: ring-2 ring-offset-2 with smooth transition
- Buttons: ring-2 outline style
- Keyboard navigation: Clear visible focus indicators

**Transitions:**
- Duration: transition-all duration-200 (standard)
- Page transitions: Fade in content with stagger effect
- Chart animations: 300ms ease-in-out

**Loading States:**
- Skeleton loaders for cards during data fetch
- Spinner for initial analysis
- Progress indicator for multi-step processes

---

## Responsive Behavior

**Breakpoints:**
- Mobile: Base (< 768px)
- Tablet: md (768px+)
- Desktop: lg (1024px+)

**Mobile Adaptations:**
- Stack 3-column card grid to single column
- Convert trend chart to scrollable on small screens
- Increase touch targets to min-h-12
- Reduce font sizes by one step (text-5xl → text-4xl)
- Full-width buttons on mobile

**Desktop Enhancements:**
- Multi-column layouts for data density
- Larger chart visualization
- Hover states more pronounced
- Side-by-side form elements

---

## Icon System

**Icon Library:** Heroicons (outline for UI, solid for emphasis)
**Icon Sizes:**
- Small: w-4 h-4 (inline with text)
- Medium: w-6 h-6 (buttons, labels)
- Large: w-12 h-12 (cards, empty states)

**Icon Usage:**
- Input field: Search/link icon prefix
- Cards: Category-specific icons (thumbs up/down, star, chart)
- Buttons: Trailing arrows for actions
- Error/success: Alert icons

---

## Data Visualization

**Chart Styling:**
- Grid: Subtle, minimal opacity
- Lines: 2px stroke width, smooth curves
- Points: Visible on hover
- Axes: Clean labels, adequate spacing
- Legend: Below chart, horizontal layout
- Tooltips: Rounded with shadow, clear typography

**Table Design:**
- Striped rows for readability
- Header: Sticky on scroll, font-semibold
- Cell padding: px-6 py-4
- Borders: Subtle dividers
- Responsive: Horizontal scroll with visible scrollbar

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators: Always visible, 2px ring
- Semantic HTML: Proper heading hierarchy
- ARIA labels: For icons, interactive elements
- Keyboard navigation: Tab order follows visual flow
- Screen reader: Announce loading states, errors
- Form validation: Clear error messages below fields

---

## Performance Considerations

- Lazy load chart library (Chart.js)
- Debounce input validation
- Skeleton loaders prevent layout shift
- Optimize icon loading (use icon font or sprite)
- Minimize animation complexity
- Virtualize long review lists if >50 items