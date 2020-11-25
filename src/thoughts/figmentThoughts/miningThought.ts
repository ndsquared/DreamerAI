import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "../thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { PathFindWithRoad } from "utils/misc";

export class MiningThought extends FigmentThought {
  private extractorId: Id<StructureExtractor>;
  private extractoPos: RoomPosition;
  private containerId: Id<StructureContainer> | undefined = undefined;
  private mineralId: Id<Mineral> | undefined = undefined;
  private withinMinDist = true;
  public constructor(idea: Idea, type: FigmentThoughtType, extractor: StructureExtractor) {
    super(idea, type, extractor.id);
    this.extractorId = extractor.id;
    this.extractoPos = extractor.pos;
    const pf = PathFindWithRoad(this.idea.cortex.getBaseOriginPos(this.idea.roomName), this.extractoPos);
    if (pf.cost > 150) {
      this.withinMinDist = false;
      console.log(`Mineral, ${this.extractorId}, is to far from room, ${this.idea.roomName}, to harvest`);
    }
    this.figments[FigmentThoughtType.MINER] = [];
  }

  public get extractor(): StructureExtractor | null {
    return Game.getObjectById(this.extractorId);
  }

  public get mineral(): Mineral | null {
    if (this.mineralId) {
      return Game.getObjectById(this.mineralId);
    }
    this.mineralId = undefined;
    return null;
  }

  public get container(): StructureContainer | null {
    if (this.containerId) {
      return Game.getObjectById(this.containerId);
    }
    this.containerId = undefined;
    return null;
  }

  public ponder(): void {
    if (!this.containerId) {
      if (this.idea.baseRoomObjects.extractorContainers[this.extractorId]?.length > 0) {
        this.containerId = this.idea.baseRoomObjects.extractorContainers[this.extractorId][0].id;
      }
    }
    if (!this.mineralId) {
      const lookMinerals = this.extractoPos.lookFor(LOOK_MINERALS);
      if (lookMinerals.length) {
        this.mineralId = lookMinerals[0].id;
      }
    }
  }

  public handleFigment(figment: Figment): boolean {
    if (!this.extractor || !this.mineral) {
      figment.addNeuron(NeuronType.MOVE, "", this.extractoPos);
      return true;
    } else if (this.mineral && this.mineral.mineralAmount === 0) {
      if (figment.store.getUsedCapacity(this.mineral.mineralType) > 0) {
        figment.addNeuron(NeuronType.DROP);
      } else if (!figment.pos.inRangeTo(this.extractoPos, 3)) {
        figment.addNeuron(NeuronType.MOVE, "", this.extractoPos);
      }
      return true;
    }

    if (this.container) {
      if (!this.container.pos.isEqualTo(figment.pos)) {
        const figments = this.container.pos.lookFor(LOOK_CREEPS);
        if (figments.length === 0) {
          figment.addNeuron(NeuronType.MOVE, this.container.id, this.container.pos, { moveRange: 0 });
        }
      }
    }

    figment.addNeuron(NeuronType.MINE, this.mineral.id, this.mineral.pos);
    figment.addNeuron(NeuronType.DROP);
    figment.addNeuron(NeuronType.SLEEP, "", undefined, { sleepTicks: 4 });
    return true;
  }

  public figmentNeeded(figmentType: string): boolean {
    if (!this.withinMinDist) {
      return false;
    }

    // TODO: could also calculate TTL and length of path to optimize replacements
    if (this.extractor) {
      return this.figments[figmentType].length < 1;
    }
    return false;
  }
}
