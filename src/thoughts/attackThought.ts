import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { RandomRoomPatrolPos } from "utils/misc";

export class AttackThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.ATTACK] = [];
  }

  public handleFigment(figment: Figment): void {
    const enemyTarget = this.idea.hippocampus.getNextEnemyTarget();
    if (enemyTarget) {
      console.log(`attacking pos ${enemyTarget.pos.toString()} with id ${enemyTarget.id}`);
      figment.addNeuron(NeuronType.ATTACK, enemyTarget.id, enemyTarget.pos);
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

  public figmentNeeded(): boolean {
    if (this.idea.rcl < 3) {
      return false;
    }
    if (this.idea.hippocampus.storage && this.idea.hippocampus.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 10000) {
      return false;
    }
    return false;
  }
}
