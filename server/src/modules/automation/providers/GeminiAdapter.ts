import type { Page } from 'puppeteer-core';
import { BrowserManager } from '../BrowserManager.js';
import { GEMINI_SELECTORS } from '../selectors.js';
import type {
  ProviderAdapter,
  TabHandle,
  PromptOptions,
  ImageOptions,
  ProviderHealth,
  SessionStatus
} from '../types.js';
import { ProviderError } from '../../../errors/AppError.js';
import { ProviderSession } from '../../../models/ProviderSession.js';
import { logger } from '../../../utils/logger.js';

export class GeminiAdapter implements ProviderAdapter {
  public readonly provider = 'gemini' as const;
  private browserManager = BrowserManager.getInstance();

  public async ensureSession(): Promise<SessionStatus> {
    try {
      const page = await this.browserManager.createPage(this.provider);
      await page.goto(GEMINI_SELECTORS.homeUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Check if logged in indicator exists
      const isLoggedIn = await this.checkLoggedIn(page);
      await page.close();

      const status: SessionStatus = isLoggedIn ? 'connected' : 'login_required';
      await ProviderSession.findOneAndUpdate(
        { provider: this.provider },
        { status, lastCheckedAt: new Date() },
        { upsert: true }
      );

      return status;
    } catch (err) {
      logger.error({ err }, 'Gemini ensureSession error');
      await ProviderSession.findOneAndUpdate(
        { provider: this.provider },
        { status: 'error', lastCheckedAt: new Date() },
        { upsert: true }
      );
      return 'error';
    }
  }

  private async checkLoggedIn(page: Page): Promise<boolean> {
    // Check for login buttons
    for (const sel of GEMINI_SELECTORS.loginIndicators) {
      const el = await page.$(sel);
      if (el) return false;
    }

    // Check for logged-in indicators
    for (const sel of GEMINI_SELECTORS.loggedInIndicators) {
      const el = await page.$(sel);
      if (el) return true;
    }

    // Check URL
    const url = page.url();
    if (url.includes('accounts.google.com')) return false;

    // Check presence of chat input
    for (const sel of GEMINI_SELECTORS.inputs) {
      const input = await page.$(sel);
      if (input) return true;
    }

    return false;
  }

  public async newChat(): Promise<TabHandle> {
    const page = await this.browserManager.createPage(this.provider);
    await page.goto(GEMINI_SELECTORS.homeUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    const isLoggedIn = await this.checkLoggedIn(page);
    if (!isLoggedIn) {
      await page.close();
      throw new ProviderError(
        'gemini',
        'LOGIN_REQUIRED',
        'Gemini session requires login. Connect via the Connections tab.'
      );
    }

    return {
      id: `gemini_tab_${Date.now()}`,
      provider: 'gemini',
      page,
      createdAt: new Date()
    };
  }

  public async sendPrompt(tab: TabHandle, prompt: string, opts?: PromptOptions): Promise<{ text: string }> {
    const page = tab.page;
    if (!page || page.isClosed()) {
      throw new ProviderError('gemini', 'BROWSER_CRASH', 'Chat tab is closed or invalid');
    }

    const timeoutMs = opts?.timeoutMs || 90000;

    // 1. Locate chat input
    let inputHandle = null;
    for (const sel of GEMINI_SELECTORS.inputs) {
      try {
        const el = await page.waitForSelector(sel, { visible: true, timeout: 5000 });
        if (el) {
          inputHandle = el;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!inputHandle) {
      throw new ProviderError(
        'gemini',
        'SELECTOR_MISMATCH',
        'Could not locate Gemini prompt input area'
      );
    }

    // Focus and type prompt
    await inputHandle.click();
    await page.keyboard.down('Meta');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Meta');
    await page.keyboard.press('Backspace');

    const formattedPrompt = opts?.systemHint
      ? `[SYSTEM INSTRUCTION: ${opts.systemHint}]\n\n${prompt}`
      : prompt;

    // Type prompt chunks with small human-like cadence
    await page.keyboard.type(formattedPrompt, { delay: 10 });

    // 2. Submit prompt
    let submitted = false;
    for (const btnSel of GEMINI_SELECTORS.submitButtons) {
      try {
        const btn = await page.$(btnSel);
        if (btn) {
          const isVisible = await btn.isIntersectingViewport();
          if (isVisible) {
            await btn.click();
            submitted = true;
            break;
          }
        }
      } catch {
        continue;
      }
    }

    if (!submitted) {
      // Fallback: press Enter
      await page.keyboard.press('Enter');
    }

    // 3. Wait for response generation and DOM stabilization
    const responseText = await this.waitForResponseStabilization(page, timeoutMs);
    return { text: responseText };
  }

  private async waitForResponseStabilization(page: Page, timeoutMs: number): Promise<string> {
    const startTime = Date.now();

    // Check for rate limits or captchas
    await this.checkForErrors(page);

    // Wait until response begins or stop button appears/disappears
    let previousText = '';
    let stableCount = 0;

    while (Date.now() - startTime < timeoutMs) {
      await this.checkForErrors(page);

      // Extract current assistant response
      const currentText = await page.evaluate((selectors: string[]) => {
        for (const sel of selectors) {
          const elements = document.querySelectorAll(sel);
          if (elements.length > 0) {
            const last = elements[elements.length - 1];
            return (last as HTMLElement).innerText || last.textContent || '';
          }
        }
        return '';
      }, GEMINI_SELECTORS.responseContainers);

      // Check if stop button is active
      let isGenerating = false;
      for (const stopSel of GEMINI_SELECTORS.stopButtons) {
        const stopBtn = await page.$(stopSel);
        if (stopBtn) {
          isGenerating = true;
          break;
        }
      }

      if (currentText.trim().length > 0 && currentText === previousText && !isGenerating) {
        stableCount++;
        // If content is non-empty and unchanged for 3 consecutive checks (1.5s total), it has completed
        if (stableCount >= 3) {
          return currentText.trim();
        }
      } else {
        stableCount = 0;
      }

      previousText = currentText;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (previousText.trim().length > 0) {
      return previousText.trim();
    }

    throw new ProviderError('gemini', 'TIMEOUT', `Gemini response timed out after ${timeoutMs}ms`);
  }

  private async checkForErrors(page: Page): Promise<void> {
    const pageText = await page.evaluate(() => document.body.innerText || '');

    for (const indicator of GEMINI_SELECTORS.rateLimitIndicators) {
      const clean = indicator.replace(/text="|"/g, '');
      if (pageText.includes(clean)) {
        throw new ProviderError('gemini', 'RATE_LIMITED', `Rate limit triggered: "${clean}"`);
      }
    }

    for (const indicator of GEMINI_SELECTORS.captchaIndicators) {
      const clean = indicator.replace(/text="|"/g, '');
      if (pageText.includes(clean)) {
        throw new ProviderError('gemini', 'CAPTCHA_TRIGGERED', 'Google verification / CAPTCHA required');
      }
    }
  }

  public async generateImage(tab: TabHandle, prompt: string, opts?: ImageOptions): Promise<{ buffer: Buffer; mime: string }> {
    const page = tab.page;
    if (!page || page.isClosed()) {
      throw new ProviderError('gemini', 'BROWSER_CRASH', 'Chat tab is closed or invalid');
    }

    const imageInstruction = `Create and generate a high-resolution, professional image matching this prompt:\n${prompt}`;
    await this.sendPrompt(tab, imageInstruction, { timeoutMs: opts?.timeoutMs || 120000 });

    // Wait for image element in DOM
    const startTime = Date.now();
    let imageSrc: string | null = null;

    while (Date.now() - startTime < 30000) {
      imageSrc = await page.evaluate((selectors: string[]) => {
        for (const sel of selectors) {
          const imgs = document.querySelectorAll<HTMLImageElement>(sel);
          if (imgs.length > 0) {
            const last = imgs[imgs.length - 1];
            if (last && last.src && !last.src.includes('avatar') && !last.src.includes('data:image/svg')) {
              return last.src;
            }
          }
        }
        return null;
      }, GEMINI_SELECTORS.imageElements);

      if (imageSrc) break;
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!imageSrc) {
      throw new ProviderError('gemini', 'SELECTOR_MISMATCH', 'Generated image element not found in DOM');
    }

    // Fetch full resolution image bytes from browser context
    const base64Data = await page.evaluate(async (url: string) => {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }, imageSrc);

    const buffer = Buffer.from(base64Data, 'base64');
    return { buffer, mime: 'image/jpeg' };
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const status = await this.ensureSession();
    return {
      provider: 'gemini',
      status,
      lastCheckedAt: new Date()
    };
  }

  public async closeTab(tab: TabHandle): Promise<void> {
    if (tab.page && !tab.page.isClosed()) {
      try {
        await tab.page.close();
      } catch (err) {
        logger.warn({ err }, 'Error closing Gemini tab');
      }
    }
  }
}
