import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class HarvestThought extends FigmentThought {
  private source: Source | null;
  private sourceId: Id<Source>;
  private sourcePos: RoomPosition;
  public constructor(idea: Idea, name: string, source: Source) {
    super(idea, name, source.id);
    this.source = source;
    this.sourceId = source.id;
    this.sourcePos = source.pos;
    this.figments[FigmentType.HARVEST] = [];
  }

  // TODO: save container and link as variables
  public handleFigment(figment: Figment): void {
    if (!this.source) {
      this.source = Game.getObjectById(this.sourceId);
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

    const containers = this.source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });

    if (containers.length > 0) {
      if (!containers[0].pos.isEqualTo(figment.pos)) {
        const figments = containers[0].pos.lookFor(LOOK_CREEPS);
        if (figments.length === 0) {
          figment.addNeuron(NeuronType.MOVE, containers[0].id, containers[0].pos, { moveRange: 0 });
        }
      }
    }

    let targetOptions = null;
    let useLink = false;
    const links = this.source.pos.findInRange(FIND_STRUCTURES, 2, {
      filter: s => s.structureType === STRUCTURE_LINK
    });
    if (links.length) {
      useLink = true;
    }
    if (!useLink) {
      targetOptions = {
        ignoreFigmentCapacity: true
      };
    }
    if (figment.store.getUsedCapacity() === 0) {
      figment.addNeuron(NeuronType.HARVEST, this.source.id, this.source.pos, targetOptions);
    } else if (links.length) {
      const target = links[0];
      figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
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
    if (!controller) {
      return false;
    }
    if (controller.reservation && controller.reservation.username !== this.idea.spawn.owner.username) {
      return false;
    }
    if (controller.owner && controller.owner.username !== this.idea.spawn.owner.username) {
      return false;
    }
    // console.log(this.figments[figmentType].length);
    this.source = Game.getObjectById(this.sourceId);
    if (this.source) {
      const totalWorkParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(WORK));
      const availablePos = this.source.pos.availableNeighbors(true);
      if (totalWorkParts < 5 && this.figments[figmentType].length < availablePos.length) {
        // console.log(
        //   `harvest needed with total work parts ${totalWorkParts}, available spots ${
        //     availablePos.length
        //   } at ${this.source.pos.toString()}`
        // );
        return true;
      }
    }
    return false;
  }
}
