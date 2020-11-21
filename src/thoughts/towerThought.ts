import { BuildThought } from "./buildThought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class TowerThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const pivotPos = this.getNextPivotPosStandard(this.idea.spawn.pos, 3);

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
