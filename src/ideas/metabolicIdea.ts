import { Idea, IdeaType } from "./idea";
import { PathFindWithRoad, isEnergyStructure, isStoreStructure } from "utils/misc";
import { Figment } from "figments/figment";
import { Imagination } from "imagination";
import PriorityQueue from "ts-priority-queue";
import { getColor } from "utils/colors";

type EnergyWithdrawStructure = StoreStructure | EnergyStructure;
type ResourceOrEnergyWithdrawStructure = EnergyWithdrawStructure | Resource;

export class MetabolicIdea extends Idea {
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
  private memory: MetabolicMemory;
  public droppedResources: Resource[] = [];
  public energyWithdrawStructures: EnergyWithdrawStructure[] = [];
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType) {
    super(spawn, imagination, type);
    this.memory = imagination.memory.imagination.metabolicIdeas[this.name];
  }

  public getOutputs(): number {
    return this.outputQueue.length;
  }

  public ponder(): void {
    this.memory = this.imagination.memory.imagination.metabolicIdeas[this.name];
    this.inputQueue.clear();
    this.outputQueue.clear();
    this.droppedResources = [];
    this.energyWithdrawStructures = [];
    for (const room of this.spawn.room.neighborhood) {
      this.fillQueues(room);
    }
  }

  public reflect(): void {
    this.pruneIO();
    this.contemplate();
    this.imagination.memory.imagination.metabolicIdeas[this.name] = this.memory;
  }

  private pruneIO(): void {
    for (const input in this.memory.metabolism.inputs) {
      if (!Game.getObjectById(input)) {
        delete this.memory.metabolism.inputs[input];
      }
    }
    for (const output in this.memory.metabolism.outputs) {
      if (!Game.getObjectById(output)) {
        delete this.memory.metabolism.outputs[output];
      }
    }
  }

  private contemplate(): void {
    if (!this.showMetaVisuals) {
      return;
    }
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

  public metabolizeClosestResourceOrStructure(figment: Figment): EnergyWithdrawStructure | Resource | null {
    let targets: ResourceOrEnergyWithdrawStructure[] = [];
    if (this.energyWithdrawStructures.length === 0) {
      return null;
    }
    targets = targets.concat(this.energyWithdrawStructures);
    targets = targets.concat(this.droppedResources);
    const target = _.first(_.sortBy(targets, r => PathFindWithRoad(figment.pos, r.pos).cost));
    // TODO: adjust priorities for inputs/outpus
    return target;
  }

  public metabolizeInput(figment: Figment): StoreStructure | Resource | null {
    if (this.inputQueue.length === 0) {
      return null;
    }
    const input = this.inputQueue.peek();
    if (!this.memory.metabolism.inputs[input.id]) {
      this.memory.metabolism.inputs[input.id] = {};
    }
    if (this.memory.metabolism.inputs[input.id][figment.name]) {
      this.memory.metabolism.inputs[input.id][figment.name].delta += figment.store.getUsedCapacity();
    } else {
      this.memory.metabolism.inputs[input.id][figment.name] = {
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
    if (!this.memory.metabolism.outputs[output.id]) {
      this.memory.metabolism.outputs[output.id] = {};
    }
    if (this.memory.metabolism.outputs[output.id][figment.name]) {
      this.memory.metabolism.outputs[output.id][figment.name].delta += figment.store.getFreeCapacity();
    } else {
      this.memory.metabolism.outputs[output.id][figment.name] = {
        delta: figment.store.getFreeCapacity()
      };
    }
    return Game.getObjectById(output.id);
  }

  private addInput(roomObject: StoreStructure, priority: number): void {
    let adjustedPriority = priority;
    if (this.memory.metabolism.inputs[roomObject.id]) {
      for (const name in this.memory.metabolism.inputs[roomObject.id]) {
        adjustedPriority += this.memory.metabolism.inputs[roomObject.id][name].delta;
      }
    }
    const capacity = roomObject.store.getCapacity() || roomObject.store.getCapacity(RESOURCE_ENERGY);
    if (adjustedPriority < capacity) {
      this.inputQueue.queue(this.getPayload(roomObject, adjustedPriority));
    }
  }

  private addOutput(roomObject: StoreStructure | Resource, priority: number): void {
    let adjustedPriority = priority;
    if (this.memory.metabolism.outputs[roomObject.id]) {
      for (const name in this.memory.metabolism.outputs[roomObject.id]) {
        adjustedPriority -= this.memory.metabolism.outputs[roomObject.id][name].delta;
      }
    }
    if (adjustedPriority > 0) {
      this.outputQueue.queue(this.getPayload(roomObject, adjustedPriority));
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

  private fillQueues(room: Room): void {
    // Add resources to output queue
    const resources = room.find(FIND_DROPPED_RESOURCES);
    for (const resource of resources) {
      this.addOutput(resource, resource.amount);
      this.droppedResources.push(resource);
    }
    // Add structures to queues
    const structures = room.find(FIND_STRUCTURES);
    for (const s of structures) {
      this.addEnergyWithdrawStructure(s);
      if (s.structureType === STRUCTURE_CONTAINER) {
        const controller = s.room.controller;
        if (controller) {
          if (controller.pos.inRangeTo(s.pos, 1)) {
            this.addInput(s, s.store.getUsedCapacity());
          }
        }
        const sources = s.pos.findInRange(FIND_SOURCES, 1);
        if (sources.length) {
          this.addOutput(s, s.store.getUsedCapacity());
        }
        const spawns = s.pos.findInRange(FIND_STRUCTURES, 2, {
          filter: spawn => {
            if (spawn.structureType === STRUCTURE_SPAWN) {
              return true;
            }
            return false;
          }
        });
        if (spawns.length) {
          this.addInput(s, s.store.getUsedCapacity());
        }
      } else if (s.structureType === STRUCTURE_STORAGE && s.my) {
        this.addInput(s, s.store.getUsedCapacity());
      } else if (s.structureType === STRUCTURE_SPAWN && s.my) {
        this.addInput(s, s.store.getUsedCapacity(RESOURCE_ENERGY));
      } else if (s.structureType === STRUCTURE_LINK && s.my) {
        // TODO: Only add the link next to the controller
        // this.addOutput(s, s.store.getUsedCapacity(RESOURCE_ENERGY));
      }
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
}
