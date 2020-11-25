import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "./thought";
import { Idea } from "ideas/idea";
import { getColor } from "utils/colors";

export class PatrolThought extends FigmentThought {
  public targetRoomName: string | undefined = undefined;
  public currentIndex = 0;
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.PATROL] = [];
  }

  public ponder(): void {
    if (!this.targetRoomName) {
      const neighborhoodRoomNames = this.idea.cortex.getNeighborhoodRoomNames(this.idea.roomName);
      if (this.currentIndex < neighborhoodRoomNames.length) {
        this.targetRoomName = neighborhoodRoomNames[this.currentIndex];
        this.currentIndex++;
      } else {
        this.currentIndex = 0;
        this.targetRoomName = neighborhoodRoomNames[this.currentIndex];
      }
    } else {
      const targetPos = new RoomPosition(25, 25, this.targetRoomName);
      Game.map.visual.circle(targetPos, { fill: getColor("teal") });
      Game.map.visual.text(`P`, targetPos);
    }
  }

  // Figment is handled every turn
  public handleFigment(figment: Figment): boolean {
    if (figment.room.name === this.targetRoomName) {
      this.targetRoomName = undefined;
    }
    if (!this.targetRoomName) {
      return false;
    }
    const targetPos = new RoomPosition(25, 25, this.targetRoomName);
    figment.travelTo(targetPos);
    console.log("patrol is being handled");
    return true;
  }

  public figmentNeeded(figmentType: string): boolean {
    if (!this.targetRoomName) {
      return false;
    }
    return this.figments[figmentType].length < 1;
  }
}
