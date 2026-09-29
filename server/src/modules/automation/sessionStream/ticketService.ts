import crypto from 'crypto';
import type { ProviderType } from '../types.js';

interface TicketData {
  userId: string;
  provider: ProviderType;
  expiresAt: number;
}

class TicketService {
  private tickets: Map<string, TicketData> = new Map();

  public createTicket(userId: string, provider: ProviderType): string {
    const ticketId = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 60 * 1000; // 60 seconds TTL

    this.tickets.set(ticketId, {
      userId,
      provider,
      expiresAt
    });

    return ticketId;
  }

  public verifyAndConsumeTicket(ticketId: string): TicketData | null {
    const data = this.tickets.get(ticketId);
    if (!data) return null;

    this.tickets.delete(ticketId);

    if (Date.now() > data.expiresAt) {
      return null;
    }

    return data;
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [id, data] of this.tickets.entries()) {
      if (now > data.expiresAt) {
        this.tickets.delete(id);
      }
    }
  }
}

export const ticketService = new TicketService();

// Periodically clean expired tickets
setInterval(() => {
  ticketService.cleanup();
}, 30000);
