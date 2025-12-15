# Why PWA Install Might Not Work on Mobile

## Common Reasons

### 1. **HTTPS Requirement**
- Mobile browsers (especially Chrome on Android) require HTTPS for PWA installation
- Localhost works for development, but production must use HTTPS
- Check if your site is served over HTTPS

### 2. **Service Worker Registration**
- The service worker must be successfully registered
- Check browser console for service worker errors
- Verify `/sw.js` is accessible and returns 200 status

### 3. **Manifest Issues**
- Manifest must be valid JSON
- Icons must exist and be accessible
- `start_url` must be within the scope
- Check: Open DevTools → Application → Manifest

### 4. **Browser Support**
- **Chrome/Edge (Android)**: Full support ✅
- **Safari (iOS)**: Does NOT support `beforeinstallprompt` event ❌
  - iOS users must manually add to home screen via Share menu
- **Firefox (Android)**: Limited support
- **Samsung Internet**: Full support ✅

### 5. **Already Installed**
- If the app is already installed, the prompt won't show
- Check: `window.matchMedia('(display-mode: standalone)').matches`

### 6. **User Engagement**
- Some browsers require user interaction before showing install prompt
- User must visit the site multiple times
- Must spend some time on the site

## How to Debug

1. **Check Service Worker**:
   - Open DevTools → Application → Service Workers
   - Verify it's registered and active

2. **Check Manifest**:
   - Open DevTools → Application → Manifest
   - Look for validation errors
   - Verify all icons are loading

3. **Check Console**:
   - Look for errors related to service worker or manifest
   - Check if `beforeinstallprompt` event fires

4. **Test on Different Browsers**:
   - Chrome on Android (best support)
   - Samsung Internet
   - Firefox (limited)

## For iOS (Safari)

iOS Safari does NOT support the `beforeinstallprompt` event. Users must:
1. Tap the Share button (square with arrow)
2. Scroll down and tap "Add to Home Screen"
3. Customize name if needed
4. Tap "Add"

This is a limitation of iOS Safari, not your app.

## Quick Fixes

1. **Ensure HTTPS**: Deploy to production with HTTPS
2. **Verify Icons**: Make sure `/icon-192.png` and `/icon-512.png` exist
3. **Check Manifest**: Validate at https://manifest-validator.appspot.com/
4. **Test Service Worker**: Verify it's registering correctly
5. **Clear Cache**: Clear browser cache and try again

## Testing Checklist

- [ ] Site is served over HTTPS (or localhost)
- [ ] Service worker is registered (check DevTools)
- [ ] Manifest is valid (check DevTools)
- [ ] Icons exist and are accessible
- [ ] Testing on supported browser (Chrome Android, Samsung Internet)
- [ ] App is not already installed
- [ ] User has interacted with the site
