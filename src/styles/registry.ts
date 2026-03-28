import type { ArchitecturalStyleName, StyleGrammar } from "../types.js";

const styles = new Map<ArchitecturalStyleName, StyleGrammar>();

/** Register a style grammar. */
export function registerStyle(grammar: StyleGrammar): void {
  styles.set(grammar.id, grammar);
}

/** Get a style grammar by name. Returns undefined if not found. */
export function getStyle(name: ArchitecturalStyleName): StyleGrammar | undefined {
  return styles.get(name);
}

/** List all registered style names. */
export function listStyles(): ArchitecturalStyleName[] {
  return [...styles.keys()];
}

/** List all registered style grammars. */
export function listStyleGrammars(): StyleGrammar[] {
  return [...styles.values()];
}

/** Get a style grammar, throwing if not found. */
export function requireStyle(name: ArchitecturalStyleName): StyleGrammar {
  const grammar = styles.get(name);
  if (!grammar) throw new Error(`Unknown architectural style: ${name}`);
  return grammar;
}
