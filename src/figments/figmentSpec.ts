import { FigmentType } from "thoughts/figmentThought";

const attackBodySpec = {
  bodyParts: [TOUGH, ATTACK],
  ratio: [1, 1],
  minParts: 4,
  maxParts: 50,
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
  maxParts: 50,
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
  maxParts: 50,
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
  bodyParts: [MOVE],
  ratio: [1],
  minParts: 1,
  maxParts: 2,
  ignoreCarry: false,
  roadTravel: true
};

const scoutFigmentSpec = {
  combatReady: false,
  bodySpec: scoutBodySpec
};

const transferBodySpec = {
  bodyParts: [CARRY],
  ratio: [1],
  minParts: 6,
  maxParts: 50,
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
  maxParts: 50,
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
  maxParts: 50,
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
    case FigmentType.HARVEST:
      spec = harvestFigmentSpec;
      break;
    case FigmentType.TRANSFER:
      spec = transferFigmentSpec;
      break;
    case FigmentType.PICKUP:
      spec = pickupFigmentSpec;
      break;
    case FigmentType.UPGRADE:
      spec = upgradeFigmentSpec;
      break;
    case FigmentType.WORKER:
      spec = workerFigmentSpec;
      break;
    case FigmentType.DEFENSE:
      spec = defenseFigmentSpec;
      break;
    case FigmentType.ATTACK:
      spec = attackFigmentSpec;
      break;
    case FigmentType.RESERVE:
      spec = reserveFigmentSpec;
      break;
    case FigmentType.SCOUT:
      spec = scoutFigmentSpec;
      break;
    default:
      console.log("getting default worker spec");
      spec = workerFigmentSpec;
      break;
  }
  return spec;
}
