/*
This module is reponsible for visualizations and stats
*/
import { BarGraph, Table } from "utils/visuals";
import { Cortex } from "./cortex";
import { getColor } from "utils/colors";

export class Occipital implements Temporal {
  public cortex: Cortex;
  private showMapVisuals = false;
  private generatedPixel = false;
  private consoleStatus: string[] = [];

  public constructor(cortex: Cortex) {
    this.cortex = cortex;
  }
  public meditate(): void {
    this.initialStatus();
  }
  public contemplate(): void {
    this.visualize();
    this.endingStatus();
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

  public rall(roomName: string): string {
    if (!this.cortex.baseRooms[roomName]) {
      return `Could not toggle all stats/visuals for ${roomName}`;
    }
    this.rstats(roomName);
    this.rbuild(roomName);
    this.rmeta(roomName);
    this.renemy(roomName);
    this.rmap();
    return `Successfully toggled all stats/visuals for ${roomName}`;
  }

  public rstats(roomName: string): string {
    if (!this.cortex.baseRooms[roomName]) {
      return `Could not toggle stats for ${roomName}`;
    }
    this.cortex.baseRooms[roomName].showStats = !this.cortex.baseRooms[roomName].showStats;
    return `Successfully toggled stats for ${roomName}`;
  }

  public rbuild(roomName: string): string {
    if (!this.cortex.baseRooms[roomName]) {
      return `Could not toggle build visuals for ${roomName}`;
    }
    this.cortex.baseRooms[roomName].showBuildVisuals = !this.cortex.baseRooms[roomName].showBuildVisuals;
    return `Successfully toggled build visuals for ${roomName}`;
  }

  public rmeta(roomName: string): string {
    if (!this.cortex.baseRooms[roomName]) {
      return `Could not toggle metabolic visuals for ${roomName}`;
    }
    this.cortex.baseRooms[roomName].showMetaVisuals = !this.cortex.baseRooms[roomName].showMetaVisuals;
    return `Successfully toggled metabolic visuals for ${roomName}`;
  }

  public renemy(roomName: string): string {
    if (!this.cortex.baseRooms[roomName]) {
      return `Could not toggle enemy visuals for ${roomName}`;
    }
    this.cortex.baseRooms[roomName].showEnemyVisuals = !this.cortex.baseRooms[roomName].showEnemyVisuals;
    return `Successfully toggled enemy visuals for ${roomName}`;
  }

  public rmap(): string {
    this.showMapVisuals = !this.showMapVisuals;
    return `Successfully toggled map visuals`;
  }

  public visualize(): void {
    for (const baseRoomName in this.cortex.baseRooms) {
      const baseRoom = this.cortex.baseRooms[baseRoomName];
      // Enemy visuals
      if (baseRoom.showEnemyVisuals) {
        const nextEnemy = this.cortex.getNextEnemyTarget(baseRoomName);
        if (nextEnemy) {
          const rv = new RoomVisual(nextEnemy.pos.roomName);
          rv.circle(nextEnemy.pos, { fill: getColor("indigo"), radius: 0.5 });
          rv.text(nextEnemy.hits.toString(), nextEnemy.pos);
        }
        const nextHeal = this.cortex.getNextHealTarget(baseRoomName);
        if (nextHeal) {
          const rv = new RoomVisual(nextHeal.pos.roomName);
          rv.circle(nextHeal.pos, { fill: getColor("light-green"), radius: 0.5 });
          rv.text(nextHeal.hits.toString(), nextHeal.pos);
        }
      }
      // Build visuals
      if (baseRoom.showBuildVisuals) {
        const nextBuild = this.cortex.getNextBuildTarget(baseRoomName);
        if (nextBuild) {
          const rv = new RoomVisual(nextBuild.pos.roomName);
          rv.circle(nextBuild.pos, { fill: getColor("light-blue"), radius: 0.5 });
          rv.text(nextBuild.structureType, nextBuild.pos);
        }
        const nextRepair = this.cortex.getNextRepairTarget(baseRoomName);
        if (nextRepair) {
          const rv = new RoomVisual(nextRepair.pos.roomName);
          rv.circle(nextRepair.pos, { fill: getColor("indigo"), radius: 0.5 });
          rv.text(nextRepair.hits.toString(), nextRepair.pos);
        }
      }
      if (baseRoom.showMetaVisuals) {
        const input = this.cortex.getNextInput(baseRoomName);
        if (input) {
          const rv = new RoomVisual(input.pos.roomName);
          const pos = new RoomPosition(input.pos.x, input.pos.y, input.pos.roomName);
          rv.circle(pos, { fill: getColor("green"), radius: 0.5 });
          rv.text(input.priority.toString(), pos);
        }
        const output = this.cortex.getNextOutput(baseRoomName);
        if (output) {
          const rv = new RoomVisual(output.pos.roomName);
          const pos = new RoomPosition(output.pos.x, output.pos.y, output.pos.roomName);
          rv.circle(pos, { fill: getColor("red"), radius: 0.5 });
          rv.text(output.priority.toString(), pos);
        }
      }
      // Stats
      const room = Game.rooms[baseRoomName];
      if (baseRoom.showStats && room) {
        // General Stats
        const data: BarGraphData[] = [];
        const controller = room.controller;
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
        const anchor = new RoomPosition(1, 1, room.name);
        const barGraph = new BarGraph("General Stats", anchor, data);
        barGraph.renderGraph();

        // Territory
        const tTableAnchor = new RoomPosition(12, 16, room.name);
        const tTableData: string[][] = [["Type", "Count"]];
        tTableData.push(["Territory", Object.keys(this.cortex.memory.rooms).length.toString()]);
        tTableData.push(["Recon", this.cortex.spatial.reconRoomNames.length.toString()]);
        tTableData.push(["Neighborhood", this.cortex.getNeighborhoodRoomNames(baseRoomName).length.toString()]);
        const tTable = new Table("Territory Counts", tTableAnchor, tTableData);
        tTable.renderTable();

        // Queues
        const qTableAnchor = new RoomPosition(12, 1, room.name);
        const qTableData: string[][] = [["Queue", "Count"]];
        qTableData.push(["Spawn", this.cortex.metabolism.spawnQueue[baseRoomName].length.toString()]);
        qTableData.push(["Build", this.cortex.metabolism.buildQueue[baseRoomName].length.toString()]);
        qTableData.push(["Construct", this.cortex.metabolism.constructionSiteQueue[baseRoomName].length.toString()]);
        qTableData.push(["Repair", this.cortex.metabolism.repairQueue[baseRoomName].length.toString()]);
        qTableData.push(["Input", this.cortex.metabolism.inputQueue[baseRoomName].length.toString()]);
        qTableData.push(["Output", this.cortex.metabolism.outputQueue[baseRoomName].length.toString()]);
        qTableData.push(["Enemy", this.cortex.metabolism.enemyQueue[baseRoomName].length.toString()]);
        qTableData.push(["Heal", this.cortex.metabolism.healQueue[baseRoomName].length.toString()]);
        const tableQueue = new Table("Queue Counts", qTableAnchor, qTableData);
        tableQueue.renderTable();

        // Figment Stats
        const figmentTableData: string[][] = [["Type", "Count", "Priority", "Needed"]];
        let total = 0;
        for (const figmentType in this.cortex.memory.imagination.genesis[baseRoomName].figmentCount) {
          const figmentCount = this.cortex.memory.imagination.genesis[baseRoomName].figmentCount[figmentType];
          total += figmentCount;
          let priority = -1;
          let needed = false;
          const figmentPrefs = this.cortex.getFigmentPreferences(baseRoomName);
          if (figmentPrefs) {
            priority = figmentPrefs[figmentType].priority;
            needed = figmentPrefs[figmentType].needed;
          }
          figmentTableData.push([figmentType, figmentCount.toString(), priority.toString(), String(needed)]);
        }
        figmentTableData.push(["TOTAL", total.toString(), "", ""]);

        const figmentTableAnchor = new RoomPosition(25, 1, room.name);
        let title = "Figment Stats";

        const nextSpawn = this.cortex.getNextSpawn(baseRoomName);
        if (nextSpawn) {
          title += ` (Next Spawn: ${nextSpawn.figmentType})`;
        }

        const figmentTable = new Table(title, figmentTableAnchor, figmentTableData);
        figmentTable.renderTable();
      }
      if (this.showMapVisuals) {
        const mapTerritoryPayloads: MapTerritoryPayload[] = [
          { roomNames: this.cortex.spatial.standardRoomNames, text: "T", color: getColor("yellow") },
          { roomNames: this.cortex.getNeighborhoodRoomNames(baseRoomName), text: "N", color: getColor("blue") },
          { roomNames: this.cortex.spatial.sourceKeeperRoomNames, text: "SK", color: getColor("red") },
          { roomNames: this.cortex.spatial.centerRoomNames, text: "C", color: getColor("purple") },
          { roomNames: this.cortex.spatial.highwayRoomNames, text: "H", color: getColor("indigo") },
          { roomNames: this.cortex.spatial.crossroadRoomNames, text: "X", color: getColor("indigo", "900") },
          { roomNames: this.cortex.spatial.unknownRoomNames, text: "U", color: getColor("pink") }
        ];
        for (const mapTerritoryPayload of mapTerritoryPayloads) {
          for (const roomName of mapTerritoryPayload.roomNames) {
            this.mapTerritoryVisual(roomName, mapTerritoryPayload.text, mapTerritoryPayload.color);
          }
        }
        // Recon targets
        for (const reconRoomName of this.cortex.spatial.reconRoomNames) {
          const nextScoutPos = new RoomPosition(25, 25, reconRoomName);
          Game.map.visual.circle(nextScoutPos, { fill: getColor("red") });
          Game.map.visual.text(`S`, nextScoutPos);
        }
      }
    }
  }

  private mapTerritoryVisual(roomName: string, text: string, color: string): void {
    const identifierPos = new RoomPosition(1, 1, roomName);
    const roomData = this.cortex.memory.rooms[roomName];
    Game.map.visual.rect(identifierPos, 48, 48, { fill: color, opacity: 0.2 });
    Game.map.visual.text(`${text}-${roomData.roomDistance[roomName]}`, identifierPos, { align: "left" });
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
