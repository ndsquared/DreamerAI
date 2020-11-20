import { FigmentThought, FigmentType } from "./figmentThought";
import { Idea, IdeaType } from "ideas/idea";
import { CombatIdea } from "ideas/combatIdea";
import { Figment } from "figments/figment";
import { NeuronType } from "neurons/neurons";
import { RandomRoomPatrolPos } from "utils/misc";

export class AttackThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.ATTACK] = [];
  }

  public handleFigment(figment: Figment): void {
    const enemyTarget = (this.idea.imagination.ideas[this.idea.name][
      IdeaType.COMBAT
    ] as CombatIdea).getNextEnemyTarget();
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
    return false;
  }
}
