import { BuildThought } from "./buildThought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class LinkThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const spawn = this.idea.spawn;
    if (this.idea.hippocampus.links.length < 1) {
      // Build link at controller
      const controller = spawn.room.controller;
      if (controller && controller.my) {
        if (this.idea.hippocampus.controllerLinks.length === 0) {
          const adjPositions = controller.pos.availableNeighbors(true);
          for (const adjPos of adjPositions) {
            const linkPos = adjPos.availableBuilds(false);
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
          const adjPositions = source.pos.availableNeighbors(true);
          for (const adjPos of adjPositions) {
            const linkPos = adjPos.availableBuilds(false);
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
