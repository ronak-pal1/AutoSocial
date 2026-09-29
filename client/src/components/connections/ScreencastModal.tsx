import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, Sparkles, CheckCircle2, Clipboard, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/useToastStore';
import type { ProviderType } from '../../types';

interface ScreencastModalProps {
  provider: ProviderType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScreencastModal: React.FC<ScreencastModalProps> = ({
  provider,
  isOpen,
  onClose,
  onSuccess
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { error: toastError, success: toastSuccess } = useToastStore();

  const [statusMessage, setStatusMessage] = useState('Requesting session ticket...');
  const [connecting, setConnecting] = useState(true);
  const [loginSucceeded, setLoginSucceeded] = useState(false);
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  // FPS counter
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastFpsUpdateRef.current) / 1000;
      setFps(Math.round(frameCountRef.current / elapsed));
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendEvent = useCallback((type: 'mouse' | 'key' | 'scroll' | 'paste' | 'navigate', data: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  // Connect screencast session
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setConnecting(true);
    setLoginSucceeded(false);
    setStatusMessage('Acquiring secure stream token...');

    const startSession = async () => {
      try {
        const ticketRes = await apiClient.post<{ ticket: string }>('/connections/ticket', { provider });
        if (!isMounted) return;

        const ticket = ticketRes.ticket;
        let wsUrl: string;
        if (import.meta.env.VITE_API_BASE_URL) {
          try {
            const parsed = new URL(import.meta.env.VITE_API_BASE_URL);
            const proto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${proto}//${parsed.host}/ws/screencast?ticket=${ticket}`;
          } catch {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${protocol}//${window.location.host}/ws/screencast?ticket=${ticket}`;
          }
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${protocol}//${window.location.host}/ws/screencast?ticket=${ticket}`;
        }

        setStatusMessage('Connecting to browser engine...');
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setStatusMessage('Browser initialized. Loading authentication portal...');
          setConnecting(false);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'status') {
              setStatusMessage(msg.message);
            } else if (msg.type === 'frame' && msg.data) {
              frameCountRef.current++;
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  const img = new Image();
                  img.onload = () => {
                    ctx.drawImage(img, 0, 0, 1280, 800);
                  };
                  img.src = `data:image/jpeg;base64,${msg.data}`;
                }
              }
            } else if (msg.type === 'login_success') {
              setLoginSucceeded(true);
              setStatusMessage('Session verified! Persistent profile sealed.');
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
              });
              toastSuccess(`Successfully authenticated ${provider.toUpperCase()}!`, 'Connection Active');
              setTimeout(() => {
                if (isMounted) {
                  onSuccess();
                  onClose();
                }
              }, 2200);
            } else if (msg.type === 'error') {
              toastError(msg.message, 'Stream Error');
              setStatusMessage(`Error: ${msg.message}`);
            }
          } catch (parseErr) {
            console.error('Frame decode error:', parseErr);
          }
        };

        ws.onclose = () => {
          if (isMounted && !loginSucceeded) {
            setStatusMessage('Stream disconnected.');
          }
        };

        ws.onerror = () => {
          if (isMounted) {
            setStatusMessage('Connection failed. Please verify server is running.');
          }
        };
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to launch screencast';
        toastError(msg, 'Ticket Error');
        setStatusMessage(msg);
        setConnecting(false);
      }
    };

    startSession();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen, provider, onClose, onSuccess, toastError, toastSuccess, loginSucceeded]);

  // Handle clipboard paste
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        sendEvent('paste', { text });
        toastSuccess('Pasted text into browser session');
      }
    } catch {
      toastError('Clipboard access denied by browser');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Connect {provider === 'gemini' ? 'Google Gemini' : 'ChatGPT'}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  CDP Stream • {fps} FPS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Interactive screencast. Log in naturally — credentials stay in your own browser session.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePasteClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="Paste text from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close screencast"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[480px]">
          {connecting && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-slate-300 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm font-medium">{statusMessage}</p>
            </div>
          )}

          {loginSucceeded && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-emerald-950/80 backdrop-blur-sm text-emerald-200 gap-3 animate-in fade-in">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
              <h4 className="text-lg font-bold text-white">Authentication Verified!</h4>
              <p className="text-xs text-emerald-300">Profile cookies persisted to disk. Closing modal...</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={1280}
            height={800}
            tabIndex={0}
            className="w-full h-auto max-h-[72vh] object-contain cursor-default outline-none select-none shadow-2xl"
            onMouseDown={(e) => {
              const { x, y } = getCanvasCoords(e);
              sendEvent('mouse', {
                event: { type: 'mousedown', x, y, button: e.button === 2 ? 'right' : 'left', clickCount: 1 }
              });
            }}
            onMouseUp={(e) => {
              const { x, y } = getCanvasCoords(e);
              sendEvent('mouse', {
                event: { type: 'mouseup', x, y, button: e.button === 2 ? 'right' : 'left', clickCount: 1 }
              });
            }}
            onMouseMove={(e) => {
              const { x, y } = getCanvasCoords(e);
              sendEvent('mouse', {
                event: { type: 'mousemove', x, y, button: 'none' }
              });
            }}
            onWheel={(e) => {
              const { x, y } = getCanvasCoords(e);
              sendEvent('scroll', {
                event: { type: 'wheel', x, y, deltaX: e.deltaX, deltaY: e.deltaY }
              });
            }}
            onKeyDown={(e) => {
              e.preventDefault();
              sendEvent('key', {
                event: {
                  type: 'keydown',
                  key: e.key,
                  code: e.code,
                  text: e.key.length === 1 ? e.key : undefined,
                  windowsVirtualKeyCode: e.keyCode
                }
              });
            }}
            onKeyUp={(e) => {
              e.preventDefault();
              sendEvent('key', {
                event: {
                  type: 'keyup',
                  key: e.key,
                  code: e.code,
                  windowsVirtualKeyCode: e.keyCode
                }
              });
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* Status Bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-lg">{statusMessage}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Auto-detecting login completion...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
