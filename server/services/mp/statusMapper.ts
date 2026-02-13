/**
 * Maps Mercado Pago payment status to Order status.
 * Single source of truth; used by webhook processing and reconcile-pending.
 */

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'READY_FOR_MONTINK'
  | 'SENT_TO_MONTINK'
  | 'FAILED_MONTINK'
  | 'CANCELED'
  | 'FAILED'
  | 'REFUNDED';

export function mapMpStatusToOrderStatus(mpStatus: string | null | undefined): OrderStatus {
  switch (mpStatus) {
    case 'approved':
      return 'READY_FOR_MONTINK';
    case 'cancelled':
    case 'rejected':
      return 'CANCELED';
    case 'refunded':
    case 'charged_back':
      return 'REFUNDED';
    case 'pending':
    case 'in_process':
      return 'PENDING';
    default:
      return 'PENDING';
  }
}
