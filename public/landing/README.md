# Landing Page Images

Add the following images to this directory:

## Required Images

| Filename | Usage | Recommended Size | Notes |
|----------|-------|-----------------|-------|
| `hero.png` | Hero section (right side) | 1200x900px | Main app screenshot, lobby list view |
| `teammates.jpg` | Problem/Solution section | 2100x900px | Wide banner, gamers connecting |
| `step-create-lobby.png` | How It Works step 1 | 800x450px | Creating a lobby screenshot |
| `step-match.png` | How It Works step 2 | 800x450px | Matching with players screenshot |
| `step-chat.png` | How It Works step 3 | 800x450px | Chat/lobby communication screenshot |
| `feature-chat.png` | Feature card | 600x300px | Real-time chat UI crop |
| `feature-matchmaking.png` | Feature card | 600x300px | Matchmaking algorithm visualization |
| `feature-filters.png` | Feature card | 600x300px | Platform/filter selection UI |
| `feature-games.png` | Feature card | 600x300px | Game library/browse view |
| `stats-bg.png` | Stats section background | 1920x600px | Blurred, abstract gaming background |
| `pricing-free.png` | Free tier card | 800x450px | Free features preview |
| `pricing-pro.png` | Pro tier card | 800x450px | Pro features preview (auto-invite, etc.) |
| `blog-1.jpg` | Blog card 1 | 800x450px | Competitive gaming imagery |
| `blog-2.jpg` | Blog card 2 | 800x450px | Multiplayer games imagery |
| `blog-3.jpg` | Blog card 3 | 800x450px | Matchmaking tips imagery |
| `blog-4.jpg` | Blog card 4 | 800x450px | Community/success stories imagery |
| `final-cta.png` | Final CTA background | 1920x800px | Gaming atmosphere, blur-friendly |

## Image Guidelines

- **Format**: PNG for UI screenshots, JPG for photos
- **Optimization**: Compress images before adding (use TinyPNG, ImageOptim, or similar)
- **Dark theme**: All images should work well on dark backgrounds
- **No text overlays**: Avoid baked-in text (handled by components)
- **Safe zones**: Keep important content away from edges (gradients applied)

## Tips for Screenshots

1. Use the actual Apoxer app in dark mode
2. Capture at 2x resolution for retina displays
3. Include realistic (but not real user) data
4. Show the UI in its best state (no loading spinners, errors)

## Placeholder Alternative

If you need placeholder images temporarily, you can use:

```bash
# Generate placeholder images with ImageMagick
convert -size 1200x900 xc:#1e293b -fill '#0891b2' -draw "rectangle 100,100 1100,800" hero.png
```

Or use a service like `https://placehold.co/1200x900/1e293b/0891b2`
