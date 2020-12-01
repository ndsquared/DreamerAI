import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "../thought";
import { Idea } from "ideas/idea";
import { getColor } from "utils/colors";
import { getReconRoomData } from "utils/misc";

export class ScoutThought extends FigmentThought {
  public targetRoomName: string | undefined = undefined;
  public targetRoomInitialTick: number;
  public stuckScout: { [name: string]: number };
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.SCOUT] = [];
    this.stuckScout = {};
    this.targetRoomInitialTick = Game.time;
  }

  public ponder(): void {
    if (!this.targetRoomName) {
      this.targetRoomName = this.idea.cortex.getNextReconRoomName();
      this.targetRoomInitialTick = Game.time;
    } else {
      const targetPos = new RoomPosition(25, 25, this.targetRoomName);
      Game.map.visual.circle(targetPos, { fill: getColor("green") });
      Game.map.visual.text(`S`, targetPos);
    }
  }

  // TODO: need better checking for reachability
  // Figment is handled every turn
  public handleFigment(figment: Figment): boolean {
    if (!this.stuckScout[figment.name]) {
      this.stuckScout[figment.name] = 0;
    }
    if (figment.room.name === this.targetRoomName) {
      const room = Game.rooms[figment.room.name];
      if (room) {
        this.idea.cortex.addReconRoomData(room);
      } else {
        console.log(`scout ${figment.name} unable to add recon data for ${figment.room.name}`);
      }
      this.targetRoomName = undefined;
    } else if (this.stuckScout[figment.name] > 10) {
      this.stuckScout[figment.name] = 0;
      // TODO: should probably handle this edge case a bit smarter
      if (this.targetRoomName) {
        console.log(`scout ${figment.name} unable to reach ${this.targetRoomName}`);
        this.idea.cortex.memory.rooms[this.targetRoomName] = getReconRoomData(this.targetRoomName);
      }
      this.targetRoomName = undefined;
    } else if (Game.time - this.targetRoomInitialTick > 1500) {
      if (this.targetRoomName) {
        console.log(`scout ${figment.name} unable to reach ${this.targetRoomName} in less than 1500 ticks`);
      }
      this.targetRoomName = undefined;
    }
    if (!this.targetRoomName) {
      return false;
    }
    const targetPos = new RoomPosition(25, 25, this.targetRoomName);
    const result = figment.travelTo(targetPos);
    if (result === ERR_NO_PATH) {
      this.stuckScout[figment.name]++;
    }
    return true;
  }

  public figmentNeeded(figmentType: string): boolean {
    if (!this.targetRoomName) {
      return false;
    }
    return this.figments[figmentType].length < 1;
  }
}
