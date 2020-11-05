import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { PathFindWithRoad } from "utils/misc";

export class DefenseThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [TOUGH, RANGED_ATTACK, HEAL, MOVE],
      ratio: [1, 1, 2, 2],
      minParts: 6,
      maxParts: 20
    };
  }

  public handleFigment(figment: Figment): void {
    let targets: Creep[] = [];
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
    }
    const target = _.first(_.sortBy(targets, c => PathFindWithRoad(figment.pos, c.pos).cost));
    const healTarget = _.first(_.sortBy(healTargets, c => PathFindWithRoad(figment.pos, c.pos).cost));
    if (target) {
      figment.addNeuron(NeuronType.RANGED_ATTACK, target.id, target.pos);
    } else if (healTarget) {
      figment.addNeuron(NeuronType.RANGED_HEAL, healTarget.id, healTarget.pos);
    } else {
      const controllers: StructureController[] = [];
      for (const room of this.idea.spawn.room.neighborhood) {
        const controller = room.controller;
        if (controller) {
          controllers.push(controller);
        }
      }
      if (controllers.length > 1) {
        const randomController = controllers[_.random(0, controllers.length - 1)];
        figment.addNeuron(NeuronType.MOVE, "", randomController.pos, { moveRange: 5 });
      } else {
        const randomDir = _.random(1, 8);
        figment.move(randomDir as DirectionConstant);
      }
    }
  }

  public adjustPriority(): void {
    this.figmentsNeeded = 1;
    this.figmentPriority = 3;
    for (const room of this.idea.spawn.room.neighborhood) {
      const enemies = room.find(FIND_HOSTILE_CREEPS);
      if (enemies.length) {
        this.figmentsNeeded = 4;
        this.figmentPriority = 14;
        return;
      }
    }
  }
}
