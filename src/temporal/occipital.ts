import { Hippocampus } from "./hippocampus";

export class Occipital {
  public hippocampus: Hippocampus;
  private generatedPixel = false;
  private consoleStatus: string[] = [];

  public constructor(hippocampus: Hippocampus) {
    this.hippocampus = hippocampus;
  }
  public addStatus(status: string): void {
    this.consoleStatus.push(status);
  }

  public initialStatus(): void {

    const figments = Object.keys(Game.creeps).length;
    this.consoleStatus = [];
    this.addStatus(`Tick: ${Game.time}`);
    if (Game.cpu.bucket >= 9500 && Game.cpu.generatePixel) {
      this.addStatus(`Bucket: ${Game.cpu.bucket}`);
      this.generatedPixel = true;
      Game.cpu.generatePixel();
    } else {
      this.addStatus(`Bucket: ${Game.cpu.bucket}`);
      this.generatedPixel = false;
    }
    this.addStatus(`Figments: ${figments}`);
  }

  public endingStatus(): void {
    this.addStatus(`CPU Usage: ${Game.cpu.getUsed().toFixed(0)}`);
    this.addStatus(`CPU Limit: ${Game.cpu.limit}`);
    this.addStatus(`CPU Tick Limit: ${Game.cpu.tickLimit}`);
    if (this.generatedPixel) {
      this.addStatus("GENERATED PIXEL");
    }
    this.printStatus();
  }

  public printStatus(): void {
    const status = this.consoleStatus.join(" | ");
    console.log(status);
  }

  public rall(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle all stats/visuals for ${roomName}`;
    }
    this.rstats(roomName);
    this.rbuild(roomName);
    this.rmeta(roomName);
    this.renemy(roomName);
    this.rmap(roomName);
    return `Successfully toggled all stats/visuals for ${roomName}`;
  }

  public rstats(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle stats for ${roomName}`;
    }
    this.hippocampus[roomName].showStats = !this.hippocampus[roomName].showStats;
    return `Successfully toggled stats for ${roomName}`;
  }

  public rbuild(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle build visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showBuildVisuals = !this.hippocampus[roomName].showBuildVisuals;
    return `Successfully toggled build visuals for ${roomName}`;
  }

  public rmeta(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle metabolic visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showMetaVisuals = !this.hippocampus[roomName].showMetaVisuals;
    return `Successfully toggled metabolic visuals for ${roomName}`;
  }

  public renemy(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle enemy visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showEnemyVisuals = !this.hippocampus[roomName].showEnemyVisuals;
    return `Successfully toggled enemy visuals for ${roomName}`;
  }

  public rmap(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle map visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showMapVisuals = !this.hippocampus[roomName].showMapVisuals;
    return `Successfully toggled map visuals for ${roomName}`;
  }
}
