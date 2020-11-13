import { Idea, IdeaType } from "./idea";
import { Imagination } from "imagination";
import PriorityQueue from "ts-priority-queue";

export class MetabolicIdea extends Idea {
  private inputQueue: PriorityQueue<MetabolicQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });
  private outputQueue: PriorityQueue<MetabolicQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Higher priority is dequeued first
      return b.priority - a.priority;
    }
  });

  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType, idea: Idea) {
    super(spawn, imagination, type, idea);
  }

  public ponder(): void {
    if (this.inputQueue.length === 0 || this.outputQueue.length === 0) {
      for (const room of this.spawn.room.neighborhood) {
        this.fillQueues(room);
      }
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
      this.outputQueue.queue(this.getPayload(resource, resource.amount));
    }
    // Add structures to queues
    const structures = room.find(FIND_STRUCTURES);
    for (const s of structures) {
      if (s.structureType === STRUCTURE_CONTAINER) {
        const controller = s.room.controller;
        if (controller) {
          if (controller.pos.inRangeTo(s.pos, 1)) {
            this.inputQueue.queue(this.getPayload(s, s.store.getFreeCapacity()));
          }
        }
        const sources = s.pos.findInRange(FIND_SOURCES, 1);
        if (sources.length) {
          this.outputQueue.queue(this.getPayload(s, s.store.getUsedCapacity()));
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
          this.inputQueue.queue(this.getPayload(s, s.store.getFreeCapacity()));
        }
      } else if (s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity() > 0) {
        this.inputQueue.queue(this.getPayload(s, s.store.getFreeCapacity()));
      } else if (s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        this.inputQueue.queue(this.getPayload(s, s.store.getFreeCapacity(RESOURCE_ENERGY)));
      } else if (s.structureType === STRUCTURE_LINK && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
        this.outputQueue.queue(this.getPayload(s, s.store.getUsedCapacity(RESOURCE_ENERGY)));
      }
    }
  }
}
