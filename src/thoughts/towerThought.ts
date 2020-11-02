import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class TowerThought extends BuildThought {
  private towers: StructureTower[];
  public constructor(idea: Idea, name: string, instance: number) {
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

    // const pivotPos = this.getNextPivotPos(this.idea.spawn.pos, towerDeltas);

    // const towerPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, towerDeltas);

    // this.idea.addBuild(towerPositions, STRUCTURE_TOWER, 1);

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
      }
    }
  }
}
