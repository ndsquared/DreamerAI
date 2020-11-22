import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "./thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class HarvestThought extends FigmentThought {
  private source: Source | null;
  private sourceId: Id<Source>;
  private sourcePos: RoomPosition;
  private container: StructureContainer | null = null;
  private link: StructureLink | null = null;
  public constructor(idea: Idea, type: FigmentThoughtType, source: Source) {
    super(idea, type, source.id);
    this.source = source;
    this.sourceId = source.id;
    this.sourcePos = source.pos;
    this.figments[FigmentThoughtType.HARVEST] = [];
  }

  public ponder(): void {
    this.source = Game.getObjectById(this.sourceId);
    if (!this.source) {
      return;
    }
    if (!this.container) {
      if (this.idea.hippocampus.sourceContainers[this.sourceId].length > 0) {
        this.container = this.idea.hippocampus.sourceContainers[this.sourceId][0];
      }
    } else {
      this.container = Game.getObjectById(this.container.id);
    }

    if (!this.link) {
      if (this.idea.hippocampus.sourceLinks[this.sourceId].length > 0) {
        this.link = this.idea.hippocampus.sourceLinks[this.sourceId][0];
      }
    } else {
      this.link = Game.getObjectById(this.link.id);
    }
  }

  public handleFigment(figment: Figment): void {
    if (!this.source) {
      figment.addNeuron(NeuronType.MOVE, "", this.sourcePos);
      return;
    } else if (this.source.energy === 0) {
      if (figment.store.getUsedCapacity() > 0) {
        figment.addNeuron(NeuronType.DROP);
      } else if (!figment.pos.inRangeTo(this.sourcePos, 3)) {
        figment.addNeuron(NeuronType.MOVE, "", this.sourcePos);
      }
      return;
    }

    if (this.container) {
      if (!this.container.pos.isEqualTo(figment.pos)) {
        const figments = this.container.pos.lookFor(LOOK_CREEPS);
        if (figments.length === 0) {
          figment.addNeuron(NeuronType.MOVE, this.container.id, this.container.pos, { moveRange: 0 });
        }
      }
    }

    let targetOptions = null;
    if (!this.link) {
      targetOptions = {
        ignoreFigmentCapacity: true
      };
    }
    if (figment.store.getUsedCapacity() === 0) {
      figment.addNeuron(NeuronType.HARVEST, this.source.id, this.source.pos, targetOptions);
    } else if (this.link && this.link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      figment.addNeuron(NeuronType.TRANSFER, this.link.id, this.link.pos);
    } else {
      figment.addNeuron(NeuronType.DROP);
    }
  }

  public figmentNeeded(figmentType: string): boolean {
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
    this.source = Game.getObjectById(this.sourceId);
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
