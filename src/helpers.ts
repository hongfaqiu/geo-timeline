import { Selection } from "d3";

export function getTextWidth(text: string, font: string) {
  // @ts-ignore
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  // re-use canvas object for better performance
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);

  return metrics.width;
}

// temporary: avoid a crash due to starting a transition
export function trans<T extends Selection<any, any, any, any>>(node: T, duration: number): T {
  return duration ?
    node
      .transition()
      .duration(duration) as unknown as T :
    node
}