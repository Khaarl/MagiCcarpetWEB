import { largeBatProto } from './entities/largeBat.js';
import { NUM_LARGE_BATS_TO_SPAWN } from './constants.js';
// ...existing code...

generateLevel() {
    // ...existing code...
    const largeBats = [];
    let placedLargeBats = 0;

    while (placedLargeBats < NUM_LARGE_BATS_TO_SPAWN) {
        const platform = platforms[getRandomInt(0, platforms.length - 1)];
        if (!platform) continue;

        const bat = { ...largeBatProto };
        bat.originX = platform.x + platform.width / 2;
        bat.originY = platform.y - 50;
        bat.x = bat.originX - bat.width / 2;
        bat.y = bat.originY - bat.height / 2;

        largeBats.push(bat);
        placedLargeBats++;
    }

    return { ...levelData, largeBats };
}
