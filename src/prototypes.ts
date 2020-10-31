Object.defineProperty(RoomPosition.prototype, "neighbors", {
  get: function () {
    let adjPos: RoomPosition[] = [];
    for (let dx of [-1, 0, 1]) {
      for (let dy of [-1, 0, 1]) {
        if (!(dx == 0 && dy == 0)) {
          let x = this.x + dx;
          let y = this.y + dy;
          if (0 < x && x < 49 && 0 < y && y < 49) {
            adjPos.push(new RoomPosition(x, y, this.roomName));
          }
        }
      }
    }
    return adjPos;
  }
});
