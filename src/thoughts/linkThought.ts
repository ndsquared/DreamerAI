import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class LinkThought extends BuildThought {
  private links: StructureLink[] = [];
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(): void {
    const spawn = this.idea.spawn;
    if (this.links.length < 1) {
      // Build link next to spawn
      const linkPositions = this.getPositionsStandard(this.idea.spawn.pos);
      this.idea.addBuilds(linkPositions, STRUCTURE_LINK, 2);
    } else if (this.links.length < 2) {
      // Build link at furthest source
      const sources = _.sortBy(
        Game.rooms[spawn.pos.roomName].find(FIND_SOURCES),
        s => s.pos.findPathTo(spawn.pos, { ignoreCreeps: true }).length
      ).reverse();
      for (const source of sources) {
        const linkPos = source.pos.availableNeighbors(true);
        if (linkPos.length > 1) {
          this.idea.addBuilds(linkPos, STRUCTURE_LINK, 3);
          break;
        }
      }
    } else if (this.links.length < 3) {
      // Build link at controller
      const controller = spawn.room.controller;
      if (controller && controller.my) {
        const linkPos = controller.pos.availableNeighbors(true);
        this.idea.addBuilds(linkPos, STRUCTURE_LINK, 3);
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
