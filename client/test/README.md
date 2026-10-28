# Web workflow checks

These checks intercept application API requests and use fixture data. They do not send writes to the live server.

1. Run `npm ci` in `client`.
2. Install a Playwright Chromium browser with `npx playwright install chromium`, or set `CHROME_PATH` to an existing Chrome/Chromium executable.
3. Start the app in another terminal with `npm run dev -- --host 127.0.0.1 --port 5178 --strictPort`.
4. Run `npm run test:workflows`. Set `EATWHAT_TEST_URL` if using a different local address.

The test covers desktop and mobile navigation, dashboard, preserving existing meals during wishlist scheduling, the failed-load guard, sending a dish to the wishlist, attaching a created dish to a wish, week-plan confirmation, shopping-list confirmation, and opening a memory draft without an automatic write. Screenshots are written to the system temporary directory unless `EATWHAT_DESKTOP_SHOT` and `EATWHAT_MOBILE_SHOT` specify other paths.
