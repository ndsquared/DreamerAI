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

  // public set neurons(neurons: Interneuron[]) {
  //   this.memory.interneurons = neurons;
  // }

  public get isDreaming(): boolean {
    return this.neurons.length === 0;
  }

  public run(): void {
    while (this.neurons.length > 0) {
      const neuron = Neurons.generateNeuron(this, this.neurons[0]);
      if (neuron.isValid()) {
        console.log(`${this.name} running ${neuron.type}`);
        neuron.run();
        break;
      }
      this.neurons.shift();
    }
  }

  public addNeuron(type: string, ref: string, pos: RoomPosition): void {
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

  public assignHarvestNeuron(source: Source): void {
    if (this.store.getUsedCapacity() === 0) {
      this.addNeuron("HARVEST", source.id, source.pos);
    }
  }
}
