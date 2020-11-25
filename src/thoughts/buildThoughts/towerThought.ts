import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "../thought";
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
    if (this.idea.baseRoomObjects.towers.length >= CONTROLLER_STRUCTURES[STRUCTURE_TOWER][this.idea.rcl]) {
      // console.log("At max towers for RCL");
      return;
    }
    const baseOriginPos = this.idea.cortex.getBaseOriginPos(room.name);
    const pivotPos = this.getNextPivotPosStandard(baseOriginPos, 3);

    if (pivotPos) {
      const towerPositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      creationIdea.addBuilds(towerPositions, STRUCTURE_TOWER, 1, true, false, true);
    }
  }

  public think(): void {
    for (const tower of this.idea.baseRoomObjects.towers) {
      this.runTower(tower);
    }
  }

  private runTower(tower: StructureTower) {
    // TODO: Should towers heal creeps??
    const enemy = _.first(
      _.sortBy(this.idea.baseRoomObjects.towerEnemies, e => PathFindWithRoad(tower.pos, e.pos).cost)
    );
    if (enemy) {
      tower.attack(enemy);
    } else {
      const healTarget = this.idea.cortex.getNextHealTarget(tower.room.name);
      if (healTarget) {
        tower.heal(healTarget);
      } else {
        if (this.idea.cortex.metabolism.inEcoMode(this.idea.roomName)) {
          return;
        }
        const repairTarget = this.idea.cortex.getNextRepairTarget(tower.room.name);
        if (repairTarget) {
          tower.repair(repairTarget);
        }
      }
    }
  }
}
