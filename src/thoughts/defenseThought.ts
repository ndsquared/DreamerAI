import { FigmentThought, FigmentType } from "./figmentThought";
import { PathFindWithRoad, RandomRoomPatrolPos } from "utils/misc";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class DefenseThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.DEFENSE] = [];
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
      figment.memory.inCombat = true;
    } else if (healTarget) {
      figment.addNeuron(NeuronType.RANGED_HEAL, healTarget.id, healTarget.pos);
      figment.memory.inCombat = true;
    } else if (structure) {
      figment.addNeuron(NeuronType.RANGED_ATTACK, structure.id, structure.pos);
      figment.memory.inCombat = true;
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
      figment.memory.inCombat = false;
    }
  }

  public figmentNeeded(figmentType: string): boolean {
    const totalParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(RANGED_ATTACK));
    return totalParts < 4;
  }
}
