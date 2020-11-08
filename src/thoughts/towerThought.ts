import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class TowerThought extends BuildThought {
  private towers: StructureTower[];
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.towers = [];
  }

  public buildPlan(): void {
    const pivotPos = this.getNextPivotPosStandard(this.idea.spawn.pos, 3);

    if (pivotPos) {
      const towerPositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      this.idea.addBuilds(towerPositions, STRUCTURE_TOWER, 1, false, false);
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
      const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (closestHostile) {
        tower.attack(closestHostile);
      } else {
        const structuresToRepair = tower.room.find(FIND_STRUCTURES, {
          filter: s => {
            if (s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax) {
              return true;
            }
            return false;
          }
        });
        const structure = _.first(_.sortBy(structuresToRepair, s => PathFindWithRoad(tower.pos, s.pos).cost));
        if (structure) {
          tower.repair(structure);
        }
      }
    }
  }
}
