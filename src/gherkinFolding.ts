const scenarioHeader = /^Scenario(?:[ \t]+(?:Outline|Template))?[ \t]*:/;
const docStringDelimiter = /^(?:"""|```)/;

export interface FoldingRangeStart {
  readonly start: number;
}

/**
 * Finds the zero-based header lines for Scenario, Scenario Outline, and the
 * synonymous Scenario Template keyword. Parsing stays deliberately tolerant so
 * folding continues to work while a feature file is incomplete or invalid.
 */
export function findScenarioHeaderLines(text: string): number[] {
  const lines = text.split(/\r\n|\n|\r/);
  const headerLines: number[] = [];
  let activeDocStringDelimiter: string | undefined;

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const trimmedLine = lines[lineNumber].trimStart();

    if (activeDocStringDelimiter !== undefined) {
      if (trimmedLine.trimEnd() === activeDocStringDelimiter) {
        activeDocStringDelimiter = undefined;
      }
      continue;
    }

    if (trimmedLine.startsWith('#')) {
      continue;
    }

    const delimiter = trimmedLine.match(docStringDelimiter)?.[0];
    if (delimiter !== undefined) {
      activeDocStringDelimiter = delimiter;
      continue;
    }

    if (scenarioHeader.test(trimmedLine)) {
      headerLines.push(lineNumber);
    }
  }

  return headerLines;
}

/** Keeps only headers for which VS Code has an exact folding range. */
export function findFoldableScenarioLines(
  text: string,
  availableRanges: readonly FoldingRangeStart[],
): number[] {
  const availableStartLines = new Set(availableRanges.map(({ start }) => start));
  return findScenarioHeaderLines(text).filter((line) => availableStartLines.has(line));
}
