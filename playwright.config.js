import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:3000${process.env.BASE_URL || '/'}`
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    workers: 2,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    timeout: 45000,
    expect: { timeout: 15000 },
    reporter: [['list'], ['html', { open: 'never' }]],
    use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
        command: 'npm run dev', url: new URL('favicon/favicon-32x32.png', baseURL).href, reuseExistingServer: !process.env.CI, timeout: 120000
    }
})
