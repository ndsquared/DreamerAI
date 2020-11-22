import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { getColor } from "utils/colors";

export class ScoutThought extends FigmentThought {
  public targetRoomName: string | undefined = undefined;
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.SCOUT] = [];
  }

  public ponder(): void {
    if (!this.targetRoomName) {
      this.targetRoomName = this.idea.hippocampus.getNextReconRoomName();
    } else {
      const targetPos = new RoomPosition(25, 25, this.targetRoomName);
      Game.map.visual.circle(targetPos, { fill: getColor("green") });
      Game.map.visual.text(`S`, targetPos);
    }
  }

  public handleFigment(figment: Figment): void {
    if (figment.room.name === this.targetRoomName) {
      const room = Game.rooms[figment.room.name];
      if (room) {
        this.idea.hippocampus.addReconRoomData(room);
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
    // figment.addNeuron(NeuronType.MOVE, "", targetPos, { moveRange: 20 });
  }

  public figmentNeeded(figmentType: string): boolean {
    return this.figments[figmentType].length < 1;
  }
}
