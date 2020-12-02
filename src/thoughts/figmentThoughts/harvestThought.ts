import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "../thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { PathFindWithRoad } from "utils/misc";

export class HarvestThought extends FigmentThought {
  private sourceId: Id<Source>;
  private sourcePos: RoomPosition;
  private containerId: Id<StructureContainer> | undefined = undefined;
  private linkId: Id<StructureLink> | undefined = undefined;
  private withinMinDist = true;
  public constructor(idea: Idea, type: FigmentThoughtType, source: Source) {
    super(idea, type, source.id);
    this.sourceId = source.id;
    this.sourcePos = source.pos;
    const pf = PathFindWithRoad(this.idea.cortex.getBaseOriginPos(this.idea.roomName), this.sourcePos);
    if (pf.cost > 100) {
      this.withinMinDist = false;
      console.log(`Source, ${this.sourceId}, is to far from room, ${this.idea.roomName}, to harvest`);
    }
    this.figments[FigmentThoughtType.HARVEST] = [];
  }

  public get source(): Source | null {
    return Game.getObjectById(this.sourceId);
  }

  public get container(): StructureContainer | null {
    if (this.containerId) {
      return Game.getObjectById(this.containerId);
    }
    this.containerId = undefined;
    return null;
  }

  public get link(): StructureLink | null {
    if (this.linkId) {
      return Game.getObjectById(this.linkId);
    }
    this.linkId = undefined;
    return null;
  }

  public ponder(): void {
    if (!this.containerId) {
      if (this.idea.neighborhood.sourceContainers[this.sourceId]?.length > 0) {
        this.containerId = this.idea.neighborhood.sourceContainers[this.sourceId][0].id;
      }
    }
    if (!this.linkId) {
      if (this.idea.baseRoomObjects.sourceLinks[this.sourceId]?.length > 0) {
        this.linkId = this.idea.baseRoomObjects.sourceLinks[this.sourceId][0].id;
      }
    }
  }

  public handleFigment(figment: Figment): boolean {
    if (!this.source) {
      figment.addNeuron(NeuronType.MOVE, "", this.sourcePos);
      return true;
    } else if (this.source.energy === 0) {
      if (figment.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
        figment.addNeuron(NeuronType.DROP);
      } else if (!figment.pos.inRangeTo(this.sourcePos, 3)) {
        figment.addNeuron(NeuronType.MOVE, "", this.sourcePos);
      }
      return true;
    }

    // TODO: Need to fix harvesters not moving to containers correctly
    if (this.container) {
      if (!this.container.pos.isEqualTo(figment.pos)) {
        const figments = this.container.pos.lookFor(LOOK_CREEPS);
        if (figments.length === 0) {
          figment.addNeuron(NeuronType.MOVE, this.container.id, this.container.pos, { moveRange: 0 });
        }
      }
    }

    let targetOptions;
    if (!this.link) {
      targetOptions = {
        ignoreFigmentCapacity: true
      };
    }
    if (figment.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      figment.addNeuron(NeuronType.HARVEST, this.source.id, this.source.pos, targetOptions);
    } else if (this.link && this.link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      figment.addNeuron(NeuronType.TRANSFER, this.link.id, this.link.pos);
    } else {
      figment.addNeuron(NeuronType.DROP);
    }
    return true;
  }

  public figmentNeeded(figmentType: string): boolean {
    if (!this.withinMinDist) {
      return false;
    }
    const room = Game.rooms[this.sourcePos.roomName];
    let controller: StructureController | undefined;
    if (room) {
      controller = room.controller;
    }
    // TODO: Logic below should be a prototype or misc function
    if (controller && controller.reservation && controller.reservation.username !== this.idea.imagination.username) {
      return false;
    }
    if (controller && controller.owner && !controller.my) {
      return false;
    }
    // TODO: could also calculate TTL and length of path to optimize replacements
    if (this.source) {
      const totalWorkParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(WORK));
      const availablePos = this.source.pos.availableAdjacentPositions(true);
      if (totalWorkParts < 5 && this.figments[figmentType].length < availablePos.length) {
        return true;
      }
    }
    return false;
  }
}
