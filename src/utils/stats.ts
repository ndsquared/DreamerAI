export function exportStats(): void {
  // Reset stats object
  Memory.stats = {
    time: Game.time,
    gcl: {},
    rooms: {},
    cpu: {}
  };

  // Collect room stats
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room.controller && room.controller.my) {
      const roomStats: RoomStats = {};
      roomStats.storageEnergy = room.storage ? room.storage.store.getUsedCapacity(RESOURCE_ENERGY) : 0;
      roomStats.terminalEnergy = room.terminal ? room.terminal.store.getUsedCapacity(RESOURCE_ENERGY) : 0;
      roomStats.energyAvailable = room.energyAvailable;
      roomStats.energyCapacityAvailable = room.energyCapacityAvailable;
      roomStats.controllerProgress = room.controller.progress;
      roomStats.controllerProgressTotal = room.controller.progressTotal;
      roomStats.controllerLevel = room.controller.level;
      Memory.stats.rooms[roomName] = roomStats;
    }
  }

  // Collect GCL stats
  Memory.stats.gcl.progress = Game.gcl.progress;
  Memory.stats.gcl.progressTotal = Game.gcl.progressTotal;
  Memory.stats.gcl.level = Game.gcl.level;

  // Collect CPU stats
  Memory.stats.cpu.bucket = Game.cpu.bucket;
  Memory.stats.cpu.limit = Game.cpu.limit;
  Memory.stats.cpu.used = Game.cpu.getUsed();
}
