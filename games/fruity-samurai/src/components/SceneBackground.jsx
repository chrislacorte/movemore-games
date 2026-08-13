import { INTRO_BG_COLOR, INTRO_BG_IMAGE } from '../constants/introConfig'
import { getBackground, isWebcamBackground } from '../constants/backgrounds'

const SceneBackground = ({ backgroundId, introActive = false }) => {
  const bg = getBackground(backgroundId)
  const webcam = isWebcamBackground(backgroundId)
  const showIntroImage = introActive && !webcam
  const showSceneImage = !introActive && !webcam
  const imageSrc = showIntroImage ? INTRO_BG_IMAGE : bg.image
  const imageKey = showIntroImage ? 'intro' : backgroundId

  return (
    <div
      className={`scene-background pointer-events-none absolute inset-0 overflow-hidden ${
        webcam ? 'z-[2]' : 'z-[1]'
      }`}
      style={{ backgroundColor: webcam ? 'transparent' : INTRO_BG_COLOR }}
      aria-hidden
    >
      {(showIntroImage || showSceneImage) && (
        <img
          key={imageKey}
          src={imageSrc}
          alt=""
          className="scene-background__image absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
        />
      )}
      <div className="scene-background__edge-overlay" aria-hidden />
    </div>
  )
}

export default SceneBackground
