import { ClassroomAdventureUI } from './classroomAdventureUI';
import './style.css';

function main() {
  const container = document.getElementById('app');
  if (container) {
    container.className = 'game-container';
  }
  new ClassroomAdventureUI('app');
}

main();
