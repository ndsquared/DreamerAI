import { PathFindWithRoad, RandomRoomPatrolPos } from "utils/misc";
import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class DefenseThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.combatReady = true;
    this.figmentBodySpec = {
      bodyParts: [TOUGH, RANGED_ATTACK, HEAL],
      ratio: [1, 1, 1],
      minParts: 6,
      maxParts: 30,
      ignoreCarry: false
    };
  }

  public handleFigment(figment: Figment): void {
    let targets: Creep[] = [];
    let structures: Structure[] = [];
    let healTargets: Creep[] = [];
    for (const room of this.idea.spawn.room.neighborhood) {
      const enemies = room.find(FIND_HOSTILE_CREEPS);
      targets = targets.concat(enemies);
      const figments = room.find(FIND_MY_CREEPS, {
        filter: c => {
          return c.hits < c.hitsMax;
        }
      });
      healTargets = healTargets.concat(figments);
      const enemyStructures = room.find(FIND_HOSTILE_STRUCTURES);
      structures = structures.concat(enemyStructures);
    }
    const target = _.first(_.sortBy(targets, c => PathFindWithRoad(figment.pos, c.pos).cost));
    const healTarget = _.first(_.sortBy(healTargets, c => PathFindWithRoad(figment.pos, c.pos).cost));
    const structure = _.first(_.sortBy(structures, c => PathFindWithRoad(figment.pos, c.pos).cost));
    if (target) {
      figment.addNeuron(NeuronType.RANGED_ATTACK, target.id, target.pos);
    } else if (healTarget) {
      figment.addNeuron(NeuronType.RANGED_HEAL, healTarget.id, healTarget.pos);
    } else if (structure) {
      figment.addNeuron(NeuronType.RANGED_ATTACK, structure.id, structure.pos);
    } else {
      let patrolPos = RandomRoomPatrolPos(this.idea.spawn.room);
      let count = 0;
      while (!patrolPos.isWalkable(true)) {
        if (count > 5) {
          console.log("Getting random room patrol position");
        }
        patrolPos = RandomRoomPatrolPos(this.idea.spawn.room);
        count++;
      }
      figment.addNeuron(NeuronType.MOVE, "", patrolPos);
    }
  }

  public adjustPriority(): void {
    if (this.idea.rcl < 3) {
      return;
    }
    this.figmentPriority = 1;
    for (const room of this.idea.spawn.room.neighborhood) {
      const enemies = room.find(FIND_HOSTILE_CREEPS);
      const enemyStructures = room.find(FIND_HOSTILE_STRUCTURES);
      if (enemies.length || enemyStructures.length) {
        this.figmentPriority = 15;
        return;
      }
    }
  }
  public setFigmentsNeeded(): void {
    const totalParts = _.sum(this.figments, f => f.getActiveBodyparts(RANGED_ATTACK));
    if (totalParts >= 4) {
      this.figmentsNeeded = 0;
    } else {
      this.figmentsNeeded = this.figments.length + 1;
    }
  }
}
