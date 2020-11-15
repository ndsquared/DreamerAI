/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BarGraph, Table } from "utils/visuals";
import { Idea, IdeaType } from "./idea";
import { AttackThought } from "thoughts/attackThought";
import { CombatIdea } from "./combatIdea";
import { CreationIdea } from "./creationIdea";
import { DefenseThought } from "thoughts/defenseThought";
import { FigmentType } from "thoughts/figmentThought";
import { GenesisIdea } from "./genesisIdea";
import { HarvestThought } from "../thoughts/harvestThought";
import { Imagination } from "imagination";
import { MetabolicIdea } from "./metabolicIdea";
import { PickupThought } from "thoughts/pickupThought";
import { ReserveThought } from "thoughts/reserveThought";
import { ScoutThought } from "thoughts/scoutThought";
import { TransferThought } from "thoughts/transferThought";
import { UpgradeThought } from "thoughts/upgradeThought";
import { WorkerThought } from "thoughts/workerThought";

interface ThoughtMapping {
  name: string;
  thought: any;
}

export class TabulaRasaIdea extends Idea {
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType, idea: Idea | null) {
    super(spawn, imagination, type, idea);
    const sources = _.sortBy(
      Game.rooms[spawn.pos.roomName].find(FIND_SOURCES),
      s => s.pos.findPathTo(spawn.pos, { ignoreCreeps: true }).length
    );

    // Initialize ideas
    this.ideas[IdeaType.GENESIS] = new GenesisIdea(spawn, imagination, IdeaType.GENESIS, this);
    this.ideas[IdeaType.CREATION] = new CreationIdea(spawn, imagination, IdeaType.CREATION, this);
    this.ideas[IdeaType.COMBAT] = new CombatIdea(spawn, imagination, IdeaType.COMBAT, this);
    this.ideas[IdeaType.METABOLIC] = new MetabolicIdea(spawn, imagination, IdeaType.METABOLIC, this);

    // Initialize thoughts
    this.thoughts[FigmentType.HARVEST] = {};
    this.thoughts[FigmentType.SCOUT] = {};
    this.thoughts[FigmentType.RESERVE] = {};

    for (const source of sources) {
      this.thoughts[FigmentType.HARVEST][source.id] = new HarvestThought(this, FigmentType.HARVEST, source);
    }

    const figmentThoughts: ThoughtMapping[] = [
      { name: FigmentType.TRANSFER, thought: TransferThought },
      { name: FigmentType.PICKUP, thought: PickupThought },
      { name: FigmentType.WORKER, thought: WorkerThought },
      { name: FigmentType.UPGRADE, thought: UpgradeThought },
      { name: FigmentType.ATTACK, thought: AttackThought },
      { name: FigmentType.DEFENSE, thought: DefenseThought }
    ];
    for (const figmentThought of figmentThoughts) {
      this.thoughts[figmentThought.name] = {};
      this.thoughts[figmentThought.name]["0"] = new figmentThought.thought(this, figmentThought.name, "0");
    }
  }

  public ponder(): void {
    for (const roomName of this.spawn.room.neighborNames) {
      const room = Game.rooms[roomName];
      if (room) {
        const sources = _.sortBy(room.find(FIND_SOURCES));
        for (const source of sources) {
          if (!this.thoughts[FigmentType.HARVEST][source.id]) {
            this.thoughts[FigmentType.HARVEST][source.id] = new HarvestThought(this, FigmentType.HARVEST, source);
          }
        }
        if (!this.thoughts[FigmentType.RESERVE][room.name]) {
          this.thoughts[FigmentType.RESERVE][room.name] = new ReserveThought(this, FigmentType.RESERVE, room.name);
        }
      }
      if (!this.thoughts[FigmentType.SCOUT][roomName]) {
        this.thoughts[FigmentType.SCOUT][roomName] = new ScoutThought(this, FigmentType.SCOUT, roomName);
      }
    }
    super.ponder();
  }

  public reflect(): void {
    super.reflect();
    this.contemplate();
  }

  private contemplate(): void {
    if (!this.showStats) {
      return;
    }
    // General Stats
    const data: BarGraphData[] = [];
    const controller = this.spawn.room.controller;
    if (controller) {
      data.push({
        label: `RCL ${this.rcl}`,
        current: controller.progress,
        max: controller.progressTotal
      });
    }
    data.push({
      label: `GCL ${Game.gcl.level}`,
      current: Game.gcl.progress,
      max: Game.gcl.progressTotal
    });
    data.push({
      label: `Bucket`,
      current: Game.cpu.bucket,
      max: 10000
    });
    const anchor = new RoomPosition(1, 1, this.spawn.room.name);
    const barGraph = new BarGraph("General Stats", anchor, data);
    barGraph.renderGraph();

    // Queues
    const tableAnchor = new RoomPosition(12, 1, this.spawn.room.name);
    const tableData: string[][] = [["Queue", "Count"]];
    if (this.ideas[IdeaType.GENESIS]) {
      const count = (this.ideas[IdeaType.GENESIS] as GenesisIdea).spawnQueue.length;
      tableData.push(["Spawn", count.toString()]);
    }
    if (this.ideas[IdeaType.CREATION]) {
      const count = (this.ideas[IdeaType.CREATION] as CreationIdea).buildQueue.length;
      tableData.push(["Build", count.toString()]);
    }
    if (this.ideas[IdeaType.CREATION]) {
      const count = (this.ideas[IdeaType.CREATION] as CreationIdea).constructionSiteQueue.length;
      tableData.push(["Construct", count.toString()]);
    }
    if (this.ideas[IdeaType.CREATION]) {
      const count = (this.ideas[IdeaType.CREATION] as CreationIdea).repairQueue.length;
      tableData.push(["Repair", count.toString()]);
    }
    if (this.ideas[IdeaType.METABOLIC]) {
      const count = (this.ideas[IdeaType.METABOLIC] as MetabolicIdea).inputQueue.length;
      tableData.push(["Input", count.toString()]);
    }
    if (this.ideas[IdeaType.METABOLIC]) {
      const count = (this.ideas[IdeaType.METABOLIC] as MetabolicIdea).outputQueue.length;
      tableData.push(["Output", count.toString()]);
    }
    const tableQueue = new Table("Queue Counts", tableAnchor, tableData);
    tableQueue.renderTable();
  }
}
