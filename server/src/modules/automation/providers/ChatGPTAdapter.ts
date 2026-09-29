import type { Page } from 'puppeteer-core';
import { BrowserManager } from '../BrowserManager.js';
import { CHATGPT_SELECTORS } from '../selectors.js';
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

export class ChatGPTAdapter implements ProviderAdapter {
  public readonly provider = 'chatgpt' as const;
  private browserManager = BrowserManager.getInstance();

  public async ensureSession(): Promise<SessionStatus> {
    try {
      const page = await this.browserManager.createPage(this.provider);
      await page.goto(CHATGPT_SELECTORS.homeUrl, { waitUntil: 'networkidle2', timeout: 35000 });

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
      logger.error({ err }, 'ChatGPT ensureSession error');
      await ProviderSession.findOneAndUpdate(
        { provider: this.provider },
        { status: 'error', lastCheckedAt: new Date() },
        { upsert: true }
      );
      return 'error';
    }
  }

  private async checkLoggedIn(page: Page): Promise<boolean> {
    for (const sel of CHATGPT_SELECTORS.loginIndicators) {
      const el = await page.$(sel);
      if (el) return false;
    }

    for (const sel of CHATGPT_SELECTORS.loggedInIndicators) {
      const el = await page.$(sel);
      if (el) return true;
    }

    const url = page.url();
    if (url.includes('/auth/login')) return false;

    for (const sel of CHATGPT_SELECTORS.inputs) {
      const input = await page.$(sel);
      if (input) return true;
    }

    return false;
  }

  public async newChat(): Promise<TabHandle> {
    const page = await this.browserManager.createPage(this.provider);
    await page.goto(CHATGPT_SELECTORS.homeUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    const isLoggedIn = await this.checkLoggedIn(page);
    if (!isLoggedIn) {
      await page.close();
      throw new ProviderError(
        'chatgpt',
        'LOGIN_REQUIRED',
        'ChatGPT session requires login. Connect via the Connections tab.'
      );
    }

    return {
      id: `chatgpt_tab_${Date.now()}`,
      provider: 'chatgpt',
      page,
      createdAt: new Date()
    };
  }

  public async sendPrompt(tab: TabHandle, prompt: string, opts?: PromptOptions): Promise<{ text: string }> {
    const page = tab.page;
    if (!page || page.isClosed()) {
      throw new ProviderError('chatgpt', 'BROWSER_CRASH', 'Chat tab is closed or invalid');
    }

    const timeoutMs = opts?.timeoutMs || 90000;

    let inputHandle = null;
    for (const sel of CHATGPT_SELECTORS.inputs) {
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
      throw new ProviderError('chatgpt', 'SELECTOR_MISMATCH', 'Could not locate ChatGPT prompt input');
    }

    await inputHandle.click();
    const formattedPrompt = opts?.systemHint
      ? `[SYSTEM: ${opts.systemHint}]\n\n${prompt}`
      : prompt;

    await page.keyboard.type(formattedPrompt, { delay: 10 });

    // Submit
    let submitted = false;
    for (const btnSel of CHATGPT_SELECTORS.submitButtons) {
      try {
        const btn = await page.$(btnSel);
        if (btn) {
          await btn.click();
          submitted = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!submitted) {
      await page.keyboard.press('Enter');
    }

    const responseText = await this.waitForResponseStabilization(page, timeoutMs);
    return { text: responseText };
  }

  private async waitForResponseStabilization(page: Page, timeoutMs: number): Promise<string> {
    const startTime = Date.now();
    let previousText = '';
    let stableCount = 0;

    while (Date.now() - startTime < timeoutMs) {
      await this.checkForErrors(page);

      const currentText = await page.evaluate((selectors: string[]) => {
        for (const sel of selectors) {
          const elements = document.querySelectorAll(sel);
          if (elements.length > 0) {
            const last = elements[elements.length - 1];
            return (last as HTMLElement).innerText || last.textContent || '';
          }
        }
        return '';
      }, CHATGPT_SELECTORS.responseContainers);

      let isGenerating = false;
      for (const stopSel of CHATGPT_SELECTORS.stopButtons) {
        const stopBtn = await page.$(stopSel);
        if (stopBtn) {
          isGenerating = true;
          break;
        }
      }

      if (currentText.trim().length > 0 && currentText === previousText && !isGenerating) {
        stableCount++;
        if (stableCount >= 3) {
          return currentText.trim();
        }
      } else {
        stableCount = 0;
      }

      previousText = currentText;
      await new Promise((r) => setTimeout(r, 500));
    }

    if (previousText.trim().length > 0) {
      return previousText.trim();
    }

    throw new ProviderError('chatgpt', 'TIMEOUT', `ChatGPT response timed out after ${timeoutMs}ms`);
  }

  private async checkForErrors(page: Page): Promise<void> {
    const pageText = await page.evaluate(() => document.body.innerText || '');

    for (const indicator of CHATGPT_SELECTORS.rateLimitIndicators) {
      const clean = indicator.replace(/text="|"/g, '');
      if (pageText.includes(clean)) {
        throw new ProviderError('chatgpt', 'RATE_LIMITED', `Rate limit triggered: "${clean}"`);
      }
    }

    for (const indicator of CHATGPT_SELECTORS.captchaIndicators) {
      const clean = indicator.replace(/text="|"/g, '');
      if (pageText.includes(clean)) {
        throw new ProviderError('chatgpt', 'CAPTCHA_TRIGGERED', 'Cloudflare security verification required');
      }
    }
  }

  public async generateImage(tab: TabHandle, prompt: string, opts?: ImageOptions): Promise<{ buffer: Buffer; mime: string }> {
    const page = tab.page;
    if (!page || page.isClosed()) {
      throw new ProviderError('chatgpt', 'BROWSER_CRASH', 'Chat tab is closed or invalid');
    }

    const imageInstruction = `Create a high-resolution, detailed image for this concept:\n${prompt}`;
    await this.sendPrompt(tab, imageInstruction, { timeoutMs: opts?.timeoutMs || 120000 });

    const startTime = Date.now();
    let imageSrc: string | null = null;

    while (Date.now() - startTime < 35000) {
      imageSrc = await page.evaluate((selectors: string[]) => {
        for (const sel of selectors) {
          const imgs = document.querySelectorAll<HTMLImageElement>(sel);
          if (imgs.length > 0) {
            const last = imgs[imgs.length - 1];
            if (last && last.src && !last.src.includes('avatar')) {
              return last.src;
            }
          }
        }
        return null;
      }, CHATGPT_SELECTORS.imageElements);

      if (imageSrc) break;
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!imageSrc) {
      throw new ProviderError('chatgpt', 'SELECTOR_MISMATCH', 'Generated image element not found in DOM');
    }

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
      provider: 'chatgpt',
      status,
      lastCheckedAt: new Date()
    };
  }

  public async closeTab(tab: TabHandle): Promise<void> {
    if (tab.page && !tab.page.isClosed()) {
      try {
        await tab.page.close();
      } catch (err) {
        logger.warn({ err }, 'Error closing ChatGPT tab');
      }
    }
  }
}
