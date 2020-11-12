import { FigmentThought, FigmentType } from "./figmentThought";
import { PathFindWithRoad, isStoreStructure } from "utils/misc";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class WorkerThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.WORKER] = [];
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() > 0) {
      const repairTarget = figment.getNextRepairTargetNeighborhood({ originRoom: this.idea.spawn.room });
      const buildTarget = figment.getNextBuildTargetNeighborhood({ originRoom: this.idea.spawn.room });
      const controller = this.idea.spawn.room.controller;
      if (
        repairTarget &&
        buildTarget &&
        PathFindWithRoad(figment.pos, repairTarget.pos).cost < PathFindWithRoad(figment.pos, buildTarget.pos).cost
      ) {
        figment.addNeuron(NeuronType.REPAIR, repairTarget.id, repairTarget.pos);
      } else if (buildTarget) {
        figment.addNeuron(NeuronType.BUILD, buildTarget.id, buildTarget.pos);
      } else if (repairTarget) {
        figment.addNeuron(NeuronType.REPAIR, repairTarget.id, repairTarget.pos);
      } else if (controller && controller.my) {
        figment.addNeuron(NeuronType.UPGRADE, controller.id, controller.pos);
      }
    } else {
      const containers = this.idea.spawn.room.find(FIND_STRUCTURES, {
        filter: s => {
          if (s.structureType === STRUCTURE_CONTAINER) {
            return true;
          }
          return false;
        }
      });
      let useSpawn = true;
      if (containers.length) {
        useSpawn = false;
      }
      const target = figment.getNextPickupOrWithdrawTargetNeighborhood({
        useStorage: true,
        useSpawn,
        originRoom: this.idea.spawn.room,
        avoidControllerContainer: false,
        avoidSpawnContainer: false
      });
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    }
  }

  public figmentNeeded(figmentType: FigmentType): boolean {
    const totalParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(WORK));
    return totalParts < 4;
  }
}
