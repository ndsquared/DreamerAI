/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NeuronType, Neurons } from "neurons/neurons";
import { Imagination } from "imagination";
import { ShuffleArray } from "utils/misc";
import { Traveler } from "utils/traveler";
import { getColor } from "utils/colors";
import profiler from "screeps-profiler";

export class Figment extends Creep implements Figment {
  public imagination: Imagination;
  public constructor(creepId: Id<Creep>, imagination: Imagination) {
    super(creepId);
    this.imagination = imagination;
  }

  public travelTo(destination: RoomPosition | { pos: RoomPosition }, options?: TravelToOptions): number {
    return Traveler.travelTo(this, destination, options);
  }

  public moveRandom(target: RoomPosition | undefined = undefined, dst: number | undefined = undefined): number {
    let randomDir = _.random(1, 8);
    if (target && dst) {
      let direction = 0;
      for (let i = 1; i < 8; i++) {
        direction = (randomDir + i) % 8;
        const pos = Traveler.positionAtDirection(this.pos, direction);
        if (!pos) {
          continue;
        }
        if (pos.isEdge) {
          continue;
        }
        if (!pos.isWalkable) {
          continue;
        }
        if (!pos.inRangeTo(target, dst)) {
          continue;
        }
        break;
      }
      randomDir = direction;
    }
    return this.move(randomDir as DirectionConstant);
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
    let count = 0;
    while (Game.creeps[name]) {
      name = this.GenerateName();
      if (count > 5) {
        console.log(`unique name conflict, trying again: ${name}`);
      }
      count++;
    }
    return name;
  }

  public static GetBodyFromBodySpec(bodySpec: FigmentBodySpec, energyAvailable: number): BodyPartConstant[] {
    let bodyParts: BodyPartConstant[] = [];
    let bodyPartCount = 0;
    let energySpent = 0;
    let shouldReturn = false;
    while (energySpent < energyAvailable) {
      for (let i = 0; i < bodySpec.bodyParts.length; i++) {
        const bodyPart = bodySpec.bodyParts[i];
        const ratio = bodySpec.ratio[i];
        for (let j = 0; j < ratio; j++) {
          const parts: BodyPartConstant[] = [bodyPart, MOVE];
          if (bodyPart === CARRY && bodySpec.ignoreCarry) {
            parts.pop();
          } else if (bodySpec.roadTravel && bodyPartCount % 2 === 1) {
            parts.pop();
          }
          const cost = _.sum(parts, p => BODYPART_COST[p]);
          if (energySpent + cost <= energyAvailable && bodyPartCount + parts.length <= bodySpec.maxParts) {
            bodyParts = bodyParts.concat(parts);
            bodyPartCount += parts.length;
            energySpent += cost;
          } else {
            shouldReturn = true;
            break;
          }
        }
        if (shouldReturn) {
          break;
        }
      }
      if (shouldReturn) {
        break;
      }
      // Safety net for bodyspec with no parts
      if (bodySpec.bodyParts.length === 0) {
        bodyParts.push(MOVE);
        bodyPartCount++;
        break;
      }
    }

    if (bodyPartCount < bodySpec.minParts) {
      return [];
    }

    return Figment.SortedBodyParts(bodyParts);
  }

  public static SortedBodyParts(parts: BodyPartConstant[]): BodyPartConstant[] {
    const sortedBodyParts = _.sortBy(parts, s => {
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
        case CLAIM:
          return 5;
        case MOVE:
          return 6;
        case HEAL:
          return 7;
        default:
          return 10;
      }
    });
    return sortedBodyParts;
  }

  public get neurons(): Interneuron[] {
    if (this.memory.interneurons) {
      return this.memory.interneurons;
    }
    return [];
  }

  public get isDreaming(): boolean {
    return this.neurons.length === 0;
  }

  // TODO: Move this logic to the combat idea and interrupt figments when necessary
  // private preRunChecks(): void {
  //   if (this.memory.combatReady && this.memory.ideaName) {
  //     if (this.memory.inCombat) {
  //       return;
  //     }
  //     const spawnRoom = Game.rooms[this.memory.ideaName];
  //     for (const room of spawnRoom.neighborhood) {
  //       const enemies = room.find(FIND_HOSTILE_CREEPS);
  //       if (enemies.length) {
  //         this.memory.interneurons = [];
  //         return;
  //       }
  //       const enemyStructures = room.find(FIND_HOSTILE_STRUCTURES);
  //       if (enemyStructures.length) {
  //         this.memory.interneurons = [];
  //         return;
  //       }
  //     }
  //   } else {
  //     if (this.memory.underAttack) {
  //       this.memory.underAttack = false;
  //       this.memory.underAttackCooldown--;
  //       const enemies = this.room.find(FIND_HOSTILE_CREEPS);
  //       if (enemies.length) {
  //         for (const enemy of enemies) {
  //           if (enemy.pos.inRangeTo(this.pos, 4)) {
  //             this.memory.underAttack = true;
  //           }
  //         }
  //       }
  //       if (!this.memory.underAttack) {
  //         if (this.memory.underAttackCooldown <= 0) {
  //           this.memory.interneurons = [];
  //           this.memory.underAttackCooldown = 5;
  //         }
  //       }
  //     } else {
  //       const target = Game.spawns.Spawn1;
  //       const enemies = this.room.find(FIND_HOSTILE_CREEPS);
  //       if (enemies.length) {
  //         for (const enemy of enemies) {
  //           if (enemy.getActiveBodyparts(ATTACK) > 0 || enemy.getActiveBodyparts(RANGED_ATTACK) > 0) {
  //             if (enemy.pos.inRangeTo(this.pos, 4)) {
  //               this.say("Noooo!", true);
  //               console.log(`${this.name} is under attack! at ${this.pos.toString()}`);
  //               this.memory.interneurons = [];
  //               const randomDir = _.random(1, 8);
  //               this.move(randomDir as DirectionConstant);
  //               this.addNeuron(NeuronType.MOVE, "", target.pos, { moveRange: 3 });
  //               this.memory.underAttack = true;
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  public run(): boolean {
    try {
      while (this.neurons.length > 0) {
        const neuron = Neurons.generateNeuron(this, this.neurons[0]);
        if (neuron.isValid()) {
          neuron.run();
          return true;
        }
        this.removeNeuron();
      }
    } catch (error) {
      this.say("ERROR");
      console.log(`${this.name} is having issues!`);
      console.log(error);
      return true;
    }
    return false;
  }

  public addNeuron(
    type: string,
    ref = "",
    pos: RoomPosition | undefined = undefined,
    targetOptions: Record<string, unknown> | undefined = undefined
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
      moveRange: 1,
      moveRandom: false,
      movingTarget: false,
      sleepTicks: -1,
      resourceType: null,
      oneShot: false
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
    if (pos && this.pos.roomName === pos.roomName) {
      const rv = new RoomVisual(this.pos.roomName);
      rv.line(this.pos, pos, { color: getColor("lime") });
    }
    if (type !== NeuronType.SLEEP) {
      this.say(type);
    }
  }

  public removeNeuron(): void {
    const neuron = this.neurons.shift();
    if (!neuron) {
      return;
    }
    // TODO: Do this smarter and use imagination object
    if (
      neuron.type === NeuronType.PICKUP ||
      neuron.type === NeuronType.WITHDRAW ||
      neuron.type === NeuronType.TRANSFER
    ) {
      if (Memory.imagination.metabolic[this.memory.roomName].metabolism.inputs[neuron.target.ref]) {
        delete Memory.imagination.metabolic[this.memory.roomName].metabolism.inputs[neuron.target.ref][this.name];
      }
      if (Memory.imagination.metabolic[this.memory.roomName].metabolism.outputs[neuron.target.ref]) {
        delete Memory.imagination.metabolic[this.memory.roomName].metabolism.outputs[neuron.target.ref][this.name];
      }
    }
  }
}

profiler.registerClass(Figment, "Figment");
