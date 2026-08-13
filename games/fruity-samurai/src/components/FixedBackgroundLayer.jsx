import { BACKGROUNDS } from '../constants/backgroundConfig'

const FixedBackgroundLayer = ({ backgroundId, className = '' }) => {
  const bg = BACKGROUNDS[backgroundId]
  if (!bg?.image) return null

  return (
    <div className={`pointer-events-none absolute inset-0 z-0 ${className}`} aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg.image})` }}
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}

export default FixedBackgroundLayer
