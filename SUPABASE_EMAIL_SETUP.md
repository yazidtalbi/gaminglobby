# Supabase Email Verification Template Setup

## Email Subject Line

```
Welcome to APOXER, {{.username }}!
```

**Note:** If `{{.username }}` doesn't work in your Supabase setup, you can:
- Use `{{ .Email }}` instead
- Or use the version without username: `Welcome to APOXER!`

## Where to Paste the Template

1. Log in to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select **Confirm signup** (Email verification)
4. Paste the HTML template into the **Email Body** field
5. Set the **Subject** field to: `Welcome to APOXER, {{.username }}!`
6. Click **Save**

**Template Options:**
- `supabase-email-verification-template.html` - Without username in title
- `supabase-email-verification-template-with-username.html` - With username in title (matches your subject line)

## Template Features

- ✅ Dark navy background (#0f172a) with lighter card (#1e293b)
- ✅ Centered layout, max-width 600px
- ✅ Logo from favicon.ico (36px, centered)
- ✅ Cyan accent color (#06b6d4) for buttons and links
- ✅ Email-client safe: tables only, inline CSS
- ✅ Responsive and mobile-friendly
- ✅ Fallback text for blocked images
- ✅ All Supabase variables properly included:
  - `{{ .ConfirmationURL }}` - Verification link
  - `{{ .Email }}` - User's email address
  - `{{ .SiteURL }}` - Site base URL
  - `{{.username }}` - Username (in the version with username)

**Important Notes:**
- **Preview shows raw variables**: This is normal! Supabase's preview doesn't replace variables with test data. Variables will be replaced when the actual email is sent. You'll see `{{ .Email }}` and `{{.username }}` as literal text in preview - this is expected behavior.
- **Username variable**: The `{{.username }}` variable works if Supabase is configured to provide it. If it doesn't work:
  - Use the template without username (`supabase-email-verification-template.html`)
  - Or test by sending an actual verification email to see if the variable is populated

## Testing

After saving, test the email by:
1. Creating a new user account
2. Checking the email inbox for the verification email
3. Verifying the button and fallback link both work correctly

## Customization

To customize colors:
- Background: Change `#0f172a` (dark navy)
- Card: Change `#1e293b` (lighter navy)
- Accent: Change `#06b6d4` (cyan) to your preferred color
- Text: Adjust `#cbd5e1` (light gray) and `#94a3b8` (medium gray)
