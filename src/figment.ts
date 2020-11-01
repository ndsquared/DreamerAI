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
      name = this.GenerateName();
    }
    return name;
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
    targetOptions: InterneuronTargetOptions | null = null
  ): void {
    if (!pos) {
      // Default will be position of the figment
      pos = this.pos;
    }
    if (!targetOptions) {
      // Default target options
      targetOptions = {
        ignoreFigmentCapacity: false
      };
    }
    const interneuron = {
      type,
      target: {
        ref,
        pos,
        options: targetOptions
      }
    };
    this.memory.interneurons.push(interneuron);
    this.say(type);
  }

  public getNearestResource(): Resource | null {
    const target = this.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
    return target;
  }

  public getNextTransferTarget(): Structure | null {
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
        this.room.find(FIND_MY_STRUCTURES, { filter: s => s.hasCapacity }),
        s => s.pos.findPathTo(this.pos).length
      )
    );
    return target;
  }

  public getNextConstructionSite(): ConstructionSite | undefined {
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

  public getClosestEnergySource(): Resource | Structure | null {
    const resource = this.getNearestResource();
    const container = _.first(
      _.sortBy(
        this.room.find(FIND_MY_STRUCTURES, { filter: s => s.containerWithEnergy }),
        s => s.pos.findPathTo(this.pos, { ignoreCreeps: true }).length
      )
    );
    if (resource) {
      if (
        this.pos.findPathTo(resource, { ignoreCreeps: true }).length <
        this.pos.findPathTo(container, { ignoreCreeps: true }).length
      ) {
        return resource;
      }
    }
    return container;
  }
}
