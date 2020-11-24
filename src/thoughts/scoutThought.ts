import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "./thought";
import { Idea } from "ideas/idea";
import { getColor } from "utils/colors";

export class ScoutThought extends FigmentThought {
  public targetRoomName: string | undefined = undefined;
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.SCOUT] = [];
  }

  public ponder(): void {
    if (!this.targetRoomName) {
      this.targetRoomName = this.idea.cortex.getNextReconRoomName();
    } else {
      const targetPos = new RoomPosition(25, 25, this.targetRoomName);
      Game.map.visual.circle(targetPos, { fill: getColor("green") });
      Game.map.visual.text(`S`, targetPos);
    }
  }

  // Figment is handled every turn
  public handleFigment(figment: Figment): void {
    if (figment.room.name === this.targetRoomName) {
      const room = Game.rooms[figment.room.name];
      if (room) {
        this.idea.cortex.addReconRoomData(room);
      } else {
        console.log(`scout ${figment.name} unable to add recon data for ${figment.room.name}`);
      }
      this.targetRoomName = undefined;
    }
    if (!this.targetRoomName) {
      return;
    }
    const targetPos = new RoomPosition(25, 25, this.targetRoomName);
    figment.travelTo(targetPos);
  }

  public figmentNeeded(figmentType: string): boolean {
    if (!this.targetRoomName) {
      return false;
    }
    return this.figments[figmentType].length < 1;
  }
}
