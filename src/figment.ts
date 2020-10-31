import { ShuffleArray } from "utils/misc";
import { Neurons } from "neurons/neurons";

export class Figment extends Creep implements Figment {
  constructor(creepId: Id<Creep>) {
    super(creepId);
  }

  private static GenerateName() {
    let first = ["dendrite", "axon", "myelin", "schwann", "nucleus"];
    ShuffleArray(first);
    let second = ["golgi", "mito", "cyto", "plasm", "lyso"];
    ShuffleArray(second);
    let third = ["pyra", "myocyte", "synaptic", "neuro", "receptor"];
    ShuffleArray(third);
    let all = [first, second, third];
    ShuffleArray(all);
    return `figment_${all[0][0]}_${all[1][0]}_${all[2][0]}`;
  }

  public static GetUniqueName() {
    let name = this.GenerateName();
    while (Game.creeps[name]) {
      name = this.GenerateName();
    }
    return name;
  }

  get neurons() {
    return this.memory.interneurons;
  }

  set neurons(neurons: Interneuron[]) {
    this.memory.interneurons = neurons;
  }

  get isDreaming() {
    return this.neurons.length === 0;
  }

  run() {
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

  addNeuron(type: string, ref: string, pos: RoomPosition) {
    const interneuron = {
      type: type,
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

  assignHarvestNeuron(source: Source) {
    if (this.store.getUsedCapacity() === 0) {
      this.addNeuron("HARVEST", source.id, source.pos);
    }
  }
}
