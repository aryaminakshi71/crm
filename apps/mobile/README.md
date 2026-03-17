# Nucleo CRM Mobile

Native Android and iOS companion app for the Nucleo web CRM.

## Local development

1. Start the API from the repo root:

```sh
bun run dev:api
```

2. Start Expo:

```sh
bun run --cwd apps/mobile start
```

If Metro starts warning about duplicate modules in the Bun workspace, reset the
mobile workspace shell and reinstall from the repo root:

```sh
bun run mobile:reset
bun install
```

The mobile app now ships with a dedicated Metro monorepo config so Expo
resolves React Native packages from the workspace root instead of stale nested
installs.

3. Choose the correct API base URL in the app's `Setup` tab:

- Android emulator: `http://10.0.2.2:8787`
- iOS simulator: `http://127.0.0.1:8787`
- Physical device: `http://<your-lan-ip>:8787`

## Authentication

- Demo mode uses `demo-org` and works without login.
- Email/password sign-in uses Better Auth and stores a bearer token in `expo-secure-store`.
- Google and GitHub use the same Better Auth backend as the web app, open the system browser, and return a bearer token through the `/api/mobile/auth/*` bridge.
- Session restore runs on app launch.

For OAuth to work on device builds, configure `BETTER_AUTH_BASE_URL` on the API
to the public host registered with Google and GitHub, for example
`https://api.nucleo.one`.

## Build commands

```sh
bun run --cwd apps/mobile build:android
bun run --cwd apps/mobile build:ios
```

Preview and development client profiles are also available:

```sh
bun run --cwd apps/mobile build:android:preview
bun run --cwd apps/mobile build:ios:preview
bun run --cwd apps/mobile build:android:dev
bun run --cwd apps/mobile build:ios:dev
```

Production release + submit shortcuts:

```sh
bun run mobile:release:android
bun run mobile:release:ios
```

Store copy, privacy, keywords, and review metadata are collected in
[store-submission.md](store-submission.md).
