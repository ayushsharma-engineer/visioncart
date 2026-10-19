const COLOR_HEX: Record<string, string> = {
  black: "#16130F",
  white: "#FFFFFF",
  ivory: "#F5EFE0",
  cream: "#F3EAD3",
  beige: "#D9C7A7",
  grey: "#9A9A9A",
  gray: "#9A9A9A",
  charcoal: "#3A3A3C",
  navy: "#1F2A44",
  blue: "#2E6BD6",
  "sky blue": "#8CC4EE",
  teal: "#1F7A7A",
  green: "#2F7D4F",
  olive: "#6B7A3A",
  "sage green": "#9CAF88",
  yellow: "#E9C23A",
  mustard: "#D09A1E",
  orange: "#E6762E",
  rust: "#B4491F",
  red: "#C0392B",
  maroon: "#6E1F2B",
  burgundy: "#6D1A36",
  pink: "#E88AA6",
  blush: "#F0C3C0",
  "dusty pink": "#D9A5A8",
  purple: "#6B4FB0",
  lavender: "#B9A7E0",
  brown: "#6F4A32",
  tan: "#B88B5E",
  camel: "#B98A53",
  gold: "#C9A24B",
  silver: "#BFC3C8",
  "rose gold": "#C98F85",
  multi: "linear-gradient(135deg,#E6762E,#6B4FB0,#2E6BD6)",
};

export function colorToCss(name: string | null | undefined): string {
  if (!name) return "#C9C2B8";
  return COLOR_HEX[name.trim().toLowerCase()] ?? "#C9C2B8";
}

export function isLightColor(name: string | null | undefined): boolean {
  const css = colorToCss(name);
  if (!css.startsWith("#")) return false;
  const n = parseInt(css.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.8;
}
