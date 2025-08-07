class FrameInput {
    constructor(frame, players, state) {
        this.frame = frame;
        this.inputs = new Array(players.length);
        this.state = state;
    }
}

class LevelHistory {
    constructor(initialState, players) {
        this.players = players;
        this.frames = [new FrameInput(0, players, initialState)];
    }

    
}