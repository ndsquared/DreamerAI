import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "./thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { RandomRoomPatrolPos } from "utils/misc";

export class DefenseThought extends FigmentThought {
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.DEFENSE] = [];
  }

  public handleFigment(figment: Figment): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    const enemyTarget = this.idea.hippocampus.getNextEnemyTarget();
    const healTarget = this.idea.hippocampus.getNextHealTarget();
    if (enemyTarget) {
      console.log(`attacking pos ${enemyTarget.pos.toString()} with id ${enemyTarget.id}`);
      figment.addNeuron(NeuronType.RANGED_ATTACK, enemyTarget.id, enemyTarget.pos);
      figment.memory.inCombat = true;
    } else if (healTarget) {
      figment.addNeuron(NeuronType.RANGED_HEAL, healTarget.id, healTarget.pos);
      figment.memory.inCombat = true;
    } else {
      let patrolPos = RandomRoomPatrolPos(room);
      let count = 0;
      while (!patrolPos.isWalkable(true)) {
        if (count > 5) {
          console.log("Getting random room patrol position");
        }
        patrolPos = RandomRoomPatrolPos(room);
        count++;
      }
      figment.addNeuron(NeuronType.MOVE, "", patrolPos);
      figment.memory.inCombat = false;
    }
  }

  public figmentNeeded(figmentType: string): boolean {
    if (this.idea.rcl < 3) {
      return false;
    }
    const totalParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(RANGED_ATTACK));
    return totalParts < 1;
  }
}
