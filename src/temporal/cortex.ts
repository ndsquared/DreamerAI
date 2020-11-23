import { EnergyWithdrawStructure } from "definitions/types";
import { Metabolism } from "./metabolism";
import { isInvulnerableStructure } from "utils/misc";

export class Cortex {
  public queuePriorities: { [type: string]: number } = {};
  public figmentNeeded: { [type: string]: boolean } = {};
  public roomObjects: { [name: string]: CortexRoomObjects } = {};
  public metabolism: Metabolism;

  public constructor(metabolism: Metabolism) {
    this.metabolism = metabolism;
  }

  /* ********** Arrays ********** */

  // Neutral
  public containers: StructureContainer[] = [];
  public spawnContainers: StructureContainer[] = [];
  public sourceContainers: { [name: string]: StructureContainer[] } = {};
  public controllerContainers: StructureContainer[] = [];

  // Owned
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

  // Enemy
  // TODO: turn this into a queue??
  public towerEnemies: Creep[] = [];
  public enemyStructures: Structure[] = [];

  public getRoomObjects(room: Room): void {
    this.roomObjects[room.name] = {
      enemyCreeps: room.find(FIND_HOSTILE_CREEPS),
      myCreeps: room.find(FIND_MY_CREEPS),
      structures: room.find(FIND_STRUCTURES),
      constructionSites: room.find(FIND_CONSTRUCTION_SITES),
      resources: room.find(FIND_DROPPED_RESOURCES),
      sources: room.find(FIND_SOURCES)
    };
  }

  public remember(): void {
    // Process neutral
    this.processStructures();
    this.processConstructionSites();
    this.processDroppedResources();
    // Process owned
    this.processMyCreeps();
    // Process enemy
    this.processEnemyCreeps();
    // Process special cases
    this.processSpecial();
  }

  private processEnemyCreeps(): void {
    for (const enemyCreep of this.enemyCreeps) {
      this.metabolism.enemyQueue.queue({
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
        this.metabolism.healQueue.queue({
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
        if (structure.hits < this.metabolism.repairThreshold && structure.hits < structure.hitsMax) {
          this.metabolism.repairQueue.queue(structure);
        }
        if (structure.my) {
          // Owned Structures
          this.myStructures.push(structure);
          this.metabolism.addEnergyWithdrawStructure(structure);
          if (structure instanceof StructureLink) {
            this.links.push(structure);
          } else if (structure instanceof StructureStorage) {
            this.storage = structure;
            this.metabolism.addInput(structure, structure.store.getUsedCapacity());
          } else if (structure instanceof StructureSpawn) {
            this.spawns.push(structure);
            this.metabolism.addInput(structure, structure.store.getUsedCapacity(RESOURCE_ENERGY));
          } else if (structure instanceof StructureTower) {
            this.towers.push(structure);
          } else if (structure instanceof StructureExtension) {
            this.extensions.push(structure);
          }
        } else if (structure.owner && !structure.my) {
          // Enemy Structures
          this.enemyStructures.push(structure);
          if (!isInvulnerableStructure(structure)) {
            this.metabolism.enemyQueue.queue({
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
        this.metabolism.constructionSiteQueue.queue(cSite);
      }
    }
  }

  private processDroppedResources(): void {
    for (const resource of this.droppedResources) {
      this.metabolism.addOutput(resource, resource.amount);
    }
  }

  private processSpecial(): void {
    for (const source of this.sources) {
      const sourceContainers = _.filter(this.containers, c => c.pos.inRangeTo(source.pos, 1));
      for (const sourceContainer of sourceContainers) {
        this.metabolism.addOutput(sourceContainer, sourceContainer.store.getUsedCapacity());
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
        this.metabolism.addInput(controllerContainer, controllerContainer.store.getUsedCapacity());
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
        this.metabolism.addInput(spawnContainer, spawnContainer.store.getUsedCapacity());
      }
      this.spawnContainers = spawnContainers;
    }
  }
}
