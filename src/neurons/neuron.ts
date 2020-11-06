import { Figment } from "figment";

/*
Heavily inspired by https://github.com/bencbartlett/creep-tasks
*/
export abstract class Neuron {
  protected figment: Figment;
  protected interneuron: Interneuron;

  public constructor(figment: Figment, interneuron: Interneuron) {
    this.figment = figment;
    this.interneuron = interneuron;
  }

  protected get target(): RoomObject | null {
    const roomObject = Game.getObjectById(this.interneuron.target.ref);
    if (roomObject && roomObject instanceof RoomObject) {
      return roomObject;
    }
    return null;
  }

  protected get targetPos(): RoomPosition {
    const roomPosition = new RoomPosition(
      this.interneuron.target.pos.x,
      this.interneuron.target.pos.y,
      this.interneuron.target.pos.roomName
    );
    return roomPosition;
  }

  abstract isValidNeuron(): boolean;

  abstract isValidTarget(): boolean;

  public isValid(): boolean {
    return this.isValidNeuron() && this.isValidTarget();
  }

  abstract impulse(): number;

  public run(): void {
    if (
      this.interneuron.target.options.moveOffRoadDuringImpulse &&
      this.figment.pos.inRangeTo(this.targetPos, this.interneuron.target.options.targetRange) &&
      !this.figment.pos.isEdge
    ) {
      this.moveFigmentOffRoad(this.figment, this.targetPos, true);
    }
    const impulseResult = this.impulse();
    if (impulseResult === ERR_NOT_IN_RANGE || this.interneuron.target.options.movingTarget) {
      const result = this.figment.travelTo(this.targetPos, {
        movingTarget: this.interneuron.target.options.movingTarget
      });
      if (result === global.ERR_INVALID_NEURON) {
        this.figment.memory.interneurons = [];
      }
    } else if (impulseResult !== OK) {
      const randomDir = _.random(1, 8);
      this.figment.move(randomDir as DirectionConstant);
    }
  }

  protected moveFigmentOffRoad(figment: Figment, pos: RoomPosition = figment.pos, maintainDistance = false): number {
    const road = _.find(figment.pos.lookFor(LOOK_STRUCTURES), s => s.structureType === STRUCTURE_ROAD);
    if (!road) {
      return OK;
    }

    let positions = _.sortBy(figment.pos.availableNeighbors(), (p: RoomPosition) => p.getRangeTo(pos));
    if (maintainDistance) {
      const currentRange = figment.pos.getRangeTo(pos);
      positions = _.filter(positions, (p: RoomPosition) => p.getRangeTo(pos) <= currentRange);
    }

    let swampPosition;
    for (const position of positions) {
      if (_.find(position.lookFor(LOOK_STRUCTURES), s => s.structureType === STRUCTURE_ROAD)) {
        continue;
      }
      const terrain = position.lookFor(LOOK_TERRAIN)[0];
      if (terrain === "swamp") {
        swampPosition = position;
      } else {
        return figment.move(figment.pos.getDirectionTo(position));
      }
    }

    if (swampPosition) {
      return figment.move(figment.pos.getDirectionTo(swampPosition));
    }

    return figment.travelTo(pos);
  }
}
