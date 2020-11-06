import { PathFindWithRoad, isStoreStructure } from "utils/misc";
import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class WorkerThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [WORK, CARRY, MOVE],
      ratio: [1, 1, 1],
      minParts: 4,
      maxParts: 15
    };
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
      const containers = figment.room.find(FIND_STRUCTURES, {
        filter: s => {
          if (s.structureType === STRUCTURE_CONTAINER) {
            return true;
          }
          return false;
        }
      });
      let useSpawn = false;
      if (containers.length < 2) {
        useSpawn = true;
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

  public adjustPriority(): void {
    this.figmentPriority = 2;
    this.figmentsNeeded = 2;
    for (const room of this.idea.spawn.room.neighborhood) {
      const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
      if (constructionSites.length) {
        this.figmentsNeeded = 10;
        this.figmentPriority = 3;
        return;
      }
    }
  }
}
