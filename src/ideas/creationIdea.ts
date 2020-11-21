/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BuildThought, BuildThoughtName } from "thoughts/buildThought";
import { Idea, IdeaType, ThoughtMapping } from "./idea";
import { ContainerThought } from "thoughts/containerThought";
import { ExtensionThought } from "thoughts/extensionThought";
import { Imagination } from "imagination";
import { LinkThought } from "thoughts/linkThought";
import { RampartThought } from "thoughts/rampartThought";
import { RoadThought } from "thoughts/roadThought";
import { StorageThought } from "thoughts/storageThought";
import { TowerThought } from "thoughts/towerThought";
import { getColor } from "utils/colors";

export class CreationIdea extends Idea {
  public buildThoughts: { [name: string]: { [instance: string]: BuildThought } } = {};
  private rateLimitBuildPlanning = true;
  private rateLimitBuildInterval = 50;
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType) {
    super(spawn, imagination, type);
    const buildThoughts: ThoughtMapping[] = [
      { name: BuildThoughtName.EXTENSION, thought: ExtensionThought },
      { name: BuildThoughtName.ROAD, thought: RoadThought },
      { name: BuildThoughtName.CONTAINER, thought: ContainerThought },
      { name: BuildThoughtName.TOWER, thought: TowerThought },
      { name: BuildThoughtName.STORAGE, thought: StorageThought },
      { name: BuildThoughtName.RAMPART, thought: RampartThought },
      { name: BuildThoughtName.LINK, thought: LinkThought }
    ];
    for (const buildThought of buildThoughts) {
      this.thoughts[buildThought.name] = {};
      this.thoughts[buildThought.name]["0"] = new buildThought.thought(this, buildThought.name, "0");
    }
  }

  public ponder(): void {
    if (this.hippocampus.buildQueue.length === 0) {
      if (this.rateLimitBuildPlanning && Game.time % this.rateLimitBuildInterval === 0) {
        this.rateLimitBuildPlanning = false;
        for (const thoughtName in this.thoughts) {
          for (const thoughtInstance in this.thoughts[thoughtName]) {
            const thought = this.thoughts[thoughtName][thoughtInstance];
            if (thought instanceof BuildThought) {
              thought.buildPlan(this);
            }
          }
        }
      }
    }
    this.processBuildQueue();
    super.ponder();
  }

  public think(): void {
    super.think();
  }

  public reflect(): void {
    super.reflect();
  }

  public canBuild(): boolean {
    if (this.hippocampus.constructionSiteQueue.length) {
      return false;
    }
    return true;
  }

  // TODO: need some better handling of build results
  private processBuildQueue(): void {
    if (this.hippocampus.buildQueue.length > 0) {
      this.rateLimitBuildPlanning = true;
      let nextBuild = this.hippocampus.buildQueue.peek();
      let buildResult: number;
      const room = Game.rooms[nextBuild.pos.roomName];
      if (room && this.canBuild()) {
        buildResult = room.createConstructionSite(nextBuild.pos, nextBuild.structure);
        if (buildResult === OK) {
          nextBuild = this.hippocampus.buildQueue.dequeue();
        } else if (buildResult === ERR_RCL_NOT_ENOUGH) {
          this.hippocampus.buildQueue.dequeue();
        } else {
          console.log(`Build result for ${nextBuild.structure} at ${nextBuild.pos.toString()} is ${buildResult}`);
          if (buildResult === ERR_INVALID_TARGET) {
            this.hippocampus.buildQueue.dequeue();
          }
        }
      }
    }
  }

  public addBuilds(
    positions: RoomPosition[],
    structure: StructureConstant,
    priority: number,
    firstAcceptable: boolean,
    showVisual: boolean,
    validityCheck = false
  ): void {
    for (const pos of positions) {
      this.addBuild(pos, structure, priority, showVisual, validityCheck);
      if (firstAcceptable) {
        break;
      }
    }
  }

  public addBuild(
    pos: RoomPosition,
    structure: StructureConstant,
    priority: number,
    showVisual: boolean,
    validityCheck = false
  ): void {
    const buildPayload = {
      pos,
      structure,
      priority
    };
    if (validityCheck && !pos.isBuildable()) {
      return;
    }
    if (pos.hasStructure(structure)) {
      return;
    }
    if (showVisual) {
      const rv = new RoomVisual(pos.roomName);
      rv.circle(pos, { radius: 0.4, opacity: 0.2, fill: getColor("grey") });
      let text = `${priority}`;
      if (structure.length > 2) {
        text = `${structure.substring(0, 1)}:${priority}`;
      }
      rv.text(text, pos);
    }
    this.hippocampus.buildQueue.queue(buildPayload);
  }
}
