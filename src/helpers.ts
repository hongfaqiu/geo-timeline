
export function getTextWidth(text: string, font: string) {
  // @ts-ignore
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  // re-use canvas object for better performance
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);

  return metrics.width;
}