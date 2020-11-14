/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BuildThought, BuildThoughtName } from "thoughts/buildThought";
import { Idea, IdeaType, ThoughtMapping } from "./idea";
import { ContainerThought } from "thoughts/containerThought";
import { ExtensionThought } from "thoughts/extensionThought";
import { Imagination } from "imagination";
import { LinkThought } from "thoughts/linkThought";
import PriorityQueue from "ts-priority-queue";
import { RampartThought } from "thoughts/rampartThought";
import { RoadThought } from "thoughts/roadThought";
import { StorageThought } from "thoughts/storageThought";
import { TowerThought } from "thoughts/towerThought";
import { ValidConstructionSite } from "utils/misc";

export class CreationIdea extends Idea {
  public buildThoughts: { [name: string]: { [instance: string]: BuildThought } } = {};
  private buildQueue: PriorityQueue<BuildQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });
  private constructionSiteQueue: PriorityQueue<ConstructionSite> = new PriorityQueue({
    comparator(a, b) {
      // Higher priority is dequeued first
      return b.progress - a.progress;
    }
  });
  private repairQueue: PriorityQueue<Structure> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.hits - b.hits;
    }
  });
  private repairThreshold = 20000;
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType, idea: Idea) {
    super(spawn, imagination, type, idea);
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
    if (this.constructionSiteQueue.length === 0) {
      for (const room of this.spawn.room.neighborhood) {
        const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
        for (const constructionSite of constructionSites) {
          this.constructionSiteQueue.queue(constructionSite);
        }
      }
    }
    if (this.repairQueue.length === 0) {
      for (const room of this.spawn.room.neighborhood) {
        const structures = room.find(FIND_STRUCTURES);
        for (const s of structures) {
          if (s.hits < this.repairThreshold && s.hits < s.hitsMax) {
            this.repairQueue.queue(s);
          }
        }
      }
    }
    if (this.buildQueue.length === 0) {
      if (this.idea) {
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
    this.imagination.addStatus(`Build Q: ${this.buildQueue.length}`);
    this.imagination.addStatus(`Const Q: ${this.constructionSiteQueue.length}`);
    this.imagination.addStatus(`Repair Q: ${this.repairQueue.length}`);
  }

  public think(): void {
    this.processBuildQueue();
  }

  public canBuild(): boolean {
    if (this.constructionSiteQueue.length) {
      return false;
    }
    return true;
  }

  public getNextConstructionSite(): ConstructionSite | null {
    if (this.constructionSiteQueue.length === 0) {
      return null;
    }
    let target = this.constructionSiteQueue.peek();
    while (target === undefined) {
      this.constructionSiteQueue.dequeue();
      target = this.constructionSiteQueue.peek();
    }
    return target;
  }

  public getNextRepairTarget(): Structure | null {
    if (this.repairQueue.length === 0) {
      return null;
    }
    const target = this.repairQueue.peek();
    if (target.hits === target.hitsMax || target.hits >= this.repairThreshold) {
      this.repairQueue.dequeue();
    }
    return target;
  }

  private processBuildQueue(): void {
    let statusBuild: BuildQueuePayload | null = null;
    if (this.buildQueue.length > 0) {
      let nextBuild = this.buildQueue.peek();
      statusBuild = nextBuild;
      let buildResult: number;
      const room = Game.rooms[nextBuild.pos.roomName];
      if (room && this.canBuild()) {
        buildResult = room.createConstructionSite(nextBuild.pos, nextBuild.structure);
        if (buildResult === OK) {
          nextBuild = this.buildQueue.dequeue();
          this.imagination.addStatus(`Building ${nextBuild.structure} ${nextBuild.pos.toString()}`);
          statusBuild = null;
        } else if (buildResult === ERR_RCL_NOT_ENOUGH) {
          this.buildQueue.dequeue();
        } else {
          console.log(`Build result for ${nextBuild.structure} at ${nextBuild.pos.toString()} is ${buildResult}`);
        }
      } else {
        buildResult = ERR_RCL_NOT_ENOUGH;
      }
      if (statusBuild && buildResult !== ERR_RCL_NOT_ENOUGH) {
        this.imagination.addStatus(`Next Build: ${statusBuild.structure} with priority ${statusBuild.priority}`);
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
    if (validityCheck && !ValidConstructionSite(pos)) {
      return;
    }
    if (showVisual) {
      const rv = new RoomVisual(pos.roomName);
      rv.circle(pos, { radius: 0.4, opacity: 0.2, fill: "#555555" });
      let text = `${priority}`;
      if (structure.length > 2) {
        text = `${structure.substring(0, 1)}:${priority}`;
      }
      rv.text(text, pos);
    }
    this.buildQueue.queue(buildPayload);
  }
}
