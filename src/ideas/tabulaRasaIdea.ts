import { BarGraph, Table } from "utils/visuals";
import { Idea, IdeaType } from "./idea";
import { CombatIdea } from "./combatIdea";
import { CreationIdea } from "./creationIdea";
import { GenesisIdea } from "./genesisIdea";
import { Imagination } from "imagination";
import { MetabolicIdea } from "./metabolicIdea";

export class TabulaRasaIdea extends Idea {
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType) {
    super(spawn, imagination, type);

    // Initialize ideas
    this.imagination.ideas[this.name][IdeaType.GENESIS] = new GenesisIdea(spawn, imagination, IdeaType.GENESIS);
    this.imagination.ideas[this.name][IdeaType.CREATION] = new CreationIdea(spawn, imagination, IdeaType.CREATION);
    this.imagination.ideas[this.name][IdeaType.COMBAT] = new CombatIdea(spawn, imagination, IdeaType.COMBAT);
    this.imagination.ideas[this.name][IdeaType.METABOLIC] = new MetabolicIdea(spawn, imagination, IdeaType.METABOLIC);
  }

  public reflect(): void {
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
    if (this.imagination.ideas[this.name][IdeaType.GENESIS]) {
      const count = (this.imagination.ideas[this.name][IdeaType.GENESIS] as GenesisIdea).spawnQueue.length;
      tableData.push(["Spawn", count.toString()]);
    }
    if (this.imagination.ideas[this.name][IdeaType.CREATION]) {
      const count = (this.imagination.ideas[this.name][IdeaType.CREATION] as CreationIdea).buildQueue.length;
      tableData.push(["Build", count.toString()]);
    }
    if (this.imagination.ideas[this.name][IdeaType.CREATION]) {
      const count = (this.imagination.ideas[this.name][IdeaType.CREATION] as CreationIdea).constructionSiteQueue.length;
      tableData.push(["Construct", count.toString()]);
    }
    if (this.imagination.ideas[this.name][IdeaType.CREATION]) {
      const count = (this.imagination.ideas[this.name][IdeaType.CREATION] as CreationIdea).repairQueue.length;
      tableData.push(["Repair", count.toString()]);
    }
    if (this.imagination.ideas[this.name][IdeaType.METABOLIC]) {
      const count = (this.imagination.ideas[this.name][IdeaType.METABOLIC] as MetabolicIdea).inputQueue.length;
      tableData.push(["Input", count.toString()]);
    }
    if (this.imagination.ideas[this.name][IdeaType.METABOLIC]) {
      const count = (this.imagination.ideas[this.name][IdeaType.METABOLIC] as MetabolicIdea).outputQueue.length;
      tableData.push(["Output", count.toString()]);
    }
    if (this.imagination.ideas[this.name][IdeaType.COMBAT]) {
      const count = (this.imagination.ideas[this.name][IdeaType.COMBAT] as CombatIdea).enemyQueue.length;
      tableData.push(["Enemy", count.toString()]);
    }
    if (this.imagination.ideas[this.name][IdeaType.COMBAT]) {
      const count = (this.imagination.ideas[this.name][IdeaType.COMBAT] as CombatIdea).healQueue.length;
      tableData.push(["Heal", count.toString()]);
    }
    const tableQueue = new Table("Queue Counts", tableAnchor, tableData);
    tableQueue.renderTable();
  }
}
