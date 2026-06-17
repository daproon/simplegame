import { ClassroomAdventureUI } from './classroomAdventureUI';
import { registerAssetServiceWorker } from './assetPreloader';
import './style.css';

function main() {
  void registerAssetServiceWorker();
  const container = document.getElementById('app');
  if (container) {
    container.className = 'game-container';
  }
  new ClassroomAdventureUI('app');
}

main();
