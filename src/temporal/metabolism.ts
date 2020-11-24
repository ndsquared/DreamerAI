/*
This module is responsible for managing any priority queues
*/
import { Cortex } from "./cortex";
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
  public contemplate(): void {
    // Post metabolism shenanigans
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

  public inEcoMode(roomName: string): boolean {
    if (this.storage && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) < this.ecoStorageThreshold) {
      return true;
    }
    return false;
  }

  public addInput(roomObject: StoreStructure, priority: number): void {
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

  public addOutput(roomObject: StoreStructure | Resource, priority: number): void {
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

  public addEnergyWithdrawStructure(structure: Structure): void {
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
