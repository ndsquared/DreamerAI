import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "./thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class LinkThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    if (this.idea.hippocampus.links.length >= CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.idea.rcl]) {
      // console.log("At max links for RCL");
      return;
    }
    const room = this.idea.room;
    if (!room) {
      return;
    }
    if (this.idea.hippocampus.links.length < 1) {
      // Build link at controller
      const controller = room.controller;
      if (controller && controller.my) {
        if (this.idea.hippocampus.controllerLinks.length === 0) {
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
    } else if (this.idea.hippocampus.links.length < 3) {
      // Build links at sources
      // TODO: Optimize so this only called on sources in spawn room
      for (const source of this.idea.hippocampus.sources) {
        if (this.idea.hippocampus.sourceLinks[source.id].length === 0) {
          const adjPositions = source.pos.availableAdjacentPositions(true);
          for (const adjPos of adjPositions) {
            const linkPos = adjPos.availableAdjacentBuilds(false);
            if (linkPos.length) {
              creationIdea.addBuilds(linkPos, STRUCTURE_LINK, 3, true, false);
              break;
            }
          }
        }
      }
    }
  }

  public think(): void {
    for (const outputLink of this.idea.hippocampus.outputLinks) {
      this.runOutputLink(outputLink);
    }
  }

  private runOutputLink(link: StructureLink): void {
    for (const inputLink of this.idea.hippocampus.inputLinks) {
      const result = link.transferEnergy(inputLink);
      if (result === OK) {
        break;
      }
    }
  }
}
