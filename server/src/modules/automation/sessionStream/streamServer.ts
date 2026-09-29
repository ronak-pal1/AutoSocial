import type { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import type { CDPSession, Page } from 'puppeteer-core';
import { ticketService } from './ticketService.js';
import { BrowserManager } from '../BrowserManager.js';
import { ProviderSession } from '../../../models/ProviderSession.js';
import { GEMINI_SELECTORS, CHATGPT_SELECTORS } from '../selectors.js';
import { logger } from '../../../utils/logger.js';

interface ScreencastClientMessage {
  type: 'mouse' | 'key' | 'scroll' | 'paste' | 'navigate';
  event?: {
    type: string;
    x?: number;
    y?: number;
    button?: 'left' | 'right' | 'middle' | 'none';
    clickCount?: number;
    deltaX?: number;
    deltaY?: number;
    key?: string;
    code?: string;
    text?: string;
    windowsVirtualKeyCode?: number;
  };
  url?: string;
  text?: string;
}

export function setupScreencastServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const parsedUrl = new URL(request.url || '', `http://${request.headers.host}`);

    if (parsedUrl.pathname === '/ws/screencast') {
      const ticket = parsedUrl.searchParams.get('ticket');
      if (!ticket) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const ticketData = ticketService.verifyAndConsumeTicket(ticket);
      if (!ticketData) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, ticketData);
      });
    }
  });

  // Handle active screencast session
  wss.on('connection', async (ws: WebSocket, _req: IncomingMessage, ticketData: { userId: string; provider: 'gemini' | 'chatgpt' }) => {
    const { provider } = ticketData;
    logger.info({ provider }, '🔌 Active screencast connection established');

    let page: Page | null = null;
    let cdp: CDPSession | null = null;
    let successCheckInterval: NodeJS.Timeout | null = null;
    let isCleaningUp = false;

    const cleanup = async () => {
      if (isCleaningUp) return;
      isCleaningUp = true;

      if (successCheckInterval) {
        clearInterval(successCheckInterval);
        successCheckInterval = null;
      }

      if (cdp) {
        try {
          await cdp.send('Page.stopScreencast');
          await cdp.detach();
        } catch {
          // ignore
        }
        cdp = null;
      }

      if (page && !page.isClosed()) {
        try {
          await page.close();
        } catch {
          // ignore
        }
        page = null;
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    ws.on('close', () => {
      logger.info({ provider }, 'Screencast client disconnected');
      cleanup();
    });

    ws.on('error', (err) => {
      logger.error({ err, provider }, 'Screencast socket error');
      cleanup();
    });

    try {
      ws.send(JSON.stringify({ type: 'status', message: 'Launching browser engine...' }));

      const browserManager = BrowserManager.getInstance();
      page = await browserManager.createPage(provider);
      cdp = await page.createCDPSession();

      // Determine initial URL
      const startUrl =
        provider === 'gemini'
          ? 'https://accounts.google.com/signin/v2/identifier?service=mail&continue=https://gemini.google.com/app'
          : CHATGPT_SELECTORS.loginUrl;

      ws.send(JSON.stringify({ type: 'status', message: `Navigating to ${provider} sign-in...` }));
      await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

      // Start CDP screencast
      await cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 80,
        maxWidth: 1280,
        maxHeight: 800,
        everyNthFrame: 1
      });

      // Stream frames to client
      cdp.on('Page.screencastFrame', async (params) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'frame',
              data: params.data,
              metadata: params.metadata
            })
          );
        }
        try {
          if (cdp) {
            await cdp.send('Page.screencastFrameAck', { sessionId: params.sessionId });
          }
        } catch {
          // Frame ack can fail if session ended
        }
      });

      // Handle user inputs from frontend
      ws.on('message', async (rawMsg) => {
        if (!cdp || !page || page.isClosed()) return;

        try {
          const msg = JSON.parse(rawMsg.toString()) as ScreencastClientMessage;

          if (msg.type === 'mouse' && msg.event) {
            const ev = msg.event;
            const cdpType =
              ev.type === 'mousedown'
                ? 'mousePressed'
                : ev.type === 'mouseup'
                ? 'mouseReleased'
                : 'mouseMoved';

            await cdp.send('Input.dispatchMouseEvent', {
              type: cdpType,
              x: Math.round(ev.x || 0),
              y: Math.round(ev.y || 0),
              button: ev.button || 'none',
              clickCount: ev.clickCount || 1
            });
          } else if (msg.type === 'scroll' && msg.event) {
            await cdp.send('Input.dispatchMouseEvent', {
              type: 'mouseWheel',
              x: Math.round(msg.event.x || 0),
              y: Math.round(msg.event.y || 0),
              deltaX: msg.event.deltaX || 0,
              deltaY: msg.event.deltaY || 0
            });
          } else if (msg.type === 'key' && msg.event) {
            const ev = msg.event;
            if (ev.type === 'keydown') {
              await cdp.send('Input.dispatchKeyEvent', {
                type: 'keyDown',
                text: ev.text,
                unmodifiedText: ev.text,
                key: ev.key,
                code: ev.code,
                windowsVirtualKeyCode: ev.windowsVirtualKeyCode
              });
            } else if (ev.type === 'keyup') {
              await cdp.send('Input.dispatchKeyEvent', {
                type: 'keyUp',
                key: ev.key,
                code: ev.code,
                windowsVirtualKeyCode: ev.windowsVirtualKeyCode
              });
            }
          } else if (msg.type === 'paste' && msg.text) {
            await page.keyboard.type(msg.text);
          } else if (msg.type === 'navigate' && msg.url) {
            await page.goto(msg.url, { waitUntil: 'domcontentloaded' });
          }
        } catch (inputErr) {
          logger.warn({ inputErr }, 'Error dispatching CDP user input');
        }
      });

      // Login success auto-detection interval
      successCheckInterval = setInterval(async () => {
        if (!page || page.isClosed()) return;

        try {
          const currentUrl = page.url();

          let loggedIn = false;
          if (provider === 'gemini') {
            if (currentUrl.includes('gemini.google.com')) {
              for (const sel of GEMINI_SELECTORS.loggedInIndicators) {
                const el = await page.$(sel);
                if (el) {
                  loggedIn = true;
                  break;
                }
              }
              if (!loggedIn) {
                for (const inputSel of GEMINI_SELECTORS.inputs) {
                  const el = await page.$(inputSel);
                  if (el) {
                    loggedIn = true;
                    break;
                  }
                }
              }
            }
          } else if (provider === 'chatgpt') {
            if (currentUrl.includes('chatgpt.com') && !currentUrl.includes('/auth/login')) {
              for (const sel of CHATGPT_SELECTORS.loggedInIndicators) {
                const el = await page.$(sel);
                if (el) {
                  loggedIn = true;
                  break;
                }
              }
              if (!loggedIn) {
                const promptBox = await page.$('#prompt-textarea');
                if (promptBox) loggedIn = true;
              }
            }
          }

          if (loggedIn) {
            logger.info({ provider }, '🎉 Login successfully detected via screencast!');
            await ProviderSession.findOneAndUpdate(
              { provider },
              { status: 'connected', lastCheckedAt: new Date() },
              { upsert: true }
            );

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'login_success', provider }));
            }

            // Allow short delay for cookies to flush to disk before cleanup
            setTimeout(() => {
              cleanup();
            }, 3000);
          }
        } catch {
          // ignore transient check errors
        }
      }, 2000);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error({ err, provider }, 'Failed to start screencast session');
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', message: errMsg }));
      }
      cleanup();
    }
  });

  return wss;
}
