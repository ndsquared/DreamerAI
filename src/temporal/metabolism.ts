import PriorityQueue from "ts-priority-queue";

export class Metabolism {
  private ecoStorageThreshold = 20000;
  public repairThreshold = 20000;
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

  public forget(): void {
    this.healQueue.clear();
    this.constructionSiteQueue.clear();
    this.repairQueue.clear();
    this.inputQueue.clear();
    this.outputQueue.clear();
    this.enemyQueue.clear();
  }

  public inEcoMode(): boolean {
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
