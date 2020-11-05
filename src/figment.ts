/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PathFindWithRoad, ShuffleArray } from "utils/misc";
import { Neurons } from "neurons/neurons";

export class Figment extends Creep implements Figment {
  public constructor(creepId: Id<Creep>) {
    super(creepId);
  }

  private static GenerateName() {
    const first = ["dendrite", "axon", "myelin", "schwann", "nucleus"];
    ShuffleArray(first);
    const second = ["golgi", "mito", "cyto", "plasm", "lyso"];
    ShuffleArray(second);
    const third = ["pyra", "myocyte", "synaptic", "neuro", "receptor"];
    ShuffleArray(third);
    const all = [first, second, third];
    ShuffleArray(all);
    return `figment_${all[0][0]}_${all[1][0]}_${all[2][0]}`;
  }

  public static GetUniqueName(): string {
    let name = this.GenerateName();
    while (Game.creeps[name]) {
      console.log(`unique name conflict, trying again: ${name}`);
      name = this.GenerateName();
    }
    return name;
  }

  public static GetBodyFromBodySpec(bodySpec: FigmentBodySpec, energyAvailable: number): BodyPartConstant[] {
    const bodyParts: BodyPartConstant[] = [];
    let bodyPartCount = 0;
    let energySpent = 0;
    let shouldReturn = false;
    while (energySpent < energyAvailable) {
      for (let i = 0; i < bodySpec.bodyParts.length; i++) {
        const bodyPart = bodySpec.bodyParts[i];
        const ratio = bodySpec.ratio[i];
        for (let j = 0; j < ratio; j++) {
          if (energySpent + BODYPART_COST[bodyPart] <= energyAvailable && bodyPartCount < bodySpec.maxParts) {
            bodyParts.push(bodyPart);
            bodyPartCount++;
            energySpent += BODYPART_COST[bodyPart];
          } else {
            shouldReturn = true;
          }
        }
      }
      if (shouldReturn) {
        break;
      }
    }

    const sortedBodyParts = _.sortBy(bodyParts, s => {
      switch (s) {
        case TOUGH:
          return 0;
        case WORK:
          return 1;
        case ATTACK:
          return 2;
        case RANGED_ATTACK:
          return 3;
        case CARRY:
          return 4;
        case HEAL:
          return 5;
        case CLAIM:
          return 6;
        case MOVE:
          return 7;
        default:
          return 10;
      }
    });
    return sortedBodyParts;
  }

  public get neurons(): Interneuron[] {
    return this.memory.interneurons;
  }

  public get isDreaming(): boolean {
    return this.neurons.length === 0;
  }

  public run(): void {
    while (this.neurons.length > 0) {
      const neuron = Neurons.generateNeuron(this, this.neurons[0]);
      if (neuron.isValid()) {
        neuron.run();
        break;
      }
      this.neurons.shift();
    }
  }

  public addNeuron(
    type: string,
    ref = "",
    pos: RoomPosition | null = null,
    targetOptions: Record<string, unknown> | null = null
  ): void {
    if (!pos) {
      // Default will be position of the figment
      pos = this.pos;
    }
    // Default target options
    const defaultTargetOptions: InterneuronTargetOptions = {
      ignoreFigmentCapacity: false,
      targetRange: 1,
      moveOffRoadDuringImpulse: false,
      minCapacity: false
    };
    let options = defaultTargetOptions;
    if (targetOptions) {
      options = Object.assign(defaultTargetOptions, targetOptions);
    }
    const interneuron = {
      type,
      target: {
        ref,
        pos,
        options
      }
    };
    this.memory.interneurons.push(interneuron);
    this.say(type);
  }

  public getNextPickupTarget({ originRoom }: NextTarget): Resource | null {
    const roomResources = originRoom.find(FIND_DROPPED_RESOURCES, {
      filter: s => s.amount >= this.store.getCapacity()
    });
    return _.first(_.sortBy(roomResources, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getNextPickupTargetNeighborhood({ originRoom }: NextTarget): Resource | null {
    let resources: Resource[] = [];
    for (const room of originRoom.neighborhood) {
      const roomResources = room.find(FIND_DROPPED_RESOURCES, { filter: s => s.amount >= this.store.getCapacity() });
      resources = resources.concat(roomResources);
    }
    return _.first(_.sortBy(resources, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getNextTransferTarget({ useStorage = true, originRoom }: NextTarget): Structure | null {
    const roomTargets = originRoom.find(FIND_STRUCTURES, {
      filter: s => {
        if (s.structureType === STRUCTURE_CONTAINER) {
          const sources = s.pos.findInRange(FIND_SOURCES, 1);
          if (sources.length) {
            return false;
          }
        } else if (s.structureType === STRUCTURE_STORAGE && !useStorage) {
          return false;
        }
        return s.hasEnergyCapacity;
      }
    });
    return _.first(_.sortBy(roomTargets, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getNextTransferTargetNeighborhood({ useStorage = true, originRoom }: NextTarget): Structure | null {
    let targets: Structure[] = [];
    for (const room of originRoom.neighborhood) {
      const target = this.getNextTransferTarget({ useStorage, originRoom: room });
      if (target) {
        targets = targets.concat(target);
      }
    }
    return _.first(_.sortBy(targets, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getNextBuildTarget({ originRoom }: NextTarget): ConstructionSite | undefined {
    const roomTargets = originRoom.find(FIND_MY_CONSTRUCTION_SITES);
    return _.first(_.sortBy(roomTargets, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getNextBuildTargetNeighborhood({ originRoom }: NextTarget): ConstructionSite | undefined {
    let targets: ConstructionSite[] = [];
    for (const room of originRoom.neighborhood) {
      const target = this.getNextBuildTarget({ originRoom: room });
      if (target) {
        targets = targets.concat(target);
      }
    }
    return _.first(_.sortBy(targets, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getNextRepairTarget({ repairThreshold = 10000, originRoom }: NextTarget): Structure | null {
    const roomTargets = originRoom.find(FIND_STRUCTURES, {
      filter: s => {
        if (s.structureType === STRUCTURE_ROAD) {
          return false;
        }
        if (s.hits < repairThreshold && s.hits < s.hitsMax) {
          return true;
        }
        return false;
      }
    });

    return _.first(_.sortBy(roomTargets, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getNextRepairTargetNeighborhood({ repairThreshold = 10000, originRoom }: NextTarget): Structure | null {
    let targets: Structure[] = [];
    for (const room of originRoom.neighborhood) {
      const target = this.getNextRepairTarget({ repairThreshold, originRoom: room });
      if (target) {
        targets = targets.concat(target);
      }
    }
    return _.first(_.sortBy(targets, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getNextPickupOrWithdrawTarget({
    useStorage = false,
    avoidControllerStorage = true,
    originRoom
  }: NextTarget): RoomObject | null {
    let targets: RoomObject[] = [];
    const resource = this.getNextPickupTarget({ originRoom });
    if (resource) {
      targets.push(resource);
    }
    const roomTargets = originRoom.find(FIND_STRUCTURES, {
      filter: s => {
        if (s instanceof StructureContainer) {
          if (avoidControllerStorage) {
            const controller = originRoom.controller;
            if (controller) {
              if (controller.pos.inRangeTo(s.pos, 1)) {
                return false;
              }
            }
          }
          return s.store.getUsedCapacity() >= this.store.getCapacity();
        } else if (s instanceof StructureStorage && useStorage) {
          return s.store.getUsedCapacity() >= this.store.getCapacity();
        }
        return false;
      }
    });

    targets = targets.concat(roomTargets);
    return _.first(_.sortBy(targets, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getNextPickupOrWithdrawTargetNeighborhood({
    useStorage = false,
    avoidControllerStorage = true,
    originRoom
  }: NextTarget): RoomObject | null {
    const targets: RoomObject[] = [];
    for (const room of originRoom.neighborhood) {
      const target = this.getNextPickupOrWithdrawTarget({ useStorage, avoidControllerStorage, originRoom: room });
      if (target) {
        targets.push(target);
      }
    }
    return _.first(_.sortBy(targets, r => PathFindWithRoad(this.pos, r.pos).cost));
  }
}
