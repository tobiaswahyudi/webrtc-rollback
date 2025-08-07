class RollbackManager {
    constructor(initialState, gameTick) {
        this.history = new LevelHistory(initialState);
        this.inputPredictor = new InputPredictor(initialState);
        this.lastFrameSynced = 0;
        this.gameTick = gameTick;
    }

    get state() {
        return this.history.getCurrent();
    }

    speculateTick(playerInput) {
        this.history.copyTop();
        const state = this.history.getCurrent();
        this.gameTick(state, playerInput);
    }

    sync(syncFrame, batchSize, frameInputs) {
        if(syncFrame < this.lastFrameSynced) {
            // Pass - packet came out of order. These inputs already processed.
            return;
        }

        const firstFrameInBatch = syncFrame - batchSize + 1;

        if(firstFrameInBatch > this.lastFrameSynced) {
            throw new Error(`PANIC: Received inputs for frames ${firstFrameInBatch} to ${syncFrame}, but last synced at ${this.lastFrameSynced}. We have lost ${firstFrameInBatch - this.lastFrameSynced - 1} frames of desync.`);
        }

        this.lastFrameSynced = syncFrame;

        for(let i = 0; i < frameInputs.length; i++) {
    }
}