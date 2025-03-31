// ...existing code...
handleMenuAction(action) {
    switch(action) {
        // ...existing cases...
        case 'testEnemyAI':
            this.game.setScene('gameplay');
            this.game.currentScene.init({ isTestMode: true, testMode: 'enemyAI' });
            break;
        case 'testParticles':
            this.game.setScene('gameplay');
            this.game.currentScene.init({ isTestMode: true, testMode: 'particles' });
            break;
    }
}
// ...existing code...
