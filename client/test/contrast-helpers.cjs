async function contrast(page, selector) {
  return page.locator(selector).first().evaluate(element => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = color => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const blend = (top, bottom) => {
      const a = top[3] / 255;
      return top.slice(0, 3).map((value, index) => value * a + bottom[index] * (1 - a));
    };
    const luminance = rgb => {
      const linear = rgb.map(value => { const s = value / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) ancestors.push(node);
    let background = document.documentElement.classList.contains('dark') ? [32, 26, 24] : [255, 255, 255];
    for (const node of ancestors.reverse()) background = blend(rgba(getComputedStyle(node).backgroundColor), background);
    const foreground = blend(rgba(getComputedStyle(element).color), background);
    const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
    return { ratio: (a + 0.05) / (b + 0.05), foreground, background, ancestors: ancestors.map(node => ({ tag: node.tagName, className: node.className, background: getComputedStyle(node).backgroundColor })) };
  });
}

async function gradientContrast(page, selector) {
  return page.locator(selector).first().evaluate(element => {
    const style = getComputedStyle(element);
    const parse = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
    const colors = [...style.backgroundImage.matchAll(/rgb\([^)]*\)/g)].map(match => parse(match[0]));
    if (colors.length < 2) throw new Error(`Expected a two-stop gradient: ${style.backgroundImage}`);
    const luminance = rgb => rgb.map(value => { const s = value / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    const foreground = luminance(parse(style.color));
    return Math.min(...colors.map(color => { const background = luminance(color); return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05); }));
  });
}

module.exports = { contrast, gradientContrast };
