/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Idea, IdeaType } from "./idea";
import { AttackThought } from "thoughts/attackThought";
import { CombatIdea } from "./combatIdea";
import { CreationIdea } from "./creationIdea";
import { DefenseThought } from "thoughts/defenseThought";
import { FigmentType } from "thoughts/figmentThought";
import { GenesisIdea } from "./genesisIdea";
import { HarvestThought } from "../thoughts/harvestThought";
import { Imagination } from "imagination";
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
}
