interface IBrain {
  ponder(): void;
  think(): void;
  reflect(): void;
}

interface Figment {
  neurons: Interneuron[];
}
