import { BarGraph, Table } from "utils/visuals";
import {
  PathFindWithRoad,
  RoomType,
  getNeighborRoomNames,
  getReconRoomData,
  getRoomType,
  isEnergyStructure,
  isStoreStructure
} from "utils/misc";
import { Figment } from "figments/figment";
import { Imagination } from "imagination";
import PriorityQueue from "ts-priority-queue";
import { getColor } from "utils/colors";

type EnergyWithdrawStructure = StoreStructure | EnergyStructure;
type ResourceOrEnergyWithdrawStructure = EnergyWithdrawStructure | Resource;

export class Hippocampus {
  private spawnId: string;
  private spawnRoom: Room;

  private imagination: Imagination;

  private memoryIO: MetabolicMemory;
  public memoryGen: GenesisMemory;
  public memoryTerritory: TerritoryMemory;

  public queuePriorities: { [type: string]: number } = {};
  public figmentNeeded: { [type: string]: boolean } = {};

  private repairThreshold = 20000;
  private ecoStorageThreshold = 20000;

  public showStats = false;
  public showBuildVisuals = false;
  public showMetaVisuals = false;
  public showEnemyVisuals = false;
  public showMapVisuals = false;

  /* ********** Arrays ********** */

  // Neutral
  public structures: Structure[] = [];
  public constructionSites: ConstructionSite[] = [];
  public droppedResources: Resource[] = [];
  public sources: Source[] = [];
  public containers: StructureContainer[] = [];
  public spawnContainers: StructureContainer[] = [];
  public sourceContainers: { [name: string]: StructureContainer[] } = {};
  public controllerContainers: StructureContainer[] = [];
  public reconRoomNames: string[] = [];
  public standardRoomNames: string[] = [];
  public centerRoomNames: string[] = [];
  public highwayRoomNames: string[] = [];
  public crossroadRoomNames: string[] = [];
  public unknownRoomNames: string[] = [];

  // Owned
  public myCreeps: Creep[] = [];
  public myStructures: Structure[] = [];
  public energyWithdrawStructures: EnergyWithdrawStructure[] = [];
  public towers: StructureTower[] = [];
  public links: StructureLink[] = [];
  public inputLinks: StructureLink[] = [];
  public outputLinks: StructureLink[] = [];
  public sourceLinks: { [name: string]: StructureLink[] } = {};
  public controllerLinks: StructureLink[] = [];
  public extensions: StructureExtension[] = [];
  public spawns: StructureSpawn[] = [];
  public storage: StructureStorage | null = null;
  public neighborhoodRoomNames: string[] = [];

  // Enemy
  // TODO: turn this into a queue??
  public towerEnemies: Creep[] = [];
  public enemyCreeps: Creep[] = [];
  public enemyStructures: Structure[] = [];
  public sourceKeeperRoomNames: string[] = [];

  /* ********** Queues ********** */
  // Neutral

  // Owned
  public healQueue: PriorityQueue<HealQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });
  public constructionSiteQueue: PriorityQueue<ConstructionSite> = new PriorityQueue({
    comparator(a, b) {
      // Higher priority is dequeued first
      return b.progress - a.progress;
    }
  });
  public repairQueue: PriorityQueue<Structure> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.hits - b.hits;
    }
  });
  public inputQueue: PriorityQueue<MetabolicQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });
  public outputQueue: PriorityQueue<MetabolicQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Higher priority is dequeued first
      return b.priority - a.priority;
    }
  });
  public buildQueue: PriorityQueue<BuildQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });
  public spawnQueue: PriorityQueue<SpawnQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Higher priority is dequeued first
      return b.priority - a.priority;
    }
  });

  // Enemy
  public enemyQueue: PriorityQueue<EnemyQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });

  public constructor(spawn: StructureSpawn, imagination: Imagination) {
    this.spawnId = spawn.id;
    this.spawnRoom = Game.rooms[spawn.room.name];
    this.imagination = imagination;
    this.memoryIO = imagination.memory.imagination.metabolic[spawn.room.name];
    this.memoryGen = imagination.memory.imagination.genesis[spawn.room.name];
    this.memoryTerritory = imagination.memory.imagination.territory[spawn.room.name];
  }

  public get spawn(): StructureSpawn | null {
    return Game.getObjectById(this.spawnId);
  }

  public forget(): void {
    // Neutral
    this.structures = [];
    this.constructionSites = [];
    this.droppedResources = [];
    this.sources = [];
    this.containers = [];
    this.spawnContainers = [];
    this.sourceContainers = {};
    this.controllerContainers = [];
    this.standardRoomNames = [];
    this.centerRoomNames = [];
    this.highwayRoomNames = [];
    this.crossroadRoomNames = [];
    this.unknownRoomNames = [];

    // Owned
    this.healQueue.clear();
    this.constructionSiteQueue.clear();
    this.repairQueue.clear();
    this.inputQueue.clear();
    this.outputQueue.clear();
    this.myCreeps = [];
    this.myStructures = [];
    this.droppedResources = [];
    this.energyWithdrawStructures = [];
    this.towers = [];
    this.links = [];
    this.inputLinks = [];
    this.outputLinks = [];
    this.sourceLinks = {};
    this.controllerLinks = [];
    this.extensions = [];
    this.spawns = [];
    this.neighborhoodRoomNames = [];

    // Enemy
    this.enemyQueue.clear();
    this.towerEnemies = [];
    this.enemyCreeps = [];
    this.enemyStructures = [];
    this.sourceKeeperRoomNames = [];
  }

  public remember(): void {
    this.forget();
    this.memoryIO = this.imagination.memory.imagination.metabolic[this.spawnRoom.name];
    this.memoryGen = this.imagination.memory.imagination.genesis[this.spawnRoom.name];
    this.memoryTerritory = this.imagination.memory.imagination.territory[this.spawnRoom.name];
    for (const roomName in this.memoryTerritory.rooms) {
      const roomMemory = this.memoryTerritory.rooms[roomName];
      switch (roomMemory.roomType) {
        case RoomType.ROOM_CENTER:
          this.centerRoomNames.push(roomName);
          break;
        case RoomType.ROOM_SOURCE_KEEPER:
          this.sourceKeeperRoomNames.push(roomName);
          break;
        case RoomType.ROOM_HIGHWAY:
          this.highwayRoomNames.push(roomName);
          break;
        case RoomType.ROOM_CROSSROAD:
          this.crossroadRoomNames.push(roomName);
          break;
        case RoomType.ROOM_UNKNOWN:
          this.unknownRoomNames.push(roomName);
          break;
        case RoomType.ROOM_STANDARD:
          if (roomMemory.roomDistance < 5) {
            this.neighborhoodRoomNames.push(roomName);
            const room = Game.rooms[roomName];
            if (room) {
              this.enemyCreeps = this.enemyCreeps.concat(room.find(FIND_HOSTILE_CREEPS));
              this.myCreeps = this.myCreeps.concat(room.find(FIND_MY_CREEPS));
              this.structures = this.structures.concat(room.find(FIND_STRUCTURES));
              this.constructionSites = this.constructionSites.concat(room.find(FIND_CONSTRUCTION_SITES));
              this.droppedResources = this.droppedResources.concat(room.find(FIND_DROPPED_RESOURCES));
              this.sources = this.sources.concat(room.find(FIND_SOURCES));
            }
          } else {
            this.standardRoomNames.push(roomName);
          }
          break;
      }
    }
    // Process neutral
    this.processStructures();
    this.processConstructionSites();
    this.processDroppedResources();
    // Process owned
    this.processMyCreeps();
    // Process enemy
    this.processEnemyCreeps();
    this.processSpecial();
  }

  public contemplate(): void {
    this.pruneIO();
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
    const pos = new RoomPosition(1, 1, roomName);
    const roomData = this.memoryTerritory.rooms[roomName];
    Game.map.visual.rect(pos, 48, 48, { fill: color, opacity: 0.2 });
    Game.map.visual.text(`${text}-${roomData.roomDistance}`, pos, { align: "left" });
  }

  private processEnemyCreeps(): void {
    for (const enemyCreep of this.enemyCreeps) {
      this.enemyQueue.queue({
        enemyObject: enemyCreep,
        priority: enemyCreep.hits
      });
      if (
        enemyCreep.getActiveBodyparts(ATTACK) > 2 ||
        enemyCreep.getActiveBodyparts(RANGED_ATTACK) > 2 ||
        enemyCreep.hits < 1500
      ) {
        this.towerEnemies.push(enemyCreep);
      }
    }
  }

  private processMyCreeps(): void {
    for (const myCreep of this.myCreeps) {
      if (myCreep.hits < myCreep.hitsMax) {
        this.healQueue.queue({
          figment: myCreep,
          priority: myCreep.hits
        });
      }
    }
  }

  private processStructures(): void {
    for (const structure of this.structures) {
      if (structure instanceof StructureContainer) {
        this.containers.push(structure);
      } else if (structure instanceof OwnedStructure) {
        if (structure.hits < this.repairThreshold && structure.hits < structure.hitsMax) {
          this.repairQueue.queue(structure);
        }
        if (structure.my) {
          // Owned Structures
          this.myStructures.push(structure);
          this.addEnergyWithdrawStructure(structure);
          if (structure instanceof StructureLink) {
            this.links.push(structure);
          } else if (structure instanceof StructureStorage) {
            this.storage = structure;
            this.addInput(structure, structure.store.getUsedCapacity());
          } else if (structure instanceof StructureSpawn) {
            this.spawns.push(structure);
            this.addInput(structure, structure.store.getUsedCapacity(RESOURCE_ENERGY));
          } else if (structure instanceof StructureTower) {
            this.towers.push(structure);
          } else if (structure instanceof StructureExtension) {
            this.extensions.push(structure);
          }
        } else if (structure.owner && structure.owner.username !== this.imagination.username) {
          // Enemy Structures
          this.enemyStructures.push(structure);
          if (
            structure.structureType !== STRUCTURE_SPAWN &&
            structure.structureType !== STRUCTURE_KEEPER_LAIR &&
            structure.structureType !== STRUCTURE_CONTROLLER
          ) {
            this.enemyQueue.queue({
              enemyObject: structure,
              priority: structure.hits
            });
          }
        }
      }
    }
  }

  private processConstructionSites(): void {
    for (const cSite of this.constructionSites) {
      if (cSite.my) {
        this.constructionSiteQueue.queue(cSite);
      }
    }
  }

  private processDroppedResources(): void {
    for (const resource of this.droppedResources) {
      this.addOutput(resource, resource.amount);
    }
  }

  private processSpecial(): void {
    for (const source of this.sources) {
      const sourceContainers = _.filter(this.containers, c => c.pos.inRangeTo(source.pos, 1));
      for (const sourceContainer of sourceContainers) {
        this.addOutput(sourceContainer, sourceContainer.store.getUsedCapacity());
      }
      this.sourceContainers[source.id] = sourceContainers;
      const sourceLinks = _.filter(this.links, l => l.pos.inRangeTo(source.pos, 2));
      for (const sourceLink of sourceLinks) {
        this.outputLinks.push(sourceLink);
      }
      this.sourceLinks[source.id] = sourceLinks;
    }
    const controller = this.spawnRoom.controller;
    if (controller) {
      const controllerContainers = _.filter(this.containers, c => c.pos.inRangeTo(controller.pos, 1));
      for (const controllerContainer of controllerContainers) {
        this.addInput(controllerContainer, controllerContainer.store.getUsedCapacity());
      }
      this.controllerContainers = controllerContainers;
      const controllerLinks = _.filter(this.links, l => l.pos.inRangeTo(controller.pos, 2));
      for (const controllerLink of controllerLinks) {
        this.inputLinks.push(controllerLink);
      }
      this.controllerLinks = controllerLinks;
    }
    const spawn = this.spawn;
    if (spawn) {
      const spawnContainers = _.filter(this.containers, c => c.pos.inRangeTo(spawn.pos, 1));
      for (const spawnContainer of spawnContainers) {
        this.addInput(spawnContainer, spawnContainer.store.getUsedCapacity());
      }
      this.spawnContainers = spawnContainers;
    }
  }

  private getPayload(roomObject: Structure | Resource, priority: number): MetabolicQueuePayload {
    return {
      id: roomObject.id,
      pos: {
        x: roomObject.pos.x,
        y: roomObject.pos.y,
        roomName: roomObject.pos.roomName
      },
      priority
    };
  }

  private addInput(roomObject: StoreStructure, priority: number): void {
    let adjustedPriority = priority;
    if (this.memoryIO.metabolism.inputs[roomObject.id]) {
      for (const name in this.memoryIO.metabolism.inputs[roomObject.id]) {
        adjustedPriority += this.memoryIO.metabolism.inputs[roomObject.id][name].delta;
      }
    }
    const capacity = roomObject.store.getCapacity() || roomObject.store.getCapacity(RESOURCE_ENERGY);
    if (adjustedPriority < capacity) {
      this.inputQueue.queue(this.getPayload(roomObject, adjustedPriority));
    }
  }

  private addOutput(roomObject: StoreStructure | Resource, priority: number): void {
    let adjustedPriority = priority;
    if (this.memoryIO.metabolism.outputs[roomObject.id]) {
      for (const name in this.memoryIO.metabolism.outputs[roomObject.id]) {
        adjustedPriority -= this.memoryIO.metabolism.outputs[roomObject.id][name].delta;
      }
    }
    if (adjustedPriority > 0) {
      this.outputQueue.queue(this.getPayload(roomObject, adjustedPriority));
    }
  }

  private addEnergyWithdrawStructure(structure: Structure): void {
    // Don't withdraw from extensions or towers
    if (structure.structureType === STRUCTURE_EXTENSION) {
      return;
    } else if (structure.structureType === STRUCTURE_TOWER) {
      return;
    }
    if (isEnergyStructure(structure) && structure.energy > 0) {
      this.energyWithdrawStructures.push(structure);
    } else if (isStoreStructure(structure) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
      this.energyWithdrawStructures.push(structure);
    }
  }

  public metabolizeInput(figment: Figment): StoreStructure | Resource | null {
    if (this.inputQueue.length === 0) {
      return null;
    }
    const input = this.inputQueue.peek();
    if (!this.memoryIO.metabolism.inputs[input.id]) {
      this.memoryIO.metabolism.inputs[input.id] = {};
    }
    if (this.memoryIO.metabolism.inputs[input.id][figment.name]) {
      this.memoryIO.metabolism.inputs[input.id][figment.name].delta += figment.store.getUsedCapacity();
    } else {
      this.memoryIO.metabolism.inputs[input.id][figment.name] = {
        delta: figment.store.getUsedCapacity()
      };
    }
    return Game.getObjectById(input.id);
  }

  public metabolizeOutput(figment: Figment): StoreStructure | null {
    if (this.outputQueue.length === 0) {
      return null;
    }
    const output = this.outputQueue.peek();
    if (!this.memoryIO.metabolism.outputs[output.id]) {
      this.memoryIO.metabolism.outputs[output.id] = {};
    }
    if (this.memoryIO.metabolism.outputs[output.id][figment.name]) {
      this.memoryIO.metabolism.outputs[output.id][figment.name].delta += figment.store.getFreeCapacity();
    } else {
      this.memoryIO.metabolism.outputs[output.id][figment.name] = {
        delta: figment.store.getFreeCapacity()
      };
    }
    return Game.getObjectById(output.id);
  }

  public metabolizeClosestResourceOrStructure(figment: Figment): EnergyWithdrawStructure | Resource | null {
    let targets: ResourceOrEnergyWithdrawStructure[] = [];
    if (this.energyWithdrawStructures.length === 0 && this.droppedResources.length === 0) {
      return null;
    }
    targets = targets.concat(this.energyWithdrawStructures);
    targets = targets.concat(this.droppedResources);
    const target = _.first(_.sortBy(targets, r => PathFindWithRoad(figment.pos, r.pos).cost));
    // TODO: adjust priorities for inputs/outpus
    return target;
  }

  private pruneIO(): void {
    for (const input in this.memoryIO.metabolism.inputs) {
      if (!Game.getObjectById(input)) {
        delete this.memoryIO.metabolism.inputs[input];
      }
    }
    for (const output in this.memoryIO.metabolism.outputs) {
      if (!Game.getObjectById(output)) {
        delete this.memoryIO.metabolism.outputs[output];
      }
    }
  }

  public getNextEnemyTarget(): Creep | Structure | null {
    if (this.enemyQueue.length === 0) {
      return null;
    }

    return this.enemyQueue.peek().enemyObject;
  }

  public getNextHealTarget(): Creep | null {
    if (this.healQueue.length === 0) {
      return null;
    }

    return this.healQueue.peek().figment;
  }

  public getNextConstructionSite(): ConstructionSite | null {
    if (this.constructionSiteQueue.length === 0) {
      return null;
    }
    return this.constructionSiteQueue.peek();
  }

  public getNextRepairTarget(): Structure | null {
    if (this.repairQueue.length === 0) {
      return null;
    }
    return this.repairQueue.peek();
  }

  public inEcoMode(): boolean {
    if (this.storage && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) < this.ecoStorageThreshold) {
      return true;
    }
    return false;
  }

  public getNextReconRoomName(): string | undefined {
    if (this.reconRoomNames.length === 0) {
      this.populateReconRoomNames();
    }
    return this.reconRoomNames.shift();
  }

  private populateReconRoomNames(): void {
    const visitedRoomNames = Object.keys(this.memoryTerritory.rooms);
    for (const visitedRoomName of visitedRoomNames) {
      const neighborRoomNames = getNeighborRoomNames(visitedRoomName);
      for (const neighborRoomName of neighborRoomNames) {
        if (!this.memoryTerritory.rooms[neighborRoomName]) {
          const roomType = getRoomType(neighborRoomName);
          if (roomType !== RoomType.ROOM_STANDARD) {
            this.memoryTerritory.rooms[neighborRoomName] = getReconRoomData(this.spawnRoom.name, neighborRoomName);
          } else if (!this.reconRoomNames.includes(neighborRoomName)) {
            this.reconRoomNames.push(neighborRoomName);
          }
        }
      }
    }
  }

  public addReconRoomData(room: Room): void {
    if (!this.memoryTerritory.rooms[room.name]) {
      this.memoryTerritory.rooms[room.name] = getReconRoomData(this.spawnRoom.name, room.name);
    }
  }
}
