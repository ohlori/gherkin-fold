import {
  findFoldableScenarioLines,
  findScenarioHeaderLines,
  FoldingRangeStart,
} from './gherkinFolding';

export interface DocumentLike {
  readonly languageId: string;
  readonly uri: {
    readonly path: string;
  };
  readonly version: number;
  getText(): string;
}

export interface EditorLike<D extends DocumentLike> {
  readonly document: D;
}

export type ScenarioFoldCommand = 'editor.fold' | 'editor.unfold';

export interface ScenarioFoldArguments {
  readonly selectionLines: number[];
  readonly levels: 1;
  readonly direction: 'down';
}

export interface FoldHost<D extends DocumentLike, E extends EditorLike<D>> {
  getActiveEditor(): E | undefined;
  collapseOnOpen(document: D): boolean;
  getFoldingRanges(document: D): Promise<readonly FoldingRangeStart[] | undefined>;
  executeEditorCommand(
    command: ScenarioFoldCommand,
    arguments_: ScenarioFoldArguments,
  ): Promise<void>;
  reportError(error: unknown): void;
}

/** Coordinates automatic and explicit folding without owning VS Code objects. */
export class GherkinFoldController<D extends DocumentLike, E extends EditorLike<D>> {
  private readonly autoFoldAttempted = new WeakSet<D>();
  private readonly operationTokens = new WeakMap<D, number>();
  private focusEpoch = 0;

  public constructor(private readonly host: FoldHost<D, E>) {}

  /**
   * Applies the default fold at most once during an open document's lifetime.
   * The marker is intentionally retained after a race or error: retrying later
   * could collapse a Scenario that the user has since expanded.
   */
  public async onActiveEditorChanged(editor: E | undefined): Promise<void> {
    this.focusEpoch += 1;

    if (
      editor === undefined
      || !isFeatureDocument(editor.document)
      || !this.host.collapseOnOpen(editor.document)
      || this.autoFoldAttempted.has(editor.document)
    ) {
      return;
    }

    this.autoFoldAttempted.add(editor.document);
    const operationToken = this.beginOperation(editor.document);

    try {
      await this.applyScenarioFold(
        editor,
        'editor.fold',
        this.focusEpoch,
        operationToken,
      );
    } catch (error: unknown) {
      this.host.reportError(error);
    }
  }

  public collapse(editor: E): Promise<void> {
    return this.applyManualAction(editor, 'editor.fold');
  }

  public expand(editor: E): Promise<void> {
    return this.applyManualAction(editor, 'editor.unfold');
  }

  private applyManualAction(editor: E, command: ScenarioFoldCommand): Promise<void> {
    if (!isFeatureDocument(editor.document)) {
      return Promise.resolve();
    }

    // A deliberate toolbar/Command Palette action always wins over a pending
    // automatic fold and prevents a later automatic retry for this document.
    this.autoFoldAttempted.add(editor.document);
    const operationToken = this.beginOperation(editor.document);
    return this.applyScenarioFold(editor, command, this.focusEpoch, operationToken);
  }

  private async applyScenarioFold(
    editor: E,
    command: ScenarioFoldCommand,
    expectedFocusEpoch: number,
    operationToken: number,
  ): Promise<void> {
    if (this.host.getActiveEditor() !== editor) {
      return;
    }

    const document = editor.document;
    const documentVersion = document.version;
    const documentText = document.getText();

    if (findScenarioHeaderLines(documentText).length === 0) {
      return;
    }

    const availableRanges = await this.host.getFoldingRanges(document);

    if (
      this.host.getActiveEditor() !== editor
      || document.version !== documentVersion
      || this.focusEpoch !== expectedFocusEpoch
      || this.operationTokens.get(document) !== operationToken
    ) {
      return;
    }

    const selectionLines = findFoldableScenarioLines(documentText, availableRanges ?? []);
    if (selectionLines.length === 0) {
      return;
    }

    await this.host.executeEditorCommand(command, {
      selectionLines,
      levels: 1,
      direction: 'down',
    });
  }

  private beginOperation(document: D): number {
    const operationToken = (this.operationTokens.get(document) ?? 0) + 1;
    this.operationTokens.set(document, operationToken);
    return operationToken;
  }
}

export function isFeatureDocument(document: DocumentLike): boolean {
  return document.languageId === 'feature' || /\.feature$/i.test(document.uri.path);
}
