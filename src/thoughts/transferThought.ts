import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { PathFindWithRoad } from "utils/misc";

export class TransferThought extends FigmentThought {
  private container: StructureContainer | null = null;
  private storage: StructureStorage | null = null;
  private transferPriority: StructureConstant[] = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER];
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.TRANSFER] = [];
    this.figments[FigmentType.TOWER_FILLER] = [];
  }

  private getNextWithdrawTarget(): StoreStructure | null {
    if (this.storage && this.storage.store.getUsedCapacity() > 0) {
      return this.storage;
    } else if (this.container && this.container.store.getUsedCapacity() > 0) {
      return this.container;
    }

    return null;
  }

  private getNextTransferTarget(figment: Figment): StoreStructure {
    let targets: StoreStructure[] = [];
    for (const structureConstant of this.transferPriority) {
      if (structureConstant === STRUCTURE_EXTENSION) {
        const extensions = _.filter(this.idea.hippocampus.extensions, e => e.hasEnergyCapacity);
        targets = targets.concat(extensions);
      } else if (structureConstant === STRUCTURE_SPAWN) {
        const spawns = _.filter(this.idea.hippocampus.spawns, s => s.hasEnergyCapacity);
        targets = targets.concat(spawns);
      } else if (structureConstant === STRUCTURE_TOWER) {
        const towers = _.filter(this.idea.hippocampus.towers, t => t.energy < 501);
        targets = targets.concat(towers);
      }
      if (targets.length) {
        break;
      }
    }

    return _.first(_.sortBy(targets, t => PathFindWithRoad(figment.pos, t.pos).cost));
  }

  public ponder(): void {
    if (!this.container) {
      if (this.idea.hippocampus.spawnContainers.length) {
        this.container = this.idea.hippocampus.spawnContainers[0];
      }
    } else {
      this.container = Game.getObjectById(this.container.id);
    }
    if (!this.storage) {
      if (this.idea.spawn.room.storage) {
        this.storage = this.idea.spawn.room.storage;
      }
    } else {
      this.storage = Game.getObjectById(this.storage.id);
    }
    super.ponder();
  }

  public handleFigment(figment: Figment): void {
    if (figment.memory.figmentType === FigmentType.TOWER_FILLER) {
      this.transferPriority = [STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_SPAWN];
    }
    if (figment.store.getUsedCapacity() === 0) {
      const target = this.getNextWithdrawTarget();
      if (target) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos, { minCapacity: true });
      } else {
        figment.addNeuron(NeuronType.SLEEP, this.idea.spawn.id, this.idea.spawn.pos, {
          sleepTicks: 10,
          moveOffRoadDuringImpulse: true,
          targetRange: 15
        });
      }
    } else {
      const target = this.getNextTransferTarget(figment);
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public figmentNeeded(figmentType: string): boolean {
    if (!this.storage && !this.container) {
      return false;
    }
    if (figmentType === FigmentType.TRANSFER) {
      if (this.figments[figmentType].length === 1) {
        const ttl = this.figments[figmentType][0].ticksToLive;
        if (ttl && ttl < 200) {
          return true;
        }
      }
      return this.figments[figmentType].length < 1;
    } else if (figmentType === FigmentType.TOWER_FILLER) {
      if (this.idea.hippocampus.towers.length === 0) {
        return false;
      }
      return this.figments[figmentType].length < 1;
    }
    return false;
  }
}
