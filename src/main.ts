import './style.css';
import { Game } from './core/Game';

const container = document.querySelector<HTMLElement>('#app');

if (container === null) {
  throw new Error('Game container #app was not found.');
}

let game: Game | undefined;

try {
  game = await Game.create(container);
  game.start();
} catch (error: unknown) {
  const detail = error instanceof Error ? error.message : 'Unknown startup error.';
  const errorPanel = document.createElement('section');
  errorPanel.className = 'startup-error';
  errorPanel.setAttribute('role', 'alert');

  const title = document.createElement('h1');
  title.textContent = 'Game could not start';
  const message = document.createElement('p');
  message.textContent = detail;
  const guidance = document.createElement('p');
  guidance.textContent =
    'Check public/private/campaign-story.json, then reload. Remove that local file to use the fictional public story.';

  errorPanel.append(title, message, guidance);
  container.replaceChildren(errorPanel);
  console.error('Game startup failed.', error);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => game?.dispose());
}
