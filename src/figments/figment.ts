/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NeuronType, Neurons } from "neurons/neurons";
import { PathFindWithRoad, ShuffleArray, isEnergyStructure, isStoreStructure } from "utils/misc";
import { Traveler } from "utils/traveler";
import profiler from "screeps-profiler";

export class Figment extends Creep implements Figment {
  public constructor(creepId: Id<Creep>) {
    super(creepId);
  }

  public travelTo(destination: RoomPosition | { pos: RoomPosition }, options?: TravelToOptions): number {
    return Traveler.travelTo(this, destination, options);
  }

  public moveRandom(target: RoomPosition | null = null, dst: number | null = null): number {
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

  // TODO: Need to allow building a body With one MOVE part
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
      if (bodySpec.bodyParts.length === 0) {
        bodyParts.push(MOVE);
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

  private preRunChecks(): void {
    if (this.memory.combatReady && this.memory.ideaName) {
      if (this.memory.inCombat) {
        return;
      }
      const spawnRoom = Game.rooms[this.memory.ideaName];
      for (const room of spawnRoom.neighborhood) {
        const enemies = room.find(FIND_HOSTILE_CREEPS);
        if (enemies.length) {
          this.memory.interneurons = [];
          return;
        }
        const enemyStructures = room.find(FIND_HOSTILE_STRUCTURES);
        if (enemyStructures.length) {
          this.memory.interneurons = [];
          return;
        }
      }
    } else {
      if (this.memory.underAttack) {
        this.memory.underAttack = false;
        this.memory.underAttackCooldown--;
        const enemies = this.room.find(FIND_HOSTILE_CREEPS);
        if (enemies.length) {
          for (const enemy of enemies) {
            if (enemy.pos.inRangeTo(this.pos, 4)) {
              this.memory.underAttack = true;
            }
          }
        }
        if (!this.memory.underAttack) {
          if (this.memory.underAttackCooldown <= 0) {
            this.memory.interneurons = [];
            this.memory.underAttackCooldown = 5;
          }
        }
      } else {
        const target = Game.spawns.Spawn1;
        const enemies = this.room.find(FIND_HOSTILE_CREEPS);
        if (enemies.length) {
          for (const enemy of enemies) {
            if (enemy.getActiveBodyparts(ATTACK) > 0 || enemy.getActiveBodyparts(RANGED_ATTACK) > 0) {
              if (enemy.pos.inRangeTo(this.pos, 4)) {
                this.say("Noooo!", true);
                console.log(`${this.name} is under attack! at ${this.pos.toString()}`);
                this.memory.interneurons = [];
                const randomDir = _.random(1, 8);
                this.move(randomDir as DirectionConstant);
                this.addNeuron(NeuronType.MOVE, "", target.pos, { moveRange: 3 });
                this.memory.underAttack = true;
              }
            }
          }
        }
      }
    }
  }

  public run(): boolean {
    while (this.neurons.length > 0) {
      const neuron = Neurons.generateNeuron(this, this.neurons[0]);
      if (neuron.isValid()) {
        neuron.run();
        return true;
      }
      this.removeNeuron();
    }
    return false;
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
      moveRange: 1,
      moveRandom: false,
      movingTarget: false
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

  public removeNeuron(): void {
    const neuron = this.neurons.shift();
    if (!neuron) {
      return;
    }
    if (
      neuron.type === NeuronType.PICKUP ||
      neuron.type === NeuronType.WITHDRAW ||
      neuron.type === NeuronType.TRANSFER
    ) {
      if (Memory.imagination.metabolicIdeas[this.memory.ideaName].metabolism.inputs[neuron.target.ref]) {
        delete Memory.imagination.metabolicIdeas[this.memory.ideaName].metabolism.inputs[neuron.target.ref][this.name];
      }
      if (Memory.imagination.metabolicIdeas[this.memory.ideaName].metabolism.outputs[neuron.target.ref]) {
        delete Memory.imagination.metabolicIdeas[this.memory.ideaName].metabolism.outputs[neuron.target.ref][this.name];
      }
    }
  }

  // TODO: How can we do this smarter?
  public getClosestPickupTarget({
    minCapacity = this.store.getCapacity(RESOURCE_ENERGY) / 3
  }: ClosestTarget): Resource | null {
    const roomResources = this.room.find(FIND_DROPPED_RESOURCES, {
      filter: s => s.amount >= minCapacity
    });
    return _.first(_.sortBy(roomResources, r => PathFindWithRoad(this.pos, r.pos).cost));
  }

  public getClosestPickupOrWithdrawTarget({
    resourceType = RESOURCE_ENERGY,
    minCapacity = this.store.getCapacity(RESOURCE_ENERGY) / 3
  }: ClosestTarget): RoomObject | null {
    let targets: RoomObject[] = [];
    const resource = this.getClosestPickupTarget({ minCapacity });
    if (resource) {
      targets.push(resource);
    }
    const roomTargets = this.room.find(FIND_STRUCTURES, {
      filter: s => {
        if (isEnergyStructure(s)) {
          return s.energy > minCapacity;
        } else if (isStoreStructure(s)) {
          return s.store.getUsedCapacity(resourceType) > minCapacity;
        }
        return false;
      }
    });

    targets = targets.concat(roomTargets);
    return _.first(_.sortBy(targets, r => PathFindWithRoad(this.pos, r.pos).cost));
  }
}

profiler.registerClass(Figment, "Figment");
