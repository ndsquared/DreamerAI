import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class TowerThought extends BuildThought {
  private towers: StructureTower[];
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.towers = [];
  }

  public ponder(): void {
    const towerDeltas: Coord[] = [];
    towerDeltas.push({ x: 0, y: 0 });
    towerDeltas.push({ x: 1, y: 1 });
    towerDeltas.push({ x: 1, y: -1 });
    towerDeltas.push({ x: -1, y: -1 });
    towerDeltas.push({ x: -1, y: 1 });

    const pivotPos = this.getNextPivotPos(this.idea.spawn.pos, towerDeltas);

    if (pivotPos) {
      const towerPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, towerDeltas);
      this.idea.addBuild(towerPositions, STRUCTURE_TOWER, 1);
    }

    this.towers = this.idea.spawn.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER
    }) as StructureTower[];
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
