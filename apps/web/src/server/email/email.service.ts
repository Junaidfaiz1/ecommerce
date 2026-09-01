import { sendMailInputSchema } from '@vorqen/types';
import { logger } from '../common/logger';
import { deliverResendEmail, getAppUrl, isEmailConfigured } from './resend.client';
import {
  abandonedCartTemplate,
  orderPaidTemplate,
  passwordResetTemplate,
  verifyEmailTemplate,
  type AbandonedCartEmailInput,
  type OrderPaidEmailInput,
} from './templates';

export { getAppUrl, isEmailConfigured };

async function sendMessage(
  to: string,
  message: { subject: string; html: string; text: string },
): Promise<{ id: string | null; skipped: boolean }> {
  const parsed = sendMailInputSchema.safeParse({
    to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  if (!parsed.success) {
    logger.error('email_payload_invalid', { to });
    return { id: null, skipped: true };
  }
  return deliverResendEmail(parsed.data);
}

export async function sendAuthEmail(
  kind: 'verify' | 'reset',
  to: string,
  url: string,
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('auth_email_dev_link', { kind, email: to, url });
  }
  const message =
    kind === 'verify' ? verifyEmailTemplate(url) : passwordResetTemplate(url);
  await sendMessage(to, message);
}

export async function sendOrderPaidEmail(
  to: string,
  input: OrderPaidEmailInput,
): Promise<void> {
  await sendMessage(to, orderPaidTemplate(input));
}

export async function sendAbandonedCartEmail(
  to: string,
  input: AbandonedCartEmailInput,
): Promise<{ skipped: boolean }> {
  const result = await sendMessage(to, abandonedCartTemplate(input));
  return { skipped: result.skipped };
}
