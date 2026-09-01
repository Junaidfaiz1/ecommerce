export type EmailMessage = {
  subject: string;
  html: string;
  text: string;
};

export type OrderPaidEmailInput = {
  orderNumber: string;
  currency: string;
  grandTotal: string;
  items: Array<{ name: string; quantity: number; lineTotal: string }>;
};

export type AbandonedCartEmailInput = {
  templateKey: 'abandoned_cart_1' | 'abandoned_cart_2';
  clickUrl: string;
  itemNames: string[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatMoney(amount: string, currency: string): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return `${currency} ${amount}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(numeric);
}

function layout(title: string, bodyHtml: string, bodyText: string): EmailMessage {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#070707;color:#f5f5f5;font-family:Inter,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070707;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#101010;border:1px solid #252525;">
            <tr>
              <td style="padding:28px 32px 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8a8a;">
                VORQEN
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;font-size:24px;line-height:1.3;font-weight:600;color:#f5f5f5;">
                ${escapeHtml(title)}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;font-size:15px;line-height:1.6;color:#cfcfcf;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;font-size:12px;color:#8a8a8a;">
                Build Beyond Limits.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${title}\n\n${bodyText}\n\nVORQEN — Build Beyond Limits.`;
  return { subject: title, html, text };
}

function cta(href: string, label: string): string {
  return `<p style="margin:24px 0 0;">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#f5f5f5;color:#070707;text-decoration:none;padding:12px 20px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">
      ${escapeHtml(label)}
    </a>
  </p>`;
}

export function verifyEmailTemplate(url: string): EmailMessage {
  return layout(
    'Confirm your VORQEN account',
    `<p>Verify your email to finish setting up your account.</p>
     ${cta(url, 'Verify email')}
     <p style="margin-top:24px;font-size:12px;color:#8a8a8a;">If you did not create this account, you can ignore this message.</p>`,
    `Verify your email to finish setting up your account:\n${url}\n\nIf you did not create this account, you can ignore this message.`,
  );
}

export function passwordResetTemplate(url: string): EmailMessage {
  return layout(
    'Reset your VORQEN password',
    `<p>Use the button below to choose a new password. This link expires soon.</p>
     ${cta(url, 'Reset password')}
     <p style="margin-top:24px;font-size:12px;color:#8a8a8a;">If you did not request a reset, you can ignore this message.</p>`,
    `Reset your password:\n${url}\n\nIf you did not request a reset, you can ignore this message.`,
  );
}

export function orderPaidTemplate(input: OrderPaidEmailInput): EmailMessage {
  const total = formatMoney(input.grandTotal, input.currency);
  const rows = input.items
    .map((item) => {
      const line = formatMoney(item.lineTotal, input.currency);
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #252525;color:#f5f5f5;">${escapeHtml(item.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #252525;text-align:right;color:#8a8a8a;">×${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #252525;text-align:right;color:#f5f5f5;">${escapeHtml(line)}</td>
      </tr>`;
    })
    .join('');
  const textLines = input.items
    .map(
      (item) =>
        `- ${item.name} ×${item.quantity} (${formatMoney(item.lineTotal, input.currency)})`,
    )
    .join('\n');

  return layout(
    `Order ${input.orderNumber} confirmed`,
    `<p>Payment is confirmed. We are preparing your hardware.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">${rows}</table>
     <p style="margin-top:16px;">Total: <strong style="color:#f5f5f5;">${escapeHtml(total)}</strong></p>`,
    `Payment is confirmed for order ${input.orderNumber}.\n\n${textLines}\n\nTotal: ${total}`,
  );
}

export function abandonedCartTemplate(input: AbandonedCartEmailInput): EmailMessage {
  const isReminder = input.templateKey === 'abandoned_cart_2';
  const title = isReminder
    ? 'Your VORQEN cart is still waiting'
    : 'You left hardware in your cart';
  const intro = isReminder
    ? 'A reminder: the components you selected are still in your cart.'
    : 'You started a build and left a few components behind.';
  const list = input.itemNames
    .slice(0, 8)
    .map(
      (name) =>
        `<li style="margin:0 0 6px;color:#f5f5f5;">${escapeHtml(name)}</li>`,
    )
    .join('');
  const textList = input.itemNames.slice(0, 8).map((name) => `- ${name}`).join('\n');

  return layout(
    title,
    `<p>${intro}</p>
     <ul style="padding-left:18px;margin:16px 0;">${list}</ul>
     ${cta(input.clickUrl, 'Return to cart')}`,
    `${intro}\n\n${textList}\n\nReturn to your cart:\n${input.clickUrl}`,
  );
}
