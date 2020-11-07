import { PathFindWithRoad, RandomRoomPatrolPos } from "utils/misc";
import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class AttackThought extends FigmentThought {
  private patrolPos: RoomPosition | null = null;
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [TOUGH, ATTACK],
      ratio: [1, 1],
      minParts: 4,
      maxParts: 30,
      ignoreCarry: false
    };
  }

  public handleFigment(figment: Figment): void {
    let targets: Creep[] = [];
    let structures: Structure[] = [];
    for (const room of this.idea.spawn.room.neighborhood) {
      const enemies = room.find(FIND_HOSTILE_CREEPS);
      targets = targets.concat(enemies);
      const enemyStructures = room.find(FIND_HOSTILE_STRUCTURES);
      structures = structures.concat(enemyStructures);
    }
    const target = _.first(_.sortBy(targets, c => PathFindWithRoad(figment.pos, c.pos).cost));
    const structure = _.first(_.sortBy(structures, c => PathFindWithRoad(figment.pos, c.pos).cost));
    if (target) {
      figment.addNeuron(NeuronType.ATTACK, target.id, target.pos);
    } else if (structure) {
      figment.addNeuron(NeuronType.ATTACK, structure.id, structure.pos);
    } else {
      if (!this.patrolPos) {
        this.patrolPos = RandomRoomPatrolPos(this.idea.spawn.room);
        let count = 0;
        while (!this.patrolPos.isWalkable(true)) {
          if (count > 5) {
            console.log("Getting random room patrol position");
          }
          this.patrolPos = RandomRoomPatrolPos(this.idea.spawn.room);
          count++;
        }
      } else if (figment.pos.inRangeTo(this.patrolPos, 2)) {
        this.patrolPos = null;
      }
      if (this.patrolPos) {
        // console.log(this.patrolPos.toString());
        const result = figment.travelTo(this.patrolPos, { ignoreRoads: true });
        if (result !== OK && result !== ERR_TIRED) {
          this.patrolPos = null;
        }
      }
    }
  }

  public adjustPriority(): void {
    if (this.idea.rcl < 3) {
      return;
    }
    this.figmentsNeeded = 1;
    this.figmentPriority = 2;
    for (const room of this.idea.spawn.room.neighborhood) {
      const enemies = room.find(FIND_HOSTILE_CREEPS);
      const enemyStructures = room.find(FIND_HOSTILE_STRUCTURES);
      if (enemies.length || enemyStructures.length) {
        this.figmentsNeeded = 4;
        this.figmentPriority = 14;
        return;
      }
    }
  }
}
