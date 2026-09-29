import fs from 'fs';
import path from 'path';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer-core';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { ProviderType } from './types.js';

interface PuppeteerExtraInstance {
  launch(options?: Record<string, unknown>): Promise<Browser>;
  connect(options?: Record<string, unknown>): Promise<Browser>;
  use(plugin: unknown): PuppeteerExtraInstance;
}

const pExtra = (
  (puppeteerExtra as unknown as { default?: PuppeteerExtraInstance }).default ||
  (puppeteerExtra as unknown as PuppeteerExtraInstance)
);

// Activate stealth plugin
pExtra.use(StealthPlugin());

export class BrowserManager {
  private static instance: BrowserManager;
  private browsers: Map<string, Browser> = new Map();
  private launching: Map<string, Promise<Browser>> = new Map();

  private constructor() {
    // Ensure base profile dirs exist
    for (const provider of ['gemini', 'chatgpt'] as const) {
      const dir = this.getProfileDir(provider);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public getProfileDir(provider: ProviderType): string {
    return path.resolve(env.STORAGE_DIR, 'profiles', provider);
  }

  private resolveExecutablePath(): string | undefined {
    if (env.CHROME_EXECUTABLE_PATH && fs.existsSync(env.CHROME_EXECUTABLE_PATH)) {
      return env.CHROME_EXECUTABLE_PATH;
    }

    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
    ];

    const linuxPaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];

    const candidates = process.platform === 'darwin' ? macPaths : linuxPaths;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return undefined;
  }

  public async getBrowser(provider: ProviderType): Promise<Browser> {
    const existing = this.browsers.get(provider);
    if (existing && existing.connected) {
      return existing;
    }

    // Check if launch is already in progress for this provider
    const inProgress = this.launching.get(provider);
    if (inProgress) {
      return inProgress;
    }

    const launchPromise = this.launchBrowser(provider);
    this.launching.set(provider, launchPromise);

    try {
      const browser = await launchPromise;
      this.browsers.set(provider, browser);
      return browser;
    } finally {
      this.launching.delete(provider);
    }
  }

  private async launchBrowser(provider: ProviderType): Promise<Browser> {
    const userDataDir = this.getProfileDir(provider);
    const executablePath = this.resolveExecutablePath();

    logger.info({ provider, userDataDir, executablePath }, '🚀 Initializing browser profile session');

    // If remote debugging port is configured, connect to it
    if (env.CHROME_REMOTE_DEBUGGING_PORT) {
      try {
        const browser = await pExtra.connect({
          browserURL: `http://127.0.0.1:${env.CHROME_REMOTE_DEBUGGING_PORT}`,
          defaultViewport: null
        });
        logger.info({ port: env.CHROME_REMOTE_DEBUGGING_PORT }, 'Connected to existing Chrome via remote debugging');
        return browser;
      } catch (err) {
        logger.warn({ err }, 'Failed to connect via remote debugging port, launching new instance');
      }
    }

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800',
      '--lang=en-US,en;q=0.9',
      '--disable-features=IsolateOrigins,site-per-process'
    ];

    // Note: Do NOT add --enable-automation or headless mode during live interaction/anti-detection
    const browser = await pExtra.launch({
      headless: false,
      executablePath,
      userDataDir,
      args,
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: {
        width: 1280,
        height: 800,
        deviceScaleFactor: 1
      }
    });

    browser.on('disconnected', () => {
      logger.warn({ provider }, 'Browser instance disconnected');
      this.browsers.delete(provider);
    });

    return browser;
  }

  public async createPage(provider: ProviderType): Promise<Page> {
    const browser = await this.getBrowser(provider);
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
    );

    // Anti-detection evasion overrides
    await page.evaluateOnNewDocument(() => {
      // Pass the Webdriver Test
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });
      // Pass the Chrome Test
      (window as unknown as { chrome: { runtime: Record<string, unknown> } }).chrome = {
        runtime: {}
      };
      // Pass the Plugins Length Test
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
      // Pass the Languages Test
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    });

    return page;
  }

  public async takeFailureScreenshot(page: Page, jobId: string): Promise<string> {
    try {
      const screenshotsDir = path.resolve(env.STORAGE_DIR, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }
      const filename = `fail_${jobId}_${Date.now()}.png`;
      const fullPath = path.join(screenshotsDir, filename);
      await page.screenshot({ path: fullPath, fullPage: false });
      return `/storage/screenshots/${filename}`;
    } catch (err) {
      logger.error({ err, jobId }, 'Failed to capture error screenshot');
      return '';
    }
  }

  public async closeBrowser(provider: ProviderType): Promise<void> {
    const browser = this.browsers.get(provider);
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        logger.warn({ err, provider }, 'Error closing browser');
      } finally {
        this.browsers.delete(provider);
      }
    }
  }

  public async closeAll(): Promise<void> {
    for (const [provider] of this.browsers.entries()) {
      await this.closeBrowser(provider as ProviderType);
    }
  }
}
