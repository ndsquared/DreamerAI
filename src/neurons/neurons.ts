import { Figment } from "../figment";
import { Neuron } from "./neuron";
import { NeuronBuild } from "./neuronBuild";
import { NeuronDream } from "./neuronDream";
import { NeuronDrop } from "./neuronDrop";
import { NeuronHarvest } from "./neuronHarvest";
import { NeuronMove } from "./neuronMove";
import { NeuronPickup } from "./neuronPickup";
import { NeuronTransfer } from "./neuronTransfer";
import { NeuronUpgrade } from "./neuronUpgrade";
import { NeuronWithDraw } from "./neuronWithdraw";

export enum NeuronType {
  DREAM = "DREAM",
  HARVEST = "HARVEST",
  DROP = "DROP",
  TRANSFER = "TRANSFER",
  PICKUP = "PICKUP",
  BUILD = "BUILD",
  UPGRADE = "UPGRADE",
  WITHDRAW = "WITHDRAW",
  MOVE = "MOVE"
}
export abstract class Neurons {
  public static generateNeuron(figment: Figment, interneuron: Interneuron): Neuron {
    let neuron: Neuron;
    switch (interneuron.type) {
      case NeuronType.HARVEST:
        neuron = new NeuronHarvest(figment, interneuron);
        break;
      case NeuronType.DROP:
        neuron = new NeuronDrop(figment, interneuron);
        break;
      case NeuronType.TRANSFER:
        neuron = new NeuronTransfer(figment, interneuron);
        break;
      case NeuronType.PICKUP:
        neuron = new NeuronPickup(figment, interneuron);
        break;
      case NeuronType.BUILD:
        neuron = new NeuronBuild(figment, interneuron);
        break;
      case NeuronType.UPGRADE:
        neuron = new NeuronUpgrade(figment, interneuron);
        break;
      case NeuronType.WITHDRAW:
        neuron = new NeuronWithDraw(figment, interneuron);
        break;
      case NeuronType.MOVE:
        neuron = new NeuronMove(figment, interneuron);
        break;
      default:
        neuron = new NeuronDream(figment, interneuron);
        break;
    }
    return neuron;
  }
}
