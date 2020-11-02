import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class ExtensionThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
  }

  public ponder(): void {
    super.ponder();
    if (!this.shouldBuild) {
      return;
    }
    const spawn = this.idea.spawn;
    if (!spawn) {
      return;
    } else if (spawn.room.controller && spawn.room.controller.my && spawn.room.controller?.level < 2) {
      return;
    }

    const roadPositions: RoomPosition[] = [];
    this.addBuild(roadPositions, STRUCTURE_ROAD, 1);
  }
}
