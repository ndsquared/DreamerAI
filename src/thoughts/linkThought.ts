import { BuildThought } from "./buildThought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class LinkThought extends BuildThought {
  private links: StructureLink[] = [];
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const spawn = this.idea.spawn;
    if (this.links.length < 1) {
      // Build link at controller
      const controller = spawn.room.controller;
      if (controller && controller.my) {
        const linkPos = controller.pos.availableBuilds();
        creationIdea.addBuilds(linkPos, STRUCTURE_LINK, 2, true, false);
      }
    } else if (this.links.length < 3) {
      // Build links at sources
      const sources = Game.rooms[spawn.pos.roomName].find(FIND_SOURCES);
      for (const source of sources) {
        const linkPos = source.pos.availableBuilds();
        if (linkPos.length > 1) {
          creationIdea.addBuilds(linkPos, STRUCTURE_LINK, 3, true, false);
          continue;
        }
      }
    }
  }

  public ponder(): void {
    const spawn = this.idea.spawn;
    this.links = spawn.room.find(FIND_STRUCTURES, {
      filter: s => {
        if (s.structureType === STRUCTURE_LINK) {
          return true;
        }
        return false;
      }
    }) as StructureLink[];
    super.ponder();
  }

  public think(): void {
    this.runLinks();
  }

  private runLinks(): void {
    const inputLinks: StructureLink[] = [];
    const outputLinks: StructureLink[] = [];
    for (const link of this.links) {
      const findSources = link.pos.findInRange(FIND_SOURCES, 2);
      if (findSources.length) {
        outputLinks.push(link);
      } else {
        inputLinks.push(link);
      }
    }
    for (const outputLink of outputLinks) {
      for (const inputLink of inputLinks) {
        const result = outputLink.transferEnergy(inputLink);
        if (result === OK) {
          break;
        }
      }
    }
  }
}
