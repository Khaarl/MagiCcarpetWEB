// utils

function getRandom(min, max) { 
    return Math.random() * (max - min) + min; 
}

function getRandomInt(min, max) { 
    return Math.floor(getRandom(min, max + 1)); 
}

function checkRectOverlap(rect1, rect2) { 
    if (!rect1 || !rect2) return false; 
    return rect1.x < rect2.x + rect2.width && 
           rect1.x + rect1.width > rect2.x && 
           rect1.y < rect2.y + rect2.height && 
           rect1.y + rect1.height > rect2.y; 
}

function checkPlatformArrayOverlap(rect1, existingPlatforms, buffer = PLATFORM_BUFFER) { 
    for (const rect2 of existingPlatforms) { 
        const bufferedRect2 = { 
            x: rect2.x - buffer, 
            y: rect2.y - buffer, 
            width: rect2.width + buffer * 2, 
            height: rect2.height + buffer * 2 
        }; 
        if (checkRectOverlap(rect1, bufferedRect2)) return true; 
    } 
    return false; 
}

function checkRewardArrayOverlap(rect1, existingRewards, buffer = REWARD_COLLISION_SIZE * 0.5) { 
    for (const rect2 of existingRewards) { 
        const bufferedRect2 = { 
            x: rect2.x - buffer, 
            y: rect2.y - buffer, 
            width: rect2.width + buffer * 2, 
            height: rect2.height + buffer * 2 
        }; 
        if (checkRectOverlap(rect1, bufferedRect2)) return true; 
    } 
    return false; 
}

function freqMult(semitones) { 
    return Math.pow(2, semitones / 12); 
}

function getRandomPatrolPoint(originX, originY, range) { 
    const angle = Math.random() * Math.PI * 2; 
    const distance = Math.random() * range; 
    const targetX = originX + Math.cos(angle) * distance; 
    const targetY = Math.max(PLATFORM_HEIGHT, Math.min(CANVAS_HEIGHT - LAVA_BASE_HEIGHT - batProto.height, originY + Math.sin(angle) * distance)); 
    return [targetX, targetY]; 
}

function checkBatArrayOverlap(rect1, existingBats, buffer = 10) { 
    for (const bat of existingBats) { 
        const rect2 = { 
            x: bat.x, 
            y: bat.y, 
            width: bat.width, 
            height: bat.height 
        }; 
        const bufferedRect2 = { 
            x: rect2.x - buffer, 
            y: rect2.y - buffer, 
            width: rect2.width + buffer * 2, 
            height: rect2.height + buffer * 2 
        }; 
        if (checkRectOverlap(rect1, bufferedRect2)) return true; 
    } 
    return false; 
}