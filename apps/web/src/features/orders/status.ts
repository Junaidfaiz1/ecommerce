export function formatOrderStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

export function formatPaymentStatus(status: string): string {
  return status.replaceAll('_', ' ');
}
