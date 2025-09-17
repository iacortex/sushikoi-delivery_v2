export type DrinkBrand =
  | "cocacola" | "sprite" | "fanta" | "inca"
  | "monster" | "vital" | "elvalle" | "guallarauco"
  | "agua" | "jugo" | "default";

export function brandFromName(name: string): DrinkBrand {
  const n = name.toLowerCase();
  if (/coca\s*cola/.test(n)) return "cocacola";
  if (/sprite/.test(n)) return "sprite";
  if (/fanta/.test(n)) return "fanta";
  if (/inca\s*kola/.test(n)) return "inca";
  if (/monster/.test(n)) return "monster";
  if (/vital/.test(n)) return "vital";
  if (/el\s*valle/.test(n)) return "elvalle";
  if (/guallarauco/.test(n)) return "guallarauco";
  if (/agua|vital/.test(n)) return "agua";
  if (/jugo|valle|guallarauco/.test(n)) return "jugo";
  return "default";
}
