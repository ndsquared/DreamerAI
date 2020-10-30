import { Thought } from "thoughts/thought";

export abstract class Idea implements IBrain {
  private thoughts: { [name: string]: Thought[] };

  constructor() {
    this.thoughts = {};
  }

  ponder() {
    for (const thoughtName in this.thoughts) {
      for (let thought of this.thoughts[thoughtName]) {
        thought.ponder();
      }
    }
  }

  think() {
    for (const thoughtName in this.thoughts) {
      for (let thought of this.thoughts[thoughtName]) {
        thought.think();
      }
    }
  }

  reflect() {
    for (const thoughtName in this.thoughts) {
      for (let thought of this.thoughts[thoughtName]) {
        thought.reflect();
      }
    }
  }
}
