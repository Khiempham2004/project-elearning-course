export type EnrollmentStatus =
  | 'not-started'
  | 'active'
  | 'completed'
  | 'cancelled';

export function normalizeEnrollmentStatus(
  status: string | null | undefined,
): EnrollmentStatus | null {
  switch (status?.trim().toLowerCase()) {
    case 'notstarted':
    case 'not-started':
    case 'not_started':
      return 'not-started';
    case 'inprogress':
    case 'in-progress':
    case 'in_progress':
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return null;
  }
}
