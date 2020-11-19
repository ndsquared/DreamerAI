import { Idea, IdeaType } from "./idea";
import { Imagination } from "imagination";
import PriorityQueue from "ts-priority-queue";
import { getColor } from "utils/colors";

export class CombatIdea extends Idea {
  public enemyQueue: PriorityQueue<EnemyQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });
  public healQueue: PriorityQueue<HealQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });
  public hostileEnemyInRoom: { [name: string]: boolean } = {};
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType, idea: Idea) {
    super(spawn, imagination, type, idea);
  }

  public ponder(): void {
    this.enemyQueue.clear();
    this.healQueue.clear();
    // for (const room of this.spawn.room.neighborhood) {
    const room = this.spawn.room;
    if (!room) {
      return;
    }
    this.hostileEnemyInRoom[room.name] = false;
    // Get hostile creeps in the room
    const enemies = room.find(FIND_HOSTILE_CREEPS);
    for (const enemy of enemies) {
      this.enemyQueue.queue({
        enemyObject: enemy,
        priority: enemy.hits
      });
      if (enemy.getActiveBodyparts(ATTACK) > 0 || enemy.getActiveBodyparts(RANGED_ATTACK) > 0) {
        this.hostileEnemyInRoom[room.name] = true;
      }
    }
    // Get hostile structures in the room
    const enemyStructures = room.find(FIND_HOSTILE_STRUCTURES);
    for (const enemyStructure of enemyStructures) {
      this.enemyQueue.queue({
        enemyObject: enemyStructure,
        priority: enemyStructure.hits
      });
    }
    // Find figments that need medical attention
    const figments = room.find(FIND_MY_CREEPS, {
      filter: c => {
        return c.hits < c.hitsMax;
      }
    });
    for (const figment of figments) {
      this.healQueue.queue({
        figment,
        priority: figment.hits
      });
    }
    // }
  }

  public reflect(): void {
    if (!this.idea || !this.idea.showEnemyVisuals) {
      return;
    }
    if (this.enemyQueue.length > 0) {
      const nextEnemy = this.enemyQueue.peek().enemyObject;
      const rv = new RoomVisual(nextEnemy.pos.roomName);
      rv.circle(nextEnemy.pos, { fill: getColor("indigo"), radius: 0.5 });
      rv.text(nextEnemy.hits.toString(), nextEnemy.pos);
    }
    if (this.healQueue.length > 0) {
      const nextHeal = this.healQueue.peek().figment;
      const rv = new RoomVisual(nextHeal.pos.roomName);
      rv.circle(nextHeal.pos, { fill: getColor("light-green"), radius: 0.5 });
      rv.text(nextHeal.hits.toString(), nextHeal.pos);
    }
  }

  public getNextEnemyTarget(): Creep | Structure | null {
    if (this.enemyQueue.length === 0) {
      return null;
    }

    return this.enemyQueue.peek().enemyObject;
  }

  public getNextHealTarget(): Creep | null {
    if (this.healQueue.length === 0) {
      return null;
    }

    return this.healQueue.peek().figment;
  }
}
