# PWA Setup Guide for APOXER.COM

## ✅ What's Been Set Up

1. **Web App Manifest** (`/public/site.webmanifest`)
   - App name, description, theme colors
   - Display mode: standalone
   - App shortcuts for quick access

2. **Service Worker** (`/public/sw.js`)
   - Offline caching
   - Network-first strategy for API calls
   - Cache-first for static assets

3. **Install Prompt Component** (`/src/components/InstallPrompt.tsx`)
   - Automatic install prompt for Android/Desktop
   - iOS-specific instructions
   - Smart dismissal (won't show again for 7 days)

4. **Mobile Optimizations**
   - Viewport meta tags
   - Safe area insets for notched devices
   - Prevent pull-to-refresh
   - Tap highlight colors

## 📱 Required Icons

You need to create the following icon files in `/public`:

### Required Icons:
- `icon-192.png` - 192x192px (for Android)
- `icon-512.png` - 512x512px (for Android)
- `apple-touch-icon.png` - 180x180px (for iOS)

### How to Generate Icons:

1. **Using Online Tools:**
   - Visit https://realfavicongenerator.net/
   - Upload your logo (use `/public/logo.png`)
   - Generate all sizes
   - Download and place in `/public`

2. **Using ImageMagick (CLI):**
   ```bash
   # Convert logo.png to required sizes
   convert public/logo.png -resize 192x192 public/icon-192.png
   convert public/logo.png -resize 512x512 public/icon-512.png
   convert public/logo.png -resize 180x180 public/apple-touch-icon.png
   ```

3. **Using Figma/Design Tools:**
   - Export logo at 192x192, 512x512, and 180x180
   - Save as PNG with transparent background (if applicable)
   - Place in `/public` directory

## 🚀 Testing the PWA

### Desktop (Chrome/Edge):
1. Open the app in browser
2. Look for install icon in address bar
3. Or use the install prompt that appears
4. App should install and open in standalone window

### Android:
1. Open the app in Chrome
2. Tap menu (3 dots) → "Install app" or "Add to Home screen"
3. Or use the install prompt
4. App icon appears on home screen

### iOS (Safari):
1. Open the app in Safari
2. Tap Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize name if needed
5. Tap "Add"

## 🔧 Configuration

### Service Worker Cache:
Edit `/public/sw.js` to customize:
- Cache name (change `CACHE_NAME` variable)
- URLs to cache on install
- Cache strategies

### Manifest Settings:
Edit `/public/site.webmanifest` to customize:
- App name and description
- Theme colors
- Display mode
- Shortcuts

### Install Prompt:
Edit `/src/components/InstallPrompt.tsx` to customize:
- Dismissal duration (currently 7 days)
- Prompt styling
- iOS instructions text

## 📝 Next Steps

1. **Generate Icons:**
   - Create the required icon files (see above)
   - Ensure they're optimized (compressed PNGs)

2. **Test on Real Devices:**
   - Test on Android phone
   - Test on iPhone/iPad
   - Test on desktop browsers

3. **Verify HTTPS:**
   - PWA requires HTTPS (except localhost)
   - Ensure production site uses HTTPS

4. **Test Offline Mode:**
   - Install the app
   - Turn off network
   - Verify cached pages still work

5. **Update Service Worker:**
   - When you update the app, increment `CACHE_NAME` version
   - This forces cache refresh for users

## 🐛 Troubleshooting

### Install prompt not showing:
- Check browser console for errors
- Verify manifest is accessible at `/site.webmanifest`
- Ensure HTTPS is enabled (required for PWA)
- Check if app is already installed

### Service worker not registering:
- Check browser console for errors
- Verify `/sw.js` is accessible
- Check browser supports service workers
- Try clearing browser cache

### Icons not showing:
- Verify icon files exist in `/public`
- Check file sizes match manifest
- Ensure icons are valid PNG files
- Clear browser cache and reinstall

## 📚 Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
