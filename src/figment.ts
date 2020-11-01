/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NeuronType, Neurons } from "neurons/neurons";
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

  public addNeuron(type: string, ref = "", pos: RoomPosition | null = null): void {
    if (!pos) {
      pos = this.pos;
    }
    const interneuron = {
      type,
      target: {
        ref,
        pos: {
          x: pos.x,
          y: pos.y,
          roomName: pos.roomName
        }
      }
    };
    this.memory.interneurons.push(interneuron);
    this.say(type);
  }

  public assignHarvestNeuron(source: Source, shouldDrop: boolean): void {
    if (this.store.getUsedCapacity() === 0) {
      this.addNeuron(NeuronType.HARVEST, source.id, source.pos);
    } else if (shouldDrop) {
      this.addNeuron(NeuronType.DROP);
    } else {
      this.assignTransferNeuron();
    }
  }

  public assignTransferNeuron(): void {
    const target = this.getNextTransferTarget();
    if (target) {
      this.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
    }
  }

  public assignPickupNeuron(): void {
    if (this.store.getFreeCapacity() > 0) {
      const target = this.getNearestResource();
      if (target) {
        this.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      }
    } else {
      this.assignTransferNeuron();
    }
  }

  private getNearestResource() {
    const target = this.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
    return target;
  }

  private getNextTransferTarget() {
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
        this.room.find(FIND_MY_STRUCTURES, { filter: s => s.shouldBeFilled }),
        s => s.pos.findPathTo(this.pos).length
      )
    );
    return target;
  }
}
