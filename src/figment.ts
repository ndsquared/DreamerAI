import { ShuffleArray } from "utils/misc";
import { Neuron } from "neurons/neuron";

export class Figment extends Creep implements Figment {
  constructor(creepId: Id<Creep>) {
    super(creepId);
  }

  private static GenerateSuffix() {
    let first = ["dendrite", "axon", "myelin", "schwann", "nucleus"];
    ShuffleArray(first);
    let second = ["golgi", "mito", "cyto", "plasm", "lyso"];
    ShuffleArray(second);
    let third = ["pyra", "myocyte", "synaptic", "neuro", "receptor"];
    ShuffleArray(third);
    let all = [first, second, third];
    ShuffleArray(all);
    return `${all[0][0]}_${all[1][0]}_${all[2][0]}`;
  }

  get neurons() {
    return [];
  }

  set neurons(neurons: Interneuron[]) {}

  get isDreaming() {
    return this.neurons.length === 0;
  }

  run() {
    while (this.neurons.length > 0) {
      const neuron = Neuron.generateNeuron(this.neurons[0]);
      if (neuron.isValid()) {
        neuron.run();
      } else {
        this.neurons.shift();
      }
    }
  }
}
