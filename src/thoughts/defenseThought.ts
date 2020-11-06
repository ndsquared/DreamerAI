import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { PathFindWithRoad } from "utils/misc";

export class DefenseThought extends FigmentThought {
  private patrolPos: RoomPosition | null = null;
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
