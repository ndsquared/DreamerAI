import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { PathFindWithRoad } from "utils/misc";

export class AttackThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [TOUGH, ATTACK, MOVE],
      ratio: [1, 2, 2],
      minParts: 3,
      maxParts: 20
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
    this.figmentPriority = 2;
    for (const room of this.idea.spawn.room.neighborhood) {
      const enemies = room.find(FIND_HOSTILE_CREEPS);
      const enemyStructures = room.find(FIND_HOSTILE_STRUCTURES);
      if (enemies.length || enemyStructures.length) {
        this.figmentsNeeded = 4;
        this.figmentPriority = 15;
        return;
      }
    }
  }
}
