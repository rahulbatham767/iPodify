---
name: Cyanide Tech
colors:
  surface: '#10141a'
  surface-dim: '#10141a'
  surface-bright: '#353940'
  surface-container-lowest: '#0a0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2eb'
  on-surface-variant: '#c0c6d6'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#8b91a0'
  outline-variant: '#414754'
  surface-tint: '#a9c7ff'
  primary: '#a9c7ff'
  on-primary: '#003063'
  primary-container: '#3d90ff'
  on-primary-container: '#002957'
  inverse-primary: '#005db7'
  secondary: '#b0cadf'
  on-secondary: '#193344'
  secondary-container: '#304a5b'
  on-secondary-container: '#9eb8cd'
  tertiary: '#00dbe9'
  on-tertiary: '#00363a'
  tertiary-container: '#00a0aa'
  on-tertiary-container: '#002f33'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#00468c'
  secondary-fixed: '#cbe6fc'
  secondary-fixed-dim: '#b0cadf'
  on-secondary-fixed: '#011e2e'
  on-secondary-fixed-variant: '#304a5b'
  tertiary-fixed: '#7df4ff'
  tertiary-fixed-dim: '#00dbe9'
  on-tertiary-fixed: '#002022'
  on-tertiary-fixed-variant: '#004f54'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  display-tech:
    fontFamily: Space Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.05em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  bezel-width: 2px
---

## Brand & Style
This design system captures the industrial optimism of the mid-2000s mobile era. It leans heavily into a **High-Fidelity Industrial** style, blending the tactile mechanical feel of hardware like the Motorola RAZR with the digital glow of early Bluetooth interfaces. 

The aesthetic is characterized by:
- **Metallic Skeuomorphism:** Interfaces are treated as physical hardware panels with "chrome" bezels and brushed textures.
- **Luminescent Accents:** High-contrast electric blue glows that mimic backlit keypads and LED indicators.
- **Technical Precision:** Use of grid-based signal patterns and technical readout motifs to evoke a sense of high-performance connectivity.
- **Tactile Depth:** Elements use inner glows and sharp highlights to appear extruded or "clicked into" a physical device frame.

## Colors
The palette is rooted in a "Deep Space" environment to allow glowing accents to pop with maximum intensity.

- **Primary (Electric Cyan):** Used for active states, connectivity indicators, and primary call-to-actions. It should always be accompanied by an outer glow or "bloom" effect.
- **Secondary (Chrome/Steel):** A desaturated, metallic blue-grey used for bezels, borders, and inactive hardware-like elements.
- **Tertiary (LED Green/Blue):** A vibrant cyan used exclusively for status updates, signal bars, and "Success" states.
- **Neutral (Obsidian):** The foundation. Pure blacks and deep navy provide the "glass screen" backdrop.

**Gradients:** Use radial gradients for buttons (center #0082FC to outer #004586) to mimic the look of backlit plastic.

## Typography
The typography system relies on a "Dual-Layer" approach: **Status vs. Function**.

- **Technical Readouts:** Use *Space Mono* for all data-driven text, timers, signal levels, and metadata. This font should often have a subtle text-shadow of its own color to simulate an LCD screen glow.
- **Functional UI:** Use *Space Grotesk* for headlines to provide a modern, technical edge, and *Hanken Grotesk* for body copy to ensure high legibility within list-heavy "contacts" or "settings" menus.
- **All-Caps:** Labels and sub-headers should use uppercase mono-spacing to mimic the constrained displays of early 2000s handsets.

## Layout & Spacing
The layout follows a **Rigid Frame** philosophy. Instead of a fluid, open-web feel, the UI should feel "contained" within a device screen.

- **The Bezel Frame:** Every primary container should have a 2px inner border (Chrome) and a 1px outer black stroke.
- **Grid:** Use a strict 4px baseline grid. Components should be chunky, prioritizing vertical lists that feel like a scrollable phone menu.
- **Safe Zones:** Maintain a 20px "Screen Margin" inside the hardware bezels. 
- **Reflow:** On mobile, components stack into a single column. On desktop, the "Device" container remains fixed-width (max 480px) centered on a brushed-metal background to maintain the "handheld" illusion.

## Elevation & Depth
Depth is achieved through **Physical Layering** rather than abstract shadows.

- **Base Layer:** The "Screen" (#0A0E14) with a subtle diagonal scanline pattern at 5% opacity.
- **Mid Layer:** Glassmorphic panels with a `backdrop-filter: blur(12px)` and a 1px white border at 10% opacity (the glass edge).
- **Top Layer:** Chrome bezels and tactile buttons. Buttons should use a 2px "Extrusion" effect (top-left highlight, bottom-right dark shadow).
- **Glows:** Active elements emit a #0082FC bloom with a spread of 15-20px and low opacity (20%) to simulate light leaking from a backlit button.

## Shapes
The shape language is "Soft-Industrial." Avoid perfect circles except for status LEDs.

- **Primary Containers:** Use `0.5rem` (Soft) for device frames to mimic injection-molded plastic.
- **Interactive Elements:** Buttons and Inputs use a tighter `0.25rem` radius to feel like physical keycaps.
- **Signal Elements:** Use sharp, non-rounded vertical bars for signal strength and battery indicators to maintain a technical, pixel-accurate aesthetic.

## Components
### Buttons
Chunky, tactile rectangles with a radial gradient. Hover states should "light up" the text with a cyan glow. Use a 1px inset border to create a "pressed into the frame" look for active states.

### Device Cards
Used for selecting Bluetooth devices or media. These are high-gloss glass panels with a 1px chrome border. Icons on these cards should be "Monoline Tech" style.

### Signal Indicators
Instead of standard progress bars, use segmented vertical blocks (5-7 bars). Fill them from left to right with a #00F0FF gradient to show progress, volume, or signal strength.

### Input Fields
Styled to look like small LCD cutout windows. The background is slightly darker than the main screen, with a subtle "inner shadow" to imply depth.

### LED Status Bulbs
Circular indicators that exist outside of buttons. They have three states: Off (Dark Grey), Searching (Pulse Blue), and Connected (Solid Cyan with Bloom).

### Lists
High-contrast text on a dark background. The selection highlight should be a full-width horizontal bar of #0082FC with 40% opacity, evoking early list-based OS navigation.