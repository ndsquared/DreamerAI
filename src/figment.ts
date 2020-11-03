/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Neurons } from "neurons/neurons";
import { ShuffleArray } from "utils/misc";

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

    // console.log(bodyParts.toString());
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
    // console.log(sortedBodyParts.toString());
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
      moveOffRoadDuringImpulse: false
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

  public getNextPickupTarget(): Resource | null {
    const resource = _.first(
      _.sortBy(this.room.find(FIND_DROPPED_RESOURCES, { filter: s => s.amount >= this.store.getCapacity() }), s => {
        return PathFinder.search(this.pos, { pos: s.pos, range: 1 }).path.length;
      })
    );
    // const target = this.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
    return resource;
  }

  public getNextTransferTarget(useStorage = true): Structure | null {
    // First check if towers have minimum energy required
    const structures = this.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER
    });
    for (const structure of structures) {
      const tower = structure as StructureTower;
      if (tower.store.getUsedCapacity("energy") < 100) {
        return tower;
      }
    }
    const target = _.first(
      _.sortBy(
        this.room.find(FIND_STRUCTURES, {
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
        }),
        s => s.pos.findPathTo(this.pos).length
      )
    );
    return target;
  }

  public getNextBuildTarget(): ConstructionSite | undefined {
    let target = _.first(
      _.sortBy(this.room.find(FIND_MY_CONSTRUCTION_SITES), s => {
        const percentCompleted = s.progress / s.progressTotal;
        return percentCompleted;
      }).reverse()
    );
    // If target site hasn't been started yet, find the closest site instead.
    if (target !== undefined && target.progress === 0) {
      target = _.first(_.sortBy(this.room.find(FIND_MY_CONSTRUCTION_SITES), s => s.pos.findPathTo(this.pos).length));
    }
    return target;
  }

  public getNextRepairTarget(repairThreshold = 10000): Structure | null {
    const target = this.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => {
        if (s.hits < repairThreshold && s.hits < s.hitsMax) {
          return true;
        }
        return false;
      }
    });
    // if (target) console.log(`current repair target ${target.id}`);
    return target;
  }

  public getNextPickupOrWithdrawTarget(useStorage = false): Resource | Structure | null {
    const resource = this.getNextPickupTarget();
    const target = _.first(
      _.sortBy(
        this.room.find(FIND_STRUCTURES, {
          filter: s => {
            if (s instanceof StructureContainer) {
              const controller = this.room.controller;
              if (controller) {
                if (controller.pos.inRangeTo(s.pos, 1)) {
                  return false;
                }
              }
              return s.store.getUsedCapacity() >= this.store.getCapacity();
            } else if (s instanceof StructureStorage && useStorage) {
              return s.store.getUsedCapacity() >= this.store.getCapacity();
            }
            return false;
          }
        }),
        s => s.pos.findPathTo(this.pos, { ignoreCreeps: true }).length
      )
    ) as StoreStructure;
    if (!target) {
      return resource;
    }
    if (resource) {
      if (
        this.pos.findPathTo(resource, { ignoreCreeps: true }).length <
        this.pos.findPathTo(target, { ignoreCreeps: true }).length
      ) {
        return resource;
      }
    }
    // console.log(`${this.name} getting energy from container ${container.id}`);
    return target;
  }
}
