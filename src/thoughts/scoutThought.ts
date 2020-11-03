import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class ScoutThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentsNeeded = 1;
    this.figmentBodySpec = {
      bodyParts: [MOVE],
      ratio: [1],
      minParts: 1,
      maxParts: 3
    };
  }

  public handleFigment(figment: Figment): void {
    const mapExits = Game.map.describeExits(figment.room.name);
    for (const roomName of Object.values(mapExits)) {
      if (roomName) {
        const exitDir = figment.room.findExitTo(roomName);
        if (exitDir !== -2 && exitDir !== -10) {
          const exit = figment.pos.findClosestByRange(exitDir) as RoomPosition;
          if (exit) {
            figment.addNeuron(NeuronType.MOVE, "", exit);
            return;
          }
        }
      }
    }
    // const target = this.idea.spawn.room.findExitTo(this.idea.spawn.room.);
  }

  public adjustPriority(): void {
    this.figmentPriority = 1;
  }
}
