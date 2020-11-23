import { Hippocampus } from "./hippocampus";

export class Occipital {
  public hippocampus: Hippocampus;
  private generatedPixel = false;
  private consoleStatus: string[] = [];

  public constructor(hippocampus: Hippocampus) {
    this.hippocampus = hippocampus;
  }
  public addStatus(status: string): void {
    this.consoleStatus.push(status);
  }

  public initialStatus(): void {
    const figments = Object.keys(Game.creeps).length;
    this.consoleStatus = [];
    this.addStatus(`Tick: ${Game.time}`);
    if (Game.cpu.bucket >= 9500 && Game.cpu.generatePixel) {
      this.addStatus(`Bucket: ${Game.cpu.bucket}`);
      this.generatedPixel = true;
      Game.cpu.generatePixel();
    } else {
      this.addStatus(`Bucket: ${Game.cpu.bucket}`);
      this.generatedPixel = false;
    }
    this.addStatus(`Figments: ${figments}`);
  }

  public endingStatus(): void {
    this.addStatus(`CPU Usage: ${Game.cpu.getUsed().toFixed(0)}`);
    this.addStatus(`CPU Limit: ${Game.cpu.limit}`);
    this.addStatus(`CPU Tick Limit: ${Game.cpu.tickLimit}`);
    if (this.generatedPixel) {
      this.addStatus("GENERATED PIXEL");
    }
    this.printStatus();
  }

  public printStatus(): void {
    const status = this.consoleStatus.join(" | ");
    console.log(status);
  }

  public rall(roomName: string): void {
    this.rstats(roomName);
    this.rbuild(roomName);
    this.rmeta(roomName);
    this.renemy(roomName);
    this.rmap(roomName);
  }

  public rstats(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle stats for ${roomName}`;
    }
    this.hippocampus[roomName].showStats = !this.hippocampus[roomName].showStats;
    return `Successfully toggled stats for ${roomName}`;
  }

  public rbuild(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle build visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showBuildVisuals = !this.hippocampus[roomName].showBuildVisuals;
    return `Successfully toggled build visuals for ${roomName}`;
  }

  public rmeta(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle metabolic visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showMetaVisuals = !this.hippocampus[roomName].showMetaVisuals;
    return `Successfully toggled metabolic visuals for ${roomName}`;
  }

  public renemy(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle enemy visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showEnemyVisuals = !this.hippocampus[roomName].showEnemyVisuals;
    return `Successfully toggled enemy visuals for ${roomName}`;
  }

  public rmap(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle map visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showMapVisuals = !this.hippocampus[roomName].showMapVisuals;
    return `Successfully toggled map visuals for ${roomName}`;
  }

  public visualize(): void {
    // Enemy visuals
    if (this.showEnemyVisuals) {
      if (this.enemyQueue.length > 0) {
        const nextEnemy = this.enemyQueue.peek().enemyObject;
        const rv = new RoomVisual(nextEnemy.pos.roomName);
        rv.circle(nextEnemy.pos, { fill: getColor("indigo"), radius: 0.5 });
        rv.text(nextEnemy.hits.toString(), nextEnemy.pos);
      }
      if (this.healQueue.length > 0) {
        const nextHeal = this.healQueue.peek().figment;
        const rv = new RoomVisual(nextHeal.pos.roomName);
        rv.circle(nextHeal.pos, { fill: getColor("light-green"), radius: 0.5 });
        rv.text(nextHeal.hits.toString(), nextHeal.pos);
      }
    }
    // Build visuals
    if (this.showBuildVisuals) {
      if (this.buildQueue.length > 0) {
        const nextBuild = this.buildQueue.peek();
        const rv = new RoomVisual(nextBuild.pos.roomName);
        rv.circle(nextBuild.pos, { fill: getColor("light-blue"), radius: 0.5 });
        rv.text(nextBuild.structure, nextBuild.pos);
      }
      if (this.repairQueue.length > 0) {
        const nextRepair = this.repairQueue.peek();
        const rv = new RoomVisual(nextRepair.pos.roomName);
        rv.circle(nextRepair.pos, { fill: getColor("indigo"), radius: 0.5 });
        rv.text(nextRepair.hits.toString(), nextRepair.pos);
      }
    }
    if (this.showMetaVisuals) {
      if (this.inputQueue.length > 0) {
        const input = this.inputQueue.peek();
        const rv = new RoomVisual(input.pos.roomName);
        const pos = new RoomPosition(input.pos.x, input.pos.y, input.pos.roomName);
        rv.circle(pos, { fill: getColor("green"), radius: 0.5 });
        rv.text(input.priority.toString(), pos);
      }
      if (this.outputQueue.length > 0) {
        const output = this.outputQueue.peek();
        const rv = new RoomVisual(output.pos.roomName);
        const pos = new RoomPosition(output.pos.x, output.pos.y, output.pos.roomName);
        rv.circle(pos, { fill: getColor("red"), radius: 0.5 });
        rv.text(output.priority.toString(), pos);
      }
    }
    // Stats
    const spawn = this.spawn;
    if (this.showStats && spawn) {
      // General Stats
      const data: BarGraphData[] = [];
      const controller = spawn.room.controller;
      if (controller) {
        data.push({
          label: `RCL ${controller.level}`,
          current: controller.progress,
          max: controller.progressTotal
        });
      }
      data.push({
        label: `GCL ${Game.gcl.level}`,
        current: Game.gcl.progress,
        max: Game.gcl.progressTotal
      });
      data.push({
        label: `Bucket`,
        current: Game.cpu.bucket,
        max: 10000
      });
      const anchor = new RoomPosition(1, 1, spawn.room.name);
      const barGraph = new BarGraph("General Stats", anchor, data);
      barGraph.renderGraph();

      // Territory
      const tTableAnchor = new RoomPosition(12, 16, spawn.room.name);
      const tTableData: string[][] = [["Type", "Count"]];
      tTableData.push(["Territory", Object.keys(this.memoryTerritory.rooms).length.toString()]);
      tTableData.push(["Recon", this.reconRoomNames.length.toString()]);
      tTableData.push(["Neighborhood", this.neighborhoodRoomNames.length.toString()]);
      tTableData.push(["SourceKeeper", this.sourceKeeperRoomNames.length.toString()]);
      const tTable = new Table("Territory Counts", tTableAnchor, tTableData);
      tTable.renderTable();

      // Queues
      const qTableAnchor = new RoomPosition(12, 1, spawn.room.name);
      const qTableData: string[][] = [["Queue", "Count"]];
      qTableData.push(["Spawn", this.spawnQueue.length.toString()]);
      qTableData.push(["Build", this.buildQueue.length.toString()]);
      qTableData.push(["Construct", this.constructionSiteQueue.length.toString()]);
      qTableData.push(["Repair", this.repairQueue.length.toString()]);
      qTableData.push(["Input", this.inputQueue.length.toString()]);
      qTableData.push(["Output", this.outputQueue.length.toString()]);
      qTableData.push(["Enemy", this.enemyQueue.length.toString()]);
      qTableData.push(["Heal", this.healQueue.length.toString()]);
      const tableQueue = new Table("Queue Counts", qTableAnchor, qTableData);
      tableQueue.renderTable();

      // Figment Stats
      const figmentTableData: string[][] = [["Type", "Count", "Priority", "Needed"]];
      let total = 0;
      for (const figmentType in this.memoryGen.figmentCount) {
        const figmentCount = this.memoryGen.figmentCount[figmentType];
        total += figmentCount;
        let priority = -1;
        if (this.queuePriorities[figmentType] !== undefined) {
          priority = this.queuePriorities[figmentType];
        }
        let needed = false;
        if (this.figmentNeeded[figmentType] !== undefined) {
          needed = this.figmentNeeded[figmentType];
        }
        figmentTableData.push([figmentType, figmentCount.toString(), priority.toString(), String(needed)]);
      }
      figmentTableData.push(["TOTAL", total.toString(), "", ""]);

      const figmentTableAnchor = new RoomPosition(25, 1, spawn.room.name);
      let title = "Figment Stats";

      if (spawn.spawning) {
        const figment = new Figment(Game.creeps[spawn.spawning.name].id);
        const remainingTicks = spawn.spawning.remainingTime;
        title += ` (Spawning: ${figment.memory.figmentType} in ${remainingTicks})`;
      } else {
        let nextSpawn: SpawnQueuePayload | null = null;
        if (this.spawnQueue.length > 0) {
          nextSpawn = this.spawnQueue.peek();
        }
        if (nextSpawn) {
          title += ` (Next Spawn: ${nextSpawn.figmentType})`;
        }
      }

      const figmentTable = new Table(title, figmentTableAnchor, figmentTableData);
      figmentTable.renderTable();
    }
    if (this.showMapVisuals) {
      const mapTerritoryPayloads: MapTerritoryPayload[] = [
        { roomNames: this.standardRoomNames, text: "T", color: getColor("yellow") },
        { roomNames: this.neighborhoodRoomNames, text: "N", color: getColor("blue") },
        { roomNames: this.sourceKeeperRoomNames, text: "SK", color: getColor("red") },
        { roomNames: this.centerRoomNames, text: "C", color: getColor("purple") },
        { roomNames: this.highwayRoomNames, text: "H", color: getColor("indigo") },
        { roomNames: this.crossroadRoomNames, text: "X", color: getColor("indigo", "900") },
        { roomNames: this.unknownRoomNames, text: "U", color: getColor("pink") }
      ];
      for (const mapTerritoryPayload of mapTerritoryPayloads) {
        for (const roomName of mapTerritoryPayload.roomNames) {
          this.mapTerritoryVisual(roomName, mapTerritoryPayload.text, mapTerritoryPayload.color);
        }
      }
      // Recon targets
      for (const reconRoomName of this.reconRoomNames) {
        const nextScoutPos = new RoomPosition(25, 25, reconRoomName);
        Game.map.visual.circle(nextScoutPos, { fill: getColor("red") });
        Game.map.visual.text(`S`, nextScoutPos);
      }
    }
  }

  private mapTerritoryVisual(roomName: string, text: string, color: string): void {
    const identifierPos = new RoomPosition(1, 1, roomName);
    const roomData = this.memoryTerritory.rooms[roomName];
    Game.map.visual.rect(identifierPos, 48, 48, { fill: color, opacity: 0.2 });
    Game.map.visual.text(`${text}-${roomData.roomDistance}`, identifierPos, { align: "left" });
    if (roomData.expansionScore) {
      const pos = new RoomPosition(10, 10, roomName);
      Game.map.visual.circle(pos, { fill: getColor("cyan"), radius: 5 });
      Game.map.visual.text(`e-${roomData.expansionScore}`, pos, { fontSize: 7 });
    }
    if (roomData.attackScore) {
      const pos = new RoomPosition(10, 20, roomName);
      Game.map.visual.circle(pos, { fill: getColor("cyan"), radius: 5 });
      Game.map.visual.text(`a-${roomData.attackScore}`, pos, { fontSize: 7 });
    }
    if (roomData.defendScore) {
      const pos = new RoomPosition(10, 30, roomName);
      Game.map.visual.circle(pos, { fill: getColor("cyan"), radius: 5 });
      Game.map.visual.text(`d-${roomData.defendScore}`, pos, { fontSize: 7 });
    }
    if (roomData.harassScore) {
      const pos = new RoomPosition(10, 40, roomName);
      Game.map.visual.circle(pos, { fill: getColor("cyan"), radius: 5 });
      Game.map.visual.text(`h-${roomData.harassScore}`, pos, { fontSize: 7 });
    }
  }
}
