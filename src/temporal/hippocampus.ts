/*
This module is responsible for short-term memory management
*/
import { Cortex } from "./cortex";
import { isInvulnerableStructure } from "utils/misc";

export class Hippocampus implements Temporal {
  public figmentPreferences: { [name: string]: FigmentPreferences } = {};
  public roomObjects: { [name: string]: HippocampusRoomObjects } = {};
  public cortex: Cortex;

  public constructor(cortex: Cortex) {
    this.cortex = cortex;
  }

  public meditate(): void {
    for (const roomName in this.cortex.memory.rooms) {
      const room = Game.rooms[roomName];
      if (room) {
        this.getRoomObjects(room);
        this.processRoomObjects(roomName);
      }
      // process spatial stuff
    }
  }

  public contemplate(): void {
    // contemplating...
  }

  public getRoomObjects(room: Room): void {
    this.roomObjects[room.name] = {
      creeps: room.find(FIND_CREEPS),
      structures: room.find(FIND_STRUCTURES),
      constructionSites: room.find(FIND_CONSTRUCTION_SITES),
      resources: room.find(FIND_DROPPED_RESOURCES),
      sources: room.find(FIND_SOURCES)
    };
  }

  public processRoomObjects(roomName: string, baseRoomName: string): void {
    // Process neutral
    this.processStructures(roomName, baseRoomName);
    this.processConstructionSites(roomName, baseRoomName);
    this.processDroppedResources(roomName, baseRoomName);
    this.processCreeps(roomName, baseRoomName);
    // Process special cases
    this.processSpecial(roomName, baseRoomName);
  }

  private processCreeps(roomName: string, baseRoomName: string): void {
    for (const creep of this.roomObjects[roomName].creeps) {
      if (creep.my) {
        if (creep.hits < creep.hitsMax) {
          this.metabolism.healQueue[baseRoomName].queue({
            figment: creep,
            priority: creep.hits
          });
        }
      } else {
        this.metabolism.enemyQueue[baseRoomName].queue({
          enemyObject: creep,
          priority: creep.hits
        });
        if (creep.getActiveBodyparts(ATTACK) > 2 || creep.getActiveBodyparts(RANGED_ATTACK) > 2 || creep.hits < 1500) {
          this.towerEnemies.push(creep);
        }
      }
    }
  }

  private processStructures(roomName: string, baseRoomName: string): void {
    for (const structure of this.roomObjects[roomName].structures) {
      if (structure instanceof StructureContainer) {
        this.containers.push(structure);
      } else if (structure instanceof OwnedStructure) {
        if (structure.hits < this.metabolism.repairThreshold && structure.hits < structure.hitsMax) {
          this.metabolism.repairQueue[baseRoomName].queue(structure);
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
            this.metabolism.enemyQueue[baseRoomName].queue({
              enemyObject: structure,
              priority: structure.hits
            });
          }
        }
      }
    }
  }

  private processConstructionSites(roomName: string, baseRoomName: string): void {
    for (const cSite of this.roomObjects[roomName].constructionSites) {
      if (cSite.my) {
        this.metabolism.constructionSiteQueue[baseRoomName].queue(cSite);
      }
    }
  }

  private processDroppedResources(roomName: string, baseRoomName: string): void {
    for (const resource of this.roomObjects[roomName].resources) {
      this.metabolism.addOutput(resource, resource.amount);
    }
  }

  private processSpecial(roomName: string, baseRoomName: string): void {
    for (const source of this.roomObjects[roomName].sources) {
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
