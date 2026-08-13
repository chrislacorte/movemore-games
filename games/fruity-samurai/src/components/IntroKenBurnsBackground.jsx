import { INTRO_BG_COLOR, INTRO_BG_IMAGE } from '../constants/introConfig'

const IntroKenBurnsBackground = () => (
  <div
    className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
    style={{ backgroundColor: INTRO_BG_COLOR }}
    aria-hidden
  >
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${INTRO_BG_IMAGE})` }}
    />

    <div
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(
            ellipse 78% 68% at 50% 44%,
            transparent 0%,
            rgba(0, 0, 0, 0.25) 48%,
            rgba(0, 0, 0, 0.72) 78%,
            ${INTRO_BG_COLOR} 100%
          ),
          linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.55) 0%,
            transparent 24%,
            transparent 68%,
            rgba(0, 0, 0, 0.65) 100%
          )
        `,
      }}
    />
  </div>
)

export default IntroKenBurnsBackground
