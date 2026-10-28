# Web workflow checks

These checks intercept application API requests and use fixture data. They do not send writes to the live server.

1. Run `npm ci` in `client`.
2. Install a Playwright Chromium browser with `npx playwright install chromium`, or set `CHROME_PATH` to an existing Chrome/Chromium executable.
3. Start the app in another terminal with `npm run dev -- --host 127.0.0.1 --port 5178 --strictPort`.
4. Run `npm run test:workflows`. Set `EATWHAT_TEST_URL` if using a different local address.

The test covers desktop and mobile navigation, light and dark themes, dashboard, mobile recipe pagination and out-of-order searches, recipe and memory loading failures, preserving existing meals during wishlist scheduling, calendar load failures and version-checked deletion, recovering uncertain wish-to-meal creation and attachment, linking an existing meal and navigating to scheduling, album loading and preview, week-plan confirmation and partial-write warnings, shopping-list confirmation and request locking, retrying a failed memory load without losing a pending draft, validating photo selection, anniversary-template confirmation and uncertain-save recovery, recipe editing and unsaved-change and conflict guards, settings load failure and draft preservation, and login by Enter, duplicate-submit prevention, safe redirects and username-only credential migration. Screenshots are written to the system temporary directory unless `EATWHAT_DESKTOP_SHOT` and `EATWHAT_MOBILE_SHOT` specify other paths.
