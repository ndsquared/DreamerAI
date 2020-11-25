/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Idea, IdeaType, ThoughtMapping } from "./idea";
import { BuildThought } from "thoughts/buildThoughts/buildThought";
import { BuildThoughtType } from "thoughts/thought";
import { ContainerThought } from "thoughts/buildThoughts/containerThought";
import { ExtensionThought } from "thoughts/buildThoughts/extensionThought";
import { ExtractorThought } from "thoughts/buildThoughts/extractorThought";
import { Imagination } from "imagination";
import { LinkThought } from "thoughts/buildThoughts/linkThought";
import { RampartThought } from "thoughts/buildThoughts/rampartThought";
import { RoadThought } from "thoughts/buildThoughts/roadThought";
import { SpawnThought } from "thoughts/buildThoughts/spawnThought";
import { StorageThought } from "thoughts/buildThoughts/storageThought";
import { TerminalThought } from "thoughts/buildThoughts/terminalThought";
import { TowerThought } from "thoughts/buildThoughts/towerThought";
import { getColor } from "utils/colors";

export class CreationIdea extends Idea {
  public buildThoughts: { [name: string]: { [instance: string]: BuildThought } } = {};
  private rateLimitBuildInterval = 50;
  public constructor(roomName: string, imagination: Imagination, type: IdeaType) {
    super(roomName, imagination, type);
    const buildThoughts: ThoughtMapping[] = [
      { name: BuildThoughtType.EXTENSION, thought: ExtensionThought },
      { name: BuildThoughtType.ROAD, thought: RoadThought },
      { name: BuildThoughtType.CONTAINER, thought: ContainerThought },
      { name: BuildThoughtType.TOWER, thought: TowerThought },
      { name: BuildThoughtType.STORAGE, thought: StorageThought },
      { name: BuildThoughtType.RAMPART, thought: RampartThought },
      { name: BuildThoughtType.LINK, thought: LinkThought },
      { name: BuildThoughtType.TERMINAL, thought: TerminalThought },
      { name: BuildThoughtType.SPAWN, thought: SpawnThought },
      { name: BuildThoughtType.EXTRACTOR, thought: ExtractorThought }
    ];
    for (const buildThought of buildThoughts) {
      this.thoughts[buildThought.name] = {};
      this.thoughts[buildThought.name]["0"] = new buildThought.thought(this, buildThought.name, "0");
    }
  }

  public ponder(): void {
    if (this.cortex.metabolism.buildQueue[this.roomName].length === 0) {
      if (Game.time % this.rateLimitBuildInterval === 0) {
        for (const thoughtName in this.thoughts) {
          for (const thoughtInstance in this.thoughts[thoughtName]) {
            const thought = this.thoughts[thoughtName][thoughtInstance];
            if (thought instanceof BuildThought) {
              // console.log(thought.type);
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
    if (this.cortex.metabolism.constructionSiteQueue[this.roomName].length) {
      return false;
    }
    return true;
  }

  // TODO: need some better handling of build results
  private processBuildQueue(): void {
    if (this.cortex.metabolism.buildQueue[this.roomName].length > 0) {
      let nextBuild = this.cortex.metabolism.buildQueue[this.roomName].peek();
      let buildResult = -1;
      const room = Game.rooms[nextBuild.pos.roomName];
      if (room && this.canBuild()) {
        buildResult = room.createConstructionSite(nextBuild.pos, nextBuild.structure);
        console.log(buildResult);
        if (buildResult === OK) {
          nextBuild = this.cortex.metabolism.buildQueue[this.roomName].dequeue();
        } else if (buildResult === ERR_RCL_NOT_ENOUGH) {
          this.cortex.metabolism.buildQueue[this.roomName].dequeue();
        } else {
          console.log(`Build result for ${nextBuild.structure} at ${nextBuild.pos.toString()} is ${buildResult}`);
          if (buildResult === ERR_INVALID_TARGET) {
            this.cortex.metabolism.buildQueue[this.roomName].dequeue();
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
    this.cortex.metabolism.buildQueue[this.roomName].queue(buildPayload);
  }
}
