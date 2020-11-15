/* eslint-disable max-classes-per-file */
import { getColor } from "./colors";

export class BarGraph {
  private anchor: RoomPosition;
  private data: BarGraphData[];
  private width: number;
  private height: number;
  private rv: RoomVisual;
  private graphPadding = 1;
  private barSpacing = 3;
  private barThickness = 2;
  private barPadding = 2;
  private title: string;
  private titlePadding = 2;
  private graphColor: string;
  private barColors: string[] = [];
  public constructor(title: string, anchor: RoomPosition, data: BarGraphData[], width = 10) {
    this.title = title;
    this.anchor = anchor;
    this.data = data;
    this.width = width;
    this.height = data.length * this.barSpacing + this.titlePadding;
    this.rv = new RoomVisual(this.anchor.roomName);
    this.graphColor = getColor("grey", "900");
    this.barColors.push(getColor("red"));
    this.barColors.push(getColor("cyan"));
    this.barColors.push(getColor("purple"));
  }

  public renderGraph(): void {
    this.rv.rect(this.anchor, this.width, this.height, { fill: this.graphColor, opacity: 0.8 });
    const titlePos = new RoomPosition(this.anchor.x + this.width / 2, this.anchor.y + 1, this.anchor.roomName);
    this.rv.text(this.title, titlePos);
    const barAnchor = new RoomPosition(
      this.anchor.x + this.graphPadding,
      this.anchor.y + this.graphPadding + this.titlePadding,
      this.anchor.roomName
    );
    for (let i = 0; i < this.data.length; i++) {
      const color = this.barColors[i % this.barColors.length];
      this.renderBar(barAnchor, this.data[i], i * this.barSpacing, color);
    }
  }

  private renderBar(anchor: RoomPosition, bar: BarGraphData, ySpacing: number, color: string) {
    const textPos = new RoomPosition(anchor.x, anchor.y + ySpacing, anchor.roomName);
    this.rv.text(bar.label, textPos, { align: "left", font: 0.5 });
    const barPos = new RoomPosition(anchor.x + this.barPadding, anchor.y + ySpacing - 1, anchor.roomName);
    this.rv.rect(
      barPos,
      (bar.current / bar.max) * (this.width - this.graphPadding - this.barPadding - 1),
      this.barThickness,
      {
        fill: color,
        opacity: 0.8
      }
    );
    this.rv.rect(barPos, this.width - this.graphPadding - this.barPadding - 1, this.barThickness, {
      fill: color,
      opacity: 0.3
    });
  }
}

export class Table {
  private title: string;
  private anchor: RoomPosition;
  private rv: RoomVisual;
  private data: string[][];
  private columns: number;
  private columnPadding = 6;
  private tableColor: string;
  private tablePadding = 1;
  private titlePadding = 3;
  public constructor(title: string, anchor: RoomPosition, data: string[][]) {
    this.title = title;
    this.anchor = anchor;
    this.data = data;
    this.tableColor = getColor("grey", "900");
    this.rv = new RoomVisual(this.anchor.roomName);
    this.columns = 0;
    if (this.data.length) {
      this.columns = data[0].length;
    }
  }

  public renderTable(): void {
    if (this.data.length < 2) {
      console.log(`Could not render table ${this.title}, not enough data!`);
      return;
    }
    this.rv.rect(
      this.anchor,
      this.columns * this.columnPadding,
      this.data.length + this.titlePadding + this.tablePadding,
      {
        fill: this.tableColor,
        opacity: 0.8
      }
    );
    const titlePos = new RoomPosition(
      this.anchor.x + (this.columns * this.columnPadding) / 2,
      this.anchor.y + 1,
      this.anchor.roomName
    );
    this.rv.text(this.title, titlePos);
    const header = this.data[0];
    const headerAnchor = new RoomPosition(
      this.anchor.x + this.tablePadding,
      this.anchor.y + this.titlePadding,
      this.anchor.roomName
    );
    this.renderRow(headerAnchor, header, "left");
    for (let i = 1; i < this.data.length; i++) {
      const rowAnchor = new RoomPosition(headerAnchor.x, headerAnchor.y + i + 1, headerAnchor.roomName);
      this.renderRow(rowAnchor, this.data[i], "left");
    }
  }

  private renderRow(anchor: RoomPosition, data: string[], align: TextStyle["align"]): void {
    for (let i = 0; i < data.length; i++) {
      this.rv.text(data[i], anchor.x + i * this.columnPadding, anchor.y, { align });
    }
  }
}
