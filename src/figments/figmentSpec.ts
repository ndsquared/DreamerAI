import { FigmentThoughtType } from "thoughts/thought";

const attackBodySpec = {
  bodyParts: [TOUGH, ATTACK],
  ratio: [1, 1],
  minParts: 4,
  maxParts: 30,
  ignoreCarry: false,
  roadTravel: false
};

const attackFigmentSpec = {
  combatReady: true,
  bodySpec: attackBodySpec
};

const defenseBodySpec = {
  bodyParts: [TOUGH, RANGED_ATTACK, HEAL],
  ratio: [1, 1, 1],
  minParts: 6,
  maxParts: 40,
  ignoreCarry: false,
  roadTravel: false
};

const defenseFigmentSpec = {
  combatReady: true,
  bodySpec: defenseBodySpec
};

const harvestBodySpec = {
  bodyParts: [CARRY, WORK],
  ratio: [1, 5],
  minParts: 4,
  maxParts: 11,
  ignoreCarry: true,
  roadTravel: true
};

const harvestFigmentSpec = {
  combatReady: false,
  bodySpec: harvestBodySpec
};

const pickupBodySpec = {
  bodyParts: [CARRY],
  ratio: [1],
  minParts: 6,
  maxParts: 40,
  ignoreCarry: false,
  roadTravel: false
};

const pickupFigmentSpec = {
  combatReady: false,
  bodySpec: pickupBodySpec
};

const reserveBodySpec = {
  bodyParts: [CLAIM],
  ratio: [1],
  minParts: 2,
  maxParts: 6,
  ignoreCarry: false,
  roadTravel: false
};

const reserveFigmentSpec = {
  combatReady: false,
  bodySpec: reserveBodySpec
};

const scoutBodySpec = {
  bodyParts: [],
  ratio: [],
  minParts: 1,
  maxParts: 1,
  ignoreCarry: false,
  roadTravel: false
};

const scoutFigmentSpec = {
  combatReady: false,
  bodySpec: scoutBodySpec
};

const transferBodySpec = {
  bodyParts: [CARRY],
  ratio: [1],
  minParts: 6,
  maxParts: 30,
  ignoreCarry: false,
  roadTravel: false
};

const transferFigmentSpec = {
  combatReady: false,
  bodySpec: transferBodySpec
};

const upgradeBodySpec = {
  bodyParts: [CARRY, WORK],
  ratio: [1, 3],
  minParts: 4,
  maxParts: 30,
  ignoreCarry: true,
  roadTravel: true
};

const upgradeFigmentSpec = {
  combatReady: false,
  bodySpec: upgradeBodySpec
};

const workerBodySpec = {
  bodyParts: [WORK, CARRY],
  ratio: [1, 1],
  minParts: 4,
  maxParts: 30,
  ignoreCarry: false,
  roadTravel: false
};

const workerFigmentSpec = {
  combatReady: false,
  bodySpec: workerBodySpec
};

export function GetFigmentSpec(figmentType: string): FigmentSpec {
  let spec: FigmentSpec;
  switch (figmentType) {
    case FigmentThoughtType.HARVEST:
      spec = harvestFigmentSpec;
      break;
    case FigmentThoughtType.TRANSFER:
      spec = transferFigmentSpec;
      break;
    case FigmentThoughtType.TOWER_FILLER:
      spec = transferFigmentSpec;
      break;
    case FigmentThoughtType.PICKUP:
      spec = pickupFigmentSpec;
      break;
    case FigmentThoughtType.UPGRADE:
      spec = upgradeFigmentSpec;
      break;
    case FigmentThoughtType.MINER:
      spec = upgradeFigmentSpec;
      break;
    case FigmentThoughtType.WORKER:
      spec = workerFigmentSpec;
      break;
    case FigmentThoughtType.DEFENSE:
      spec = defenseFigmentSpec;
      break;
    case FigmentThoughtType.ATTACK:
      spec = attackFigmentSpec;
      break;
    case FigmentThoughtType.RESERVE:
      spec = reserveFigmentSpec;
      break;
    case FigmentThoughtType.SCOUT:
      spec = scoutFigmentSpec;
      break;
    case FigmentThoughtType.PATROL:
      spec = scoutFigmentSpec;
      break;
    default:
      console.log("getting default worker spec");
      spec = workerFigmentSpec;
      break;
  }
  return spec;
}
