import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "../thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class ExtractorThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    if (this.idea.baseRoomObjects.extractors.length >= CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][this.idea.rcl]) {
      return;
    }
    const mineralPositions = _.map(this.idea.baseRoomObjects.minerals, m => m.pos);
    creationIdea.addBuilds(mineralPositions, STRUCTURE_EXTRACTOR, 5, true, false);
  }
}
