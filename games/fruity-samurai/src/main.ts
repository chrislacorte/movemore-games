import './styles.css'
import { Game } from './game/Game'

const host = document.querySelector<HTMLDivElement>('#app')
if (!host) throw new Error('#app missing')

const game = new Game(host)
void game.start()
