# Nucleo CRM store submission pack

## Release commands

```sh
bun run mobile:doctor
bun run mobile:release:android
bun run mobile:release:ios
```

Direct app-scoped commands:

```sh
bun run --cwd apps/mobile build:android
bun run --cwd apps/mobile submit:android
bun run --cwd apps/mobile build:ios
bun run --cwd apps/mobile submit:ios
```

## Bundle metadata

- App name: Nucleo CRM
- Android package: `com.nucleo.crm`
- iOS bundle ID: `com.nucleo.crm`
- URL scheme: `nucleocrm`
- Runtime version policy: `appVersion`

## Required environment and credentials

- `EXPO_PUBLIC_API_URL`
- `BETTER_AUTH_BASE_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- Google Play service account JSON for submission
- App Store Connect app record, API key, and `ascAppId`

## OAuth redirect URIs to register

- Google: `${BETTER_AUTH_BASE_URL}/api/auth/callback/google`
- GitHub: `${BETTER_AUTH_BASE_URL}/api/auth/callback/github`

The mobile app does not register provider callbacks directly. OAuth returns to Better Auth first, then the API bridge forwards the bearer token to the `nucleocrm://auth/callback` deep link.

## App Store copy

- Subtitle: Field-ready CRM for Nucleo teams
- Promotional text: Manage contacts, deals, and follow-ups from the field with the same live workspace used on the web.
- Keywords: CRM, sales, pipeline, contacts, deals, field sales, productivity, Nucleo
- Support URL: https://nucleo.one/support
- Marketing URL: https://nucleo.one
- Privacy policy URL: https://nucleo.one/privacy
- Category: Business

### Full description

Nucleo CRM gives revenue and operations teams a focused mobile workspace for staying close to the pipeline away from the desk. Review live contacts, monitor deal movement, capture activity, and switch between demo mode and authenticated workspaces with the same Better Auth account used on the web.

Built for fast field access, the app keeps secure session state on-device, supports Google and GitHub sign-in, and connects directly to the Nucleo One API for live CRM updates.

## Google Play listing

- Short description: Mobile CRM for contacts, deals, and field follow-up.
- Full description: Reuse the App Store long description above.
- Data safety: declare account info, app activity, and device identifiers if analytics remain enabled.
- Content rating: business/productivity workflow, no mature content.

## Review notes

- Sign-in options: email/password, Google, GitHub, and demo mode.
- Demo account: `demo@nucleo.one` / `password`
- If review needs production access, provide a seeded org and note any required allowlisting.

## Final pre-submit checklist

- Confirm `BETTER_AUTH_BASE_URL` points at the production auth host.
- Verify Google and GitHub apps include the production callback URLs.
- Upload latest screenshots for 6.7" iPhone, 5.5" iPhone, and Android phone.
- Confirm privacy policy and support links are live.
- Run `bun run mobile:doctor` and a final release build before submission.
