import { FigmentThought, FigmentType } from "./figmentThought";
import { Idea, IdeaType } from "ideas/idea";
import { CombatIdea } from "ideas/combatIdea";
import { Figment } from "figments/figment";
import { NeuronType } from "neurons/neurons";
import { RandomRoomPatrolPos } from "utils/misc";

export class DefenseThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.DEFENSE] = [];
  }

  public handleFigment(figment: Figment): void {
    const enemyTarget = (this.idea.ideas[IdeaType.COMBAT] as CombatIdea).getNextEnemyTarget();
    const healTarget = (this.idea.ideas[IdeaType.COMBAT] as CombatIdea).getNextHealTarget();
    if (enemyTarget) {
      figment.addNeuron(NeuronType.RANGED_ATTACK, enemyTarget.id, enemyTarget.pos);
      figment.memory.inCombat = true;
    } else if (healTarget) {
      figment.addNeuron(NeuronType.RANGED_HEAL, healTarget.id, healTarget.pos);
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
    if (this.idea.rcl < 3) {
      return false;
    }
    const totalParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(RANGED_ATTACK));
    return totalParts < 1;
  }
}
