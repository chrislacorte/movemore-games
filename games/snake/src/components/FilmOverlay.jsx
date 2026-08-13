export default function FilmOverlay({ active = true, letterbox = true }) {
  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="film-scanlines absolute inset-0" />
      <div className="film-grain absolute inset-0" />
      {letterbox && <div className="film-letterbox absolute inset-0" />}
    </div>
  )
}
