import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { PathFindWithRoad } from "utils/misc";

export class AttackThought extends FigmentThought {
  private patrolPos: RoomPosition | null = null;
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
      if (!this.patrolPos) {
        let randomPositions: RoomPosition[] = [];
        const controller = this.idea.spawn.room.controller;
        if (controller) {
          randomPositions.push(controller.pos);
        }
        const sources = this.idea.spawn.room.find(FIND_SOURCES);
        const sourcePosiitions = _.map(sources, s => s.pos);
        randomPositions = randomPositions.concat(sourcePosiitions);
        const randomPos = randomPositions[_.random(0, randomPositions.length - 1)];
        this.patrolPos = randomPos;
      } else if (figment.pos.inRangeTo(this.patrolPos, 4)) {
        this.patrolPos = null;
      }
      if (this.patrolPos) {
        figment.travelTo(this.patrolPos);
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
        this.figmentPriority = 15;
        return;
      }
    }
  }
}
