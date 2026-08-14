export function Icon({ name, filled = false, className = '', style }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : undefined, ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}