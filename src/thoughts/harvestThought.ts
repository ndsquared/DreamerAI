import { FigmentThought, FigmentThoughtName } from "./figmentThought";
import { Figment } from "figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class HarvestThought extends FigmentThought {
  private source: Source | null;
  private sourceId: Id<Source>;
  private sourcePos: RoomPosition;
  public constructor(idea: Idea, name: string, source: Source) {
    super(idea, name, source.id);
    this.source = source;
    this.sourceId = source.id;
    this.sourcePos = source.pos;
    this.figmentBodySpec = {
      bodyParts: [CARRY, WORK],
      ratio: [1, 5],
      minParts: 4,
      maxParts: 11,
      ignoreCarry: true
    };
  }

  public handleFigment(figment: Figment): void {
    if (!this.source) {
      figment.addNeuron(NeuronType.MOVE, "", this.sourcePos);
      return;
    } else if (this.source.energy === 0) {
      if (figment.store.getUsedCapacity() > 0) {
        figment.addNeuron(NeuronType.DROP);
      } else if (!figment.pos.inRangeTo(this.sourcePos, 3)) {
        figment.addNeuron(NeuronType.MOVE, "", this.sourcePos);
      }
      return;
    }

    const containers = this.source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    let constructionSites: ConstructionSite[] | null = null;

    let shouldDropHarvest = false;
    let shouldRepairContainer = false;
    let shouldBuildContainer = false;
    if (containers.length > 0) {
      const container = containers[0];
      if (container.hits < container.hitsMax) {
        shouldRepairContainer = true;
      }
      if (containers[0].pos.isEqualTo(figment.pos)) {
        shouldDropHarvest = true;
      } else {
        const figments = containers[0].pos.lookFor(LOOK_CREEPS);
        if (figments.length === 0) {
          figment.addNeuron(NeuronType.MOVE, containers[0].id, containers[0].pos, { moveRange: 0 });
          return;
        } else {
          shouldDropHarvest = true;
        }
      }
    } else {
      constructionSites = this.source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      });
      if (this.name === FigmentThoughtName.REMOTE_HARVEST) {
        if (constructionSites.length) {
          shouldBuildContainer = true;
        } else {
          const buildPositions = this.source.pos.availableNeighbors(true);
          if (buildPositions.length) {
            const buildPos = buildPositions[0];
            const result = this.source.room.createConstructionSite(buildPos, STRUCTURE_CONTAINER);
            if (result !== OK) {
              console.log(`${figment.name} unable to create container at ${buildPos.toString()}`);
            }
          }
        }
      } else if (this.name === FigmentThoughtName.HARVEST) {
        shouldDropHarvest = this.idea.getFigmentCount(FigmentThoughtName.TRANSFER) > 0;
      }
    }

    let targetOptions = null;
    let useLink = false;
    const links = this.source.pos.findInRange(FIND_STRUCTURES, 2, {
      filter: s => s.structureType === STRUCTURE_LINK
    });
    if (links.length) {
      useLink = true;
    }
    if (shouldDropHarvest && !useLink && !shouldRepairContainer && !shouldBuildContainer) {
      targetOptions = {
        ignoreFigmentCapacity: true
      };
    }
    if (figment.store.getUsedCapacity() === 0) {
      figment.addNeuron(NeuronType.HARVEST, this.source.id, this.source.pos, targetOptions);
    } else if (shouldRepairContainer) {
      const container = containers[0];
      figment.addNeuron(NeuronType.REPAIR, container.id, container.pos);
    } else if (shouldBuildContainer) {
      if (constructionSites && constructionSites.length) {
        const constructionSite = constructionSites[0];
        figment.addNeuron(NeuronType.BUILD, constructionSite.id, constructionSite.pos);
      } else {
        console.log(`unable to find constuction site near ${this.sourcePos.toString()}`);
      }
    } else {
      const target = figment.getNextTransferTargetNeighborhood({ useLink, originRoom: this.idea.spawn.room });
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    const count = this.idea.getFigmentCount(FigmentThoughtName.HARVEST);
    if (count > 6) {
      this.figmentPriority = 3;
    } else if (count > 2) {
      this.figmentPriority = 8;
    } else {
      this.figmentPriority = 12;
    }
    if (this.name === FigmentThoughtName.REMOTE_HARVEST) {
      this.figmentPriority = 2;
    }
  }
  public setFigmentsNeeded(): void {
    this.source = Game.getObjectById(this.sourceId);
    const totalWorkParts = _.sum(this.figments, f => f.getActiveBodyparts(WORK));
    if (totalWorkParts >= 5) {
      this.figmentsNeeded = 0;
    } else if (this.source && this.figments.length < this.source.pos.availableNeighbors(true).length) {
      this.figmentsNeeded = this.figments.length + 1;
    }
  }
}
