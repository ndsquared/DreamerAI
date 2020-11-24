/*
This module is responsible for managing any priority queues
*/
import { EnergyWithdrawStructure, ResourceOrEnergyWithdrawStructure } from "definitions/types";
import { PathFindWithRoad, isEnergyStructure, isStoreStructure } from "utils/misc";
import { Cortex } from "./cortex";
import { Figment } from "figments/figment";
import PriorityQueue from "ts-priority-queue";

export class Metabolism implements Temporal {
  private cortex: Cortex;
  private ecoStorageThreshold = 20000;
  public repairThreshold = 20000;
  // Neutral

  // Owned
  public healQueue: { [name: string]: PriorityQueue<HealQueuePayload> } = {};
  public constructionSiteQueue: { [name: string]: PriorityQueue<ConstructionSite> } = {};
  public repairQueue: { [name: string]: PriorityQueue<Structure> } = {};
  public inputQueue: { [name: string]: PriorityQueue<MetabolicQueuePayload> } = {};
  public outputQueue: { [name: string]: PriorityQueue<MetabolicQueuePayload> } = {};
  public buildQueue: { [name: string]: PriorityQueue<BuildQueuePayload> } = {};
  public spawnQueue: { [name: string]: PriorityQueue<SpawnQueuePayload> } = {};

  // Enemy
  public enemyQueue: { [name: string]: PriorityQueue<EnemyQueuePayload> } = {};

  public constructor(cortex: Cortex) {
    this.cortex = cortex;
  }

  public meditate(): void {
    this.forget();
  }

  public addMetabolismQueues(roomName: string): void {
    // Neutral

    // Owned
    this.healQueue[roomName] = new PriorityQueue({
      comparator(a, b) {
        // Lower priority is dequeued first
        return a.priority - b.priority;
      }
    });
    this.constructionSiteQueue[roomName] = new PriorityQueue({
      comparator(a, b) {
        // Higher priority is dequeued first
        return b.progress - a.progress;
      }
    });
    this.repairQueue[roomName] = new PriorityQueue({
      comparator(a, b) {
        // Lower priority is dequeued first
        return a.hits - b.hits;
      }
    });
    this.inputQueue[roomName] = new PriorityQueue({
      comparator(a, b) {
        // Lower priority is dequeued first
        return a.priority - b.priority;
      }
    });
    this.outputQueue[roomName] = new PriorityQueue({
      comparator(a, b) {
        // Higher priority is dequeued first
        return b.priority - a.priority;
      }
    });
    this.buildQueue[roomName] = new PriorityQueue({
      comparator(a, b) {
        // Lower priority is dequeued first
        return a.priority - b.priority;
      }
    });
    this.spawnQueue[roomName] = new PriorityQueue({
      comparator(a, b) {
        // Higher priority is dequeued first
        return b.priority - a.priority;
      }
    });

    // Enemy
    this.enemyQueue[roomName] = new PriorityQueue({
      comparator(a, b) {
        // Lower priority is dequeued first
        return a.priority - b.priority;
      }
    });
  }

  public forget(): void {
    for (const baseRoomName in this.cortex.baseRooms) {
      this.healQueue[baseRoomName].clear();
      this.constructionSiteQueue[baseRoomName].clear();
      this.repairQueue[baseRoomName].clear();
      this.inputQueue[baseRoomName].clear();
      this.outputQueue[baseRoomName].clear();
      this.enemyQueue[baseRoomName].clear();
    }
  }

  private getMetabolism(baseRoomName: string): MetabolismMemory {
    return this.cortex.memory.imagination.metabolic[baseRoomName].metabolism;
  }

  public inEcoMode(roomName: string): boolean {
    const storage = this.cortex.hippocampus.baseRoomObjects[roomName].storage;
    if (storage && storage.store.getUsedCapacity(RESOURCE_ENERGY) < this.ecoStorageThreshold) {
      return true;
    }
    return false;
  }

  public addInput(baseRoomName: string, roomObject: StoreStructure, priority: number): void {
    let adjustedPriority = priority;
    const metabolism = this.getMetabolism(baseRoomName);
    if (metabolism.inputs[roomObject.id]) {
      for (const name in metabolism.inputs[roomObject.id]) {
        adjustedPriority += metabolism.inputs[roomObject.id][name].delta;
      }
    }
    const capacity = roomObject.store.getCapacity() || roomObject.store.getCapacity(RESOURCE_ENERGY);
    if (adjustedPriority < capacity) {
      this.inputQueue[baseRoomName].queue(this.getPayload(roomObject, adjustedPriority));
    }
  }

  public addOutput(baseRoomName: string, roomObject: StoreStructure | Resource, priority: number): void {
    let adjustedPriority = priority;
    const metabolism = this.getMetabolism(baseRoomName);
    if (metabolism.outputs[roomObject.id]) {
      for (const name in metabolism.outputs[roomObject.id]) {
        adjustedPriority -= metabolism.outputs[roomObject.id][name].delta;
      }
    }
    if (adjustedPriority > 0) {
      this.outputQueue[baseRoomName].queue(this.getPayload(roomObject, adjustedPriority));
    }
  }

  public addEnergyWithdrawStructure(baseRoomName: string, structure: Structure): void {
    // Don't withdraw from extensions or towers
    if (structure.structureType === STRUCTURE_EXTENSION) {
      return;
    } else if (structure.structureType === STRUCTURE_TOWER) {
      return;
    }
    if (isEnergyStructure(structure) && structure.energy > 0) {
      this.cortex.hippocampus.neighborhood[baseRoomName].energyWithdrawStructures.push(structure);
    } else if (isStoreStructure(structure) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
      this.cortex.hippocampus.neighborhood[baseRoomName].energyWithdrawStructures.push(structure);
    }
  }

  public metabolizeInput(figment: Figment): StoreStructure | Resource | null {
    const baseRoomName = figment.memory.roomName;
    if (this.inputQueue[baseRoomName].length === 0) {
      return null;
    }
    const metabolism = this.getMetabolism(baseRoomName);
    const input = this.inputQueue[baseRoomName].peek();
    if (!metabolism.inputs[input.id]) {
      metabolism.inputs[input.id] = {};
    }
    if (metabolism.inputs[input.id][figment.name]) {
      metabolism.inputs[input.id][figment.name].delta += figment.store.getUsedCapacity();
    } else {
      metabolism.inputs[input.id][figment.name] = {
        delta: figment.store.getUsedCapacity()
      };
    }
    return Game.getObjectById(input.id);
  }

  public metabolizeOutput(figment: Figment): StoreStructure | null {
    const baseRoomName = figment.memory.roomName;
    if (this.outputQueue[baseRoomName].length === 0) {
      return null;
    }
    const metabolism = this.getMetabolism(baseRoomName);
    const output = this.outputQueue[baseRoomName].peek();
    if (!metabolism.outputs[output.id]) {
      metabolism.outputs[output.id] = {};
    }
    if (metabolism.outputs[output.id][figment.name]) {
      metabolism.outputs[output.id][figment.name].delta += figment.store.getFreeCapacity();
    } else {
      metabolism.outputs[output.id][figment.name] = {
        delta: figment.store.getFreeCapacity()
      };
    }
    return Game.getObjectById(output.id);
  }

  public metabolizeClosestResourceOrStructure(figment: Figment): EnergyWithdrawStructure | Resource | null {
    const baseRoomName = figment.memory.roomName;
    let targets: ResourceOrEnergyWithdrawStructure[] = [];
    const energyWithdrawStructures = this.cortex.hippocampus.neighborhood[baseRoomName]
      .energyWithdrawStructures as EnergyWithdrawStructure[];
    const resources = this.cortex.hippocampus.territory.resources;
    if (energyWithdrawStructures.length === 0 && resources.length === 0) {
      return null;
    }
    targets = targets.concat(energyWithdrawStructures);
    targets = targets.concat(resources);
    const target = _.first(_.sortBy(targets, r => PathFindWithRoad(figment.pos, r.pos).cost));
    // TODO: adjust priorities for inputs/outpus
    return target;
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
}
