import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "../thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class LinkThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    if (this.idea.roomObjects.links.length >= CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.idea.rcl]) {
      // console.log("At max links for RCL");
      return;
    }
    const room = this.idea.room;
    if (!room) {
      return;
    }
    if (this.idea.roomObjects.links.length < 1) {
      // Build link at controller
      const controller = room.controller;
      if (controller && controller.my) {
        if (this.idea.baseRoomObjects.controllerLinks.length === 0) {
          const adjPositions = controller.pos.availableAdjacentPositions(true);
          for (const adjPos of adjPositions) {
            const linkPos = adjPos.availableAdjacentBuilds(false);
            if (linkPos.length) {
              creationIdea.addBuilds(linkPos, STRUCTURE_LINK, 2, true, false);
              break;
            }
          }
        }
      }
    } else if (this.idea.roomObjects.links.length < 2) {
      // Build links at sources
      for (const source of this.idea.roomObjects.sources) {
        if (this.idea.baseRoomObjects.sourceLinks[source.id].length === 0) {
          const adjPositions = source.pos.availableAdjacentPositions(true);
          for (const adjPos of adjPositions) {
            const linkPos = adjPos.availableAdjacentBuilds(false);
            if (linkPos.length) {
              creationIdea.addBuilds(linkPos, STRUCTURE_LINK, 3, true, false);
              break;
            }
          }
        }
        // TODO: hacky fix to only build a link at 1 source
        break;
      }
    }
  }

  public think(): void {
    for (const outputLink of this.idea.baseRoomObjects.outputLinks) {
      this.runOutputLink(outputLink);
    }
  }

  private runOutputLink(link: StructureLink): void {
    for (const inputLink of this.idea.baseRoomObjects.inputLinks) {
      const result = link.transferEnergy(inputLink);
      if (result === OK) {
        break;
      }
    }
  }
}
