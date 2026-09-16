import type { Review } from '../lib/types'

/**
 * PLACEHOLDER REVIEWS — NOT REAL PEOPLE.
 *
 * Invented so the rating line, the "show all" behaviour and the moderation
 * rule have something to exercise before the database is connected. Every
 * one of these is marked approved, which is the only status that renders.
 *
 * Real reviews arrive as 'pending' and a person reads each one before it
 * appears. None of these mention a staff member or an address, which is the
 * same standard the form asks real reviewers to hold to.
 */
export const SAMPLE_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    resource_id: 'sample-food-1',
    rating: 5,
    body: 'Went on a Tuesday morning, no line. They gave me enough for the week and nobody asked for ID.',
    status: 'approved',
    created_at: '2026-08-14T10:00:00Z',
  },
  {
    id: 'rev-2',
    resource_id: 'sample-food-1',
    rating: 4,
    body: 'Good produce. Get there early, the fresh stuff goes first.',
    status: 'approved',
    created_at: '2026-07-30T10:00:00Z',
  },
  {
    id: 'rev-3',
    resource_id: 'sample-food-1',
    rating: 5,
    body: 'Staff were kind and did not make me explain myself.',
    status: 'approved',
    created_at: '2026-07-02T10:00:00Z',
  },
  {
    id: 'rev-4',
    resource_id: 'sample-food-1',
    rating: 4,
    body: 'Parking is tight but the walk is short.',
    status: 'approved',
    created_at: '2026-06-18T10:00:00Z',
  },
  {
    id: 'rev-5',
    resource_id: 'sample-food-1',
    rating: 5,
    body: 'They let me take an extra bag for my neighbour.',
    status: 'approved',
    created_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 'rev-6',
    resource_id: 'sample-jobs-1',
    rating: 4,
    body: 'The reentry counselor actually knew which employers hire with a record.',
    status: 'approved',
    created_at: '2026-08-20T10:00:00Z',
  },
  {
    id: 'rev-7',
    resource_id: 'sample-jobs-1',
    rating: 5,
    body: 'Helped me rewrite my resume in one sitting.',
    status: 'approved',
    created_at: '2026-08-02T10:00:00Z',
  },
  {
    id: 'rev-8',
    resource_id: 'sample-docs-1',
    rating: 3,
    body: 'Long wait, but I walked out with the paperwork started.',
    status: 'approved',
    created_at: '2026-08-11T10:00:00Z',
  },
  // Pending on purpose: this must never render anywhere.
  {
    id: 'rev-pending',
    resource_id: 'sample-food-1',
    rating: 1,
    body: 'THIS REVIEW IS PENDING AND MUST NOT APPEAR IN THE APP.',
    status: 'pending',
    created_at: '2026-09-10T10:00:00Z',
  },
]
