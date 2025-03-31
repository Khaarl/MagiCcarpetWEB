// ...existing code...
createSnapshot() {
    const snapshot = JSON.stringify(this.data);
    localStorage.setItem(`${this.storageKey}_snapshot`, snapshot);
    console.log("Game state snapshot created");
}

loadSnapshot() {
    try {
        const snapshot = localStorage.getItem(`${this.storageKey}_snapshot`);
        if (snapshot) {
            this.data = JSON.parse(snapshot);
            console.log("Game state snapshot loaded");
            return true;
        }
    } catch (e) {
        console.error("Error loading snapshot:", e);
    }
    return false;
}
// ...existing code...
