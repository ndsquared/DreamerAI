import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "./thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class TowerThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    if (this.idea.hippocampus.towers.length >= CONTROLLER_STRUCTURES[STRUCTURE_TOWER][this.idea.rcl]) {
      // console.log("At max towers for RCL");
      return;
    }
    const baseOriginPos = this.idea.hippocampus.getBaseOriginPos(room.name);
    const pivotPos = this.getNextPivotPosStandard(baseOriginPos, 3);

    if (pivotPos) {
      const towerPositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      creationIdea.addBuilds(towerPositions, STRUCTURE_TOWER, 1, true, false, true);
    }
  }

  public think(): void {
    for (const tower of this.idea.hippocampus.towers) {
      this.runTower(tower);
    }
  }

  private runTower(tower: StructureTower) {
    // TODO: Should towers heal creeps??
    const enemy = _.first(_.sortBy(this.idea.hippocampus.towerEnemies, e => PathFindWithRoad(tower.pos, e.pos).cost));
    if (enemy) {
      tower.attack(enemy);
    } else {
      const healTarget = this.idea.hippocampus.getNextHealTarget();
      if (healTarget) {
        tower.heal(healTarget);
      } else {
        if (this.idea.hippocampus.inEcoMode()) {
          return;
        }
        const repairTarget = this.idea.hippocampus.getNextRepairTarget();
        if (repairTarget) {
          tower.repair(repairTarget);
        }
      }
    }
  }
}
