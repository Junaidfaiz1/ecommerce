import { Resend } from 'resend';
import { logger } from '../common/logger';

let resendSingleton: Resend | undefined;

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    'http://localhost:3000'
  );
}

export function getResendFromAddress(): string | null {
  const value = process.env.RESEND_FROM_EMAIL?.trim();
  return value || null;
}

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendSingleton) {
    resendSingleton = new Resend(key);
  }
  return resendSingleton;
}

export function isEmailConfigured(): boolean {
  return Boolean(getResend() && getResendFromAddress());
}

export async function deliverResendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ id: string | null; skipped: boolean }> {
  const client = getResend();
  const from = getResendFromAddress();
  if (!client || !from) {
    logger.info('email_skipped_unconfigured', {
      to: input.to,
      subject: input.subject,
    });
    return { id: null, skipped: true };
  }

  try {
    const result = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) {
      logger.error('email_send_failed', {
        to: input.to,
        subject: input.subject,
        name: result.error.name,
      });
      return { id: null, skipped: true };
    }
    logger.info('email_sent', {
      to: input.to,
      subject: input.subject,
      id: result.data?.id,
    });
    return { id: result.data?.id ?? null, skipped: false };
  } catch (error) {
    logger.error('email_send_failed', {
      to: input.to,
      subject: input.subject,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { id: null, skipped: true };
  }
}
