
const canvas = document.createElement("canvas")

export function getTextWidth(text: string, font: string) {
  // re-use canvas object for better performance
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);

  return metrics.width;
}