/**
 * Skeletons, not spinners. A spinner tells someone nothing is happening; a
 * skeleton tells them what is about to be there.
 */
export function ResourceListSkeleton({ count = 5, label }: { count?: number; label: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      <ul className="resource-list">
        {Array.from({ length: count }, (_, index) => (
          <li className="skeleton-card" key={index}>
            <div className="skeleton skeleton-line" style={{ width: '65%' }} />
            <div className="skeleton skeleton-line" style={{ width: '40%' }} />
            <div className="skeleton skeleton-line" style={{ width: '90%', marginBottom: 0 }} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function MapSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      <div className="skeleton map-canvas" />
    </div>
  )
}
