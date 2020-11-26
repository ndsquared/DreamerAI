/*
This module is responsible for short-term memory management
*/
import { Cortex } from "./cortex";
import { Spatial } from "./spatial";
import { isInvulnerableStructure } from "utils/misc";

export class Hippocampus implements Temporal {
  public roomObjects: { [name: string]: HippocampusRoomObjects } = {};
  public territory: TerritoryObjects = {
    enemyCreeps: [],
    enemyStructures: [],
    myCreeps: [],
    resources: []
  };
  public neighborhood: { [name: string]: NeighborhoodObjects } = {};
  public baseRoomObjects: { [name: string]: BaseRoomObjects } = {};
  public cortex: Cortex;
  public spatial: Spatial;

  public constructor(cortex: Cortex) {
    this.cortex = cortex;
    this.spatial = new Spatial(cortex);
  }

  public meditate(): void {
    for (const roomName in this.cortex.memory.rooms) {
      const room = Game.rooms[roomName];
      this.spatial.processRoom(roomName);
      if (room) {
        this.getRoomObjects(room);
        const baseRoomName = this.cortex.memory.imagination.neighborhoods.roomsInNeighborhoods[roomName];
        if (baseRoomName) {
          if (!this.neighborhood[baseRoomName]) {
            this.neighborhood[baseRoomName] = {
              sources: [],
              sourceContainers: {},
              energyWithdrawStructures: [],
              neighborhoodCreeps: []
            };
          }
          if (!this.baseRoomObjects[baseRoomName]) {
            this.baseRoomObjects[baseRoomName] = {
              spawnContainers: [],
              controllerContainers: [],
              towerEnemies: [],
              inputLinks: [],
              outputLinks: [],
              sourceLinks: {},
              controllerLinks: [],
              extensions: [],
              towers: [],
              spawns: [],
              storage: null,
              terminal: null,
              controller: null,
              minerals: [],
              extractors: [],
              extractorContainers: {}
            };
          }
        }
        this.processRoomObjects(roomName, baseRoomName);
        this.spatial.scoreRoom(room);
      }
      // process spatial stuff
    }
  }

  public getRoomObjects(room: Room): void {
    this.roomObjects[room.name] = {
      creeps: room.find(FIND_CREEPS),
      structures: room.find(FIND_STRUCTURES),
      constructionSites: room.find(FIND_CONSTRUCTION_SITES),
      resources: room.find(FIND_DROPPED_RESOURCES),
      sources: room.find(FIND_SOURCES),
      minerals: room.find(FIND_MINERALS),
      containers: [],
      links: [],
      enemyCreeps: [],
      enemyStructures: []
    };
  }

  public processRoomObjects(roomName: string, baseRoomName: string): void {
    // Process neutral
    this.processStructures(roomName, baseRoomName);
    this.processConstructionSites(roomName, baseRoomName);
    this.processDroppedResources(roomName, baseRoomName);
    this.processCreeps(roomName, baseRoomName);
    this.processSources(roomName, baseRoomName);
    this.processMinerals(roomName, baseRoomName);
    // Process special cases
    this.processSpecial(roomName, baseRoomName);
  }

  private processCreeps(roomName: string, baseRoomName: string): void {
    for (const creep of this.roomObjects[roomName].creeps) {
      if (creep.my) {
        this.territory.myCreeps.push(creep);
        if (!baseRoomName) {
          continue;
        }
        this.neighborhood[baseRoomName].neighborhoodCreeps.push(creep);
        if (creep.hits < creep.hitsMax) {
          this.cortex.metabolism.healQueue[baseRoomName].queue({
            figment: creep,
            priority: creep.hits
          });
        }
      } else {
        this.territory.enemyCreeps.push(creep);
        this.roomObjects[roomName].enemyCreeps.push(creep);
        if (!baseRoomName) {
          continue;
        }
        this.cortex.metabolism.enemyQueue[baseRoomName].queue({
          enemyObject: creep,
          priority: creep.hits
        });
        if (creep.getActiveBodyparts(ATTACK) > 2 || creep.getActiveBodyparts(RANGED_ATTACK) > 2 || creep.hits < 1500) {
          this.baseRoomObjects[baseRoomName].towerEnemies.push(creep);
        }
      }
    }
  }

  private processStructures(roomName: string, baseRoomName: string): void {
    for (const structure of this.roomObjects[roomName].structures) {
      if (structure instanceof StructureContainer) {
        this.roomObjects[roomName].containers.push(structure);
      } else if (structure instanceof OwnedStructure) {
        if (structure.hits < this.cortex.metabolism.repairThreshold && structure.hits < structure.hitsMax) {
          this.cortex.metabolism.repairQueue[baseRoomName].queue(structure);
        }
        if (structure.my) {
          // Owned Structures
          this.cortex.metabolism.addEnergyWithdrawStructure(baseRoomName, structure);
          if (structure instanceof StructureStorage) {
            this.baseRoomObjects[baseRoomName].storage = structure;
            this.cortex.metabolism.addInput(baseRoomName, structure, structure.store.getUsedCapacity());
          } else if (structure instanceof StructureSpawn) {
            this.baseRoomObjects[baseRoomName].spawns.push(structure);
            this.cortex.metabolism.addInput(baseRoomName, structure, structure.store.getUsedCapacity(RESOURCE_ENERGY));
          } else if (structure instanceof StructureTower) {
            this.baseRoomObjects[baseRoomName].towers.push(structure);
          } else if (structure instanceof StructureExtension) {
            this.baseRoomObjects[baseRoomName].extensions.push(structure);
          } else if (structure instanceof StructureController) {
            this.baseRoomObjects[baseRoomName].controller = structure;
          } else if (structure instanceof StructureLink) {
            this.roomObjects[roomName].links.push(structure);
          } else if (structure instanceof StructureExtractor) {
            this.baseRoomObjects[baseRoomName].extractors.push(structure);
          } else if (structure instanceof StructureTerminal) {
            this.baseRoomObjects[baseRoomName].terminal = structure;
          }
        } else if (structure.owner && !structure.my) {
          // Enemy Structures
          if (!isInvulnerableStructure(structure)) {
            this.territory.enemyStructures.push(structure);
            this.roomObjects[roomName].enemyStructures.push(structure);
            if (!baseRoomName) {
              continue;
            }
            this.cortex.metabolism.enemyQueue[baseRoomName].queue({
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
        this.cortex.metabolism.constructionSiteQueue[baseRoomName].queue(cSite);
      }
    }
  }

  private processDroppedResources(roomName: string, baseRoomName: string): void {
    for (const resource of this.roomObjects[roomName].resources) {
      this.territory.resources.push(resource);
      if (!baseRoomName) {
        continue;
      }
      this.cortex.metabolism.addOutput(baseRoomName, resource, resource.amount);
    }
  }

  private processSources(roomName: string, baseRoomName: string): void {
    if (!baseRoomName) {
      return;
    }
    for (const source of this.roomObjects[roomName].sources) {
      this.neighborhood[baseRoomName].sources.push(source);
    }
  }

  private processMinerals(roomName: string, baseRoomName: string): void {
    if (!baseRoomName) {
      return;
    }
    for (const mineral of this.roomObjects[roomName].minerals) {
      this.baseRoomObjects[baseRoomName].minerals.push(mineral);
    }
  }

  private processSpecial(roomName: string, baseRoomName: string): void {
    if (!baseRoomName) {
      return;
    }
    for (const source of this.roomObjects[roomName].sources) {
      const sourceContainers = _.filter(this.roomObjects[roomName].containers, c => c.pos.inRangeTo(source.pos, 1));
      for (const sourceContainer of sourceContainers) {
        this.cortex.metabolism.addOutput(baseRoomName, sourceContainer, sourceContainer.store.getUsedCapacity());
      }
      this.neighborhood[baseRoomName].sourceContainers[source.id] = sourceContainers;
      if (roomName !== baseRoomName) {
        continue;
      }
      const sourceLinks = _.filter(this.roomObjects[roomName].links, l => l.pos.inRangeTo(source.pos, 2));
      for (const sourceLink of sourceLinks) {
        this.baseRoomObjects[baseRoomName].outputLinks.push(sourceLink);
      }
      this.baseRoomObjects[baseRoomName].sourceLinks[source.id] = sourceLinks;
    }
    if (roomName !== baseRoomName) {
      return;
    }
    const controller = this.baseRoomObjects[baseRoomName].controller;
    if (controller) {
      const controllerContainers = _.filter(this.roomObjects[roomName].containers, c =>
        c.pos.inRangeTo(controller.pos, 1)
      );
      for (const controllerContainer of controllerContainers) {
        this.cortex.metabolism.addInput(baseRoomName, controllerContainer, controllerContainer.store.getUsedCapacity());
      }
      this.baseRoomObjects[baseRoomName].controllerContainers = controllerContainers;
      const controllerLinks = _.filter(this.roomObjects[roomName].links, l => l.pos.inRangeTo(controller.pos, 2));
      for (const controllerLink of controllerLinks) {
        this.baseRoomObjects[baseRoomName].inputLinks.push(controllerLink);
      }
      this.baseRoomObjects[baseRoomName].controllerLinks = controllerLinks;
    }
    const baseOriginPos = this.cortex.getBaseOriginPos(baseRoomName);
    const spawnContainers = _.filter(this.roomObjects[roomName].containers, c => c.pos.inRangeTo(baseOriginPos, 1));
    for (const spawnContainer of spawnContainers) {
      this.cortex.metabolism.addInput(baseRoomName, spawnContainer, spawnContainer.store.getUsedCapacity());
    }
    this.baseRoomObjects[baseRoomName].spawnContainers = spawnContainers;
    for (const extractor of this.baseRoomObjects[baseRoomName].extractors) {
      const extractorContainers = _.filter(this.roomObjects[roomName].containers, c => c.pos.inRangeTo(extractor, 1));
      for (const extractorContainer of extractorContainers) {
        this.cortex.metabolism.addOutput(baseRoomName, extractorContainer, extractorContainer.store.getUsedCapacity());
      }
      this.baseRoomObjects[baseRoomName].extractorContainers[extractor.id] = extractorContainers;
    }
  }
}
