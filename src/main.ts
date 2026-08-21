import './style.css';
import { Game } from './core/Game';

const container = document.querySelector<HTMLElement>('#app');

if (container === null) {
  throw new Error('Game container #app was not found.');
}

const game = await Game.create(container);
game.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.dispose());
}
