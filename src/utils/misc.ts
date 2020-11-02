export function ShuffleArray(array: any[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function isStoreStructure(structure: Structure): structure is StoreStructure {
  return (structure as StoreStructure).store !== undefined;
}

export function isEnergyStructure(structure: Structure): structure is EnergyStructure {
  return (structure as EnergyStructure).energy !== undefined;
}
