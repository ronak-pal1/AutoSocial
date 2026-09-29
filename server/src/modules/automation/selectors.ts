export interface ProviderSelectors {
  homeUrl: string;
  loginUrl: string;
  inputs: string[];
  submitButtons: string[];
  stopButtons: string[];
  responseContainers: string[];
  imageElements: string[];
  loginIndicators: string[];
  loggedInIndicators: string[];
  rateLimitIndicators: string[];
  captchaIndicators: string[];
}

export const GEMINI_SELECTORS: ProviderSelectors = {
  homeUrl: 'https://gemini.google.com/app',
  loginUrl: 'https://accounts.google.com/signin',
  inputs: [
    'div[role="textbox"]',
    'rich-textarea div[contenteditable="true"]',
    'textarea[aria-label*="prompt" i]',
    'div.ql-editor',
    'p.is-empty[data-placeholder]'
  ],
  submitButtons: [
    'button[aria-label*="Send" i]',
    'button[aria-label*="Submit" i]',
    'button[jsname="j1wR4e"]',
    'button:has(mat-icon[fonticon="send"])',
    'button.send-button'
  ],
  stopButtons: [
    'button[aria-label*="Stop" i]',
    'div[aria-label*="Stop generating" i]',
    'mat-progress-spinner',
    '.loading-indicator',
    'div[role="progressbar"]'
  ],
  responseContainers: [
    '.model-response-text',
    'message-content',
    'div[id^="model-response"]',
    '.response-container-content',
    'div.markdown'
  ],
  imageElements: [
    'img[src*="googleusercontent"]',
    'img[alt*="Generated" i]',
    'generated-image-card img',
    'div[data-image-id] img',
    'picture img'
  ],
  loginIndicators: [
    'a[href*="accounts.google.com"]',
    'button:has-text("Sign in")',
    'a:has-text("Sign in")',
    'div[aria-label*="Sign in" i]'
  ],
  loggedInIndicators: [
    'a[aria-label*="Google Account" i]',
    'button[aria-label*="Google Account" i]',
    'img[alt*="Google Account" i]',
    'img[src*="googleusercontent.com/a/"]',
    'avatar-button'
  ],
  rateLimitIndicators: [
    'text="Too many requests"',
    'text="Rate limit exceeded"',
    'text="You\'ve reached the limit"',
    'text="Please wait a moment before trying again"'
  ],
  captchaIndicators: [
    'iframe[src*="recaptcha"]',
    'div#challenge-running',
    'text="Verify it\'s you"',
    'text="suspicious activity"'
  ]
};

export const CHATGPT_SELECTORS: ProviderSelectors = {
  homeUrl: 'https://chatgpt.com',
  loginUrl: 'https://chatgpt.com/auth/login',
  inputs: [
    '#prompt-textarea',
    'div[contenteditable="true"]',
    'textarea[data-id="root"]',
    'div[role="textbox"]'
  ],
  submitButtons: [
    'button[data-testid="send-button"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="Send message"]',
    'button:has(svg[data-icon="arrow-up"])'
  ],
  stopButtons: [
    'button[data-testid="stop-button"]',
    'button[aria-label="Stop streaming"]',
    'button[aria-label="Stop generating"]',
    'button[aria-label="Stop"]'
  ],
  responseContainers: [
    'div[data-message-author-role="assistant"]',
    'div[data-testid^="conversation-turn-"] .markdown',
    '.markdown',
    'article:last-of-type div.markdown'
  ],
  imageElements: [
    'img[alt*="Generated" i]',
    'img[src*="oaidalleapiprodscus"]',
    'img[src*="files.oaiusercontent.com"]',
    'div[data-testid="image-attachment"] img',
    'img[src^="blob:"]'
  ],
  loginIndicators: [
    'button[data-testid="login-button"]',
    'a[href*="/auth/login"]',
    'button:has-text("Log in")',
    'a:has-text("Log in")'
  ],
  loggedInIndicators: [
    'button[data-testid="profile-button"]',
    'div[data-testid="user-menu"]',
    'button[aria-label*="User" i]',
    'img[alt*="User" i]'
  ],
  rateLimitIndicators: [
    'text="You\'ve reached our limit"',
    'text="Too many requests"',
    'text="Hourly limit reached"',
    'text="Please try again later"'
  ],
  captchaIndicators: [
    'iframe[src*="cloudflare"]',
    'iframe[src*="challenges"]',
    'div#challenge-running',
    'text="Verify you are human"'
  ]
};
