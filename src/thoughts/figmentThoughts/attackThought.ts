import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "../thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { RandomRoomPatrolPos } from "utils/misc";

export class AttackThought extends FigmentThought {
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.ATTACK] = [];
  }

  public handleFigment(figment: Figment): boolean {
    const room = this.idea.room;
    if (!room) {
      return false;
    }
    const enemyTarget = this.idea.cortex.getNextEnemyTarget(room.name);
    if (enemyTarget) {
      console.log(`attacking pos ${enemyTarget.pos.toString()} with id ${enemyTarget.id}`);
      figment.addNeuron(NeuronType.ATTACK, enemyTarget.id, enemyTarget.pos);
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
    return true;
  }

  public figmentNeeded(): boolean {
    if (this.idea.rcl < 3) {
      return false;
    }
    return false;
  }
}
