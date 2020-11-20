import { BuildThought } from "./buildThought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class TowerThought extends BuildThought {
  private towers: StructureTower[];
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.towers = [];
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const pivotPos = this.getNextPivotPosStandard(this.idea.spawn.pos, 3);

    if (pivotPos) {
      const towerPositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      creationIdea.addBuilds(towerPositions, STRUCTURE_TOWER, 1, true, false, true);
    }
  }

  public ponder(): void {
    this.towers = this.idea.spawn.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER
    }) as StructureTower[];
    super.ponder();
  }

  public think(): void {
    this.runTowers();
  }

  private runTowers() {
    for (const tower of this.towers) {
      // TODO: Need to make this smarter and not shoot at non-threatening creeps
      // TODO: Should towers heal creeps??
      const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (closestHostile) {
        tower.attack(closestHostile);
      } else {
        const repairTarget = (this.idea as CreationIdea).getNextRepairTarget();
        if (repairTarget) {
          tower.repair(repairTarget);
        }
      }
    }
  }
}
