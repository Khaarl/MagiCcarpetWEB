function initializeGame() {
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas);
  game.init();
  game.start();

  console.log("Canvas dimensions:", canvas.width, canvas.height);
  console.log("Canvas visibility:", canvas.style.display);
}
