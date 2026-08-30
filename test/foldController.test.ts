import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DocumentLike,
  EditorLike,
  FoldHost,
  GherkinFoldController,
  ScenarioFoldArguments,
  ScenarioFoldCommand,
} from '../src/foldController';
import { FoldingRangeStart } from '../src/gherkinFolding';

interface TestDocument extends DocumentLike {
  version: number;
  text: string;
}

interface TestEditor extends EditorLike<TestDocument> {
  readonly name: string;
}

interface RecordedAction {
  readonly command: ScenarioFoldCommand;
  readonly arguments: ScenarioFoldArguments;
}

const featureText = [
  'Feature: Reviews',
  '  Rule: Ratings',
  '    Scenario: Empty',
  '    Scenario: Show ratings',
  '      Given ratings exist',
].join('\n');

function createDocument(
  path = '/workspace/reviews.feature',
  languageId = 'feature',
): TestDocument {
  return {
    languageId,
    uri: { path },
    version: 1,
    text: featureText,
    getText() {
      return this.text;
    },
  };
}

function createEditor(document: TestDocument, name = 'editor'): TestEditor {
  return { document, name };
}

class TestHost implements FoldHost<TestDocument, TestEditor> {
  public activeEditor: TestEditor | undefined;
  public autoFoldEnabled = true;
  public readonly actions: RecordedAction[] = [];
  public readonly errors: unknown[] = [];
  public rangeRequests = 0;
  public getRanges: () => Promise<readonly FoldingRangeStart[] | undefined> = async () => [
    { start: 0 },
    { start: 1 },
    { start: 3 },
  ];

  public getActiveEditor(): TestEditor | undefined {
    return this.activeEditor;
  }

  public collapseOnOpen(): boolean {
    return this.autoFoldEnabled;
  }

  public async getFoldingRanges(): Promise<readonly FoldingRangeStart[] | undefined> {
    this.rangeRequests += 1;
    return this.getRanges();
  }

  public async executeEditorCommand(
    command: ScenarioFoldCommand,
    arguments_: ScenarioFoldArguments,
  ): Promise<void> {
    this.actions.push({ command, arguments: arguments_ });
  }

  public reportError(error: unknown): void {
    this.errors.push(error);
  }
}

function deferred<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

describe('GherkinFoldController', () => {
  it('automatically folds once per open document, not once per editor wrapper', async () => {
    const host = new TestHost();
    const controller = new GherkinFoldController(host);
    const document = createDocument();
    const firstEditor = createEditor(document, 'first');
    const recreatedEditor = createEditor(document, 'recreated');

    host.activeEditor = firstEditor;
    await controller.onActiveEditorChanged(firstEditor);
    await controller.expand(firstEditor);

    host.activeEditor = undefined;
    await controller.onActiveEditorChanged(undefined);
    host.activeEditor = recreatedEditor;
    await controller.onActiveEditorChanged(recreatedEditor);

    assert.deepEqual(host.actions.map(({ command }) => command), [
      'editor.fold',
      'editor.unfold',
    ]);
  });

  it('folds again when reopening creates a new document object', async () => {
    const host = new TestHost();
    const controller = new GherkinFoldController(host);
    const firstEditor = createEditor(createDocument(), 'first session');
    const reopenedEditor = createEditor(createDocument(), 'second session');

    host.activeEditor = firstEditor;
    await controller.onActiveEditorChanged(firstEditor);
    host.activeEditor = reopenedEditor;
    await controller.onActiveEditorChanged(reopenedEditor);

    assert.deepEqual(host.actions.map(({ command }) => command), [
      'editor.fold',
      'editor.fold',
    ]);
  });

  it('lets a manual expand supersede a pending automatic collapse', async () => {
    const host = new TestHost();
    const controller = new GherkinFoldController(host);
    const editor = createEditor(createDocument());
    const automaticRanges = deferred<readonly FoldingRangeStart[]>();
    let request = 0;
    host.getRanges = () => {
      request += 1;
      return request === 1
        ? automaticRanges.promise
        : Promise.resolve([{ start: 3 }]);
    };

    host.activeEditor = editor;
    const automaticFold = controller.onActiveEditorChanged(editor);
    await controller.expand(editor);
    automaticRanges.resolve([{ start: 3 }]);
    await automaticFold;

    assert.deepEqual(host.actions.map(({ command }) => command), ['editor.unfold']);
  });

  it('does not apply a delayed fold after focus leaves and returns', async () => {
    const host = new TestHost();
    const controller = new GherkinFoldController(host);
    const featureEditor = createEditor(createDocument());
    const otherEditor = createEditor(createDocument('/workspace/readme.md', 'markdown'));
    const ranges = deferred<readonly FoldingRangeStart[]>();
    host.getRanges = () => ranges.promise;

    host.activeEditor = featureEditor;
    const automaticFold = controller.onActiveEditorChanged(featureEditor);
    host.activeEditor = otherEditor;
    await controller.onActiveEditorChanged(otherEditor);
    host.activeEditor = featureEditor;
    await controller.onActiveEditorChanged(featureEditor);
    ranges.resolve([{ start: 3 }]);
    await automaticFold;

    assert.deepEqual(host.actions, []);
  });

  it('does not apply a fold after the document changes during range discovery', async () => {
    const host = new TestHost();
    const controller = new GherkinFoldController(host);
    const document = createDocument();
    const editor = createEditor(document);
    const ranges = deferred<readonly FoldingRangeStart[]>();
    host.getRanges = () => ranges.promise;

    host.activeEditor = editor;
    const automaticFold = controller.onActiveEditorChanged(editor);
    document.version += 1;
    ranges.resolve([{ start: 3 }]);
    await automaticFold;

    assert.deepEqual(host.actions, []);
  });

  it('uses exact Scenario ranges for explicit collapse and expand actions', async () => {
    const host = new TestHost();
    const controller = new GherkinFoldController(host);
    const editor = createEditor(createDocument());
    host.activeEditor = editor;

    await controller.collapse(editor);
    await controller.expand(editor);

    assert.deepEqual(host.actions, [
      {
        command: 'editor.fold',
        arguments: { selectionLines: [3], levels: 1, direction: 'down' },
      },
      {
        command: 'editor.unfold',
        arguments: { selectionLines: [3], levels: 1, direction: 'down' },
      },
    ]);
  });

  it('ignores non-feature files and respects disabled automatic folding', async () => {
    const host = new TestHost();
    const controller = new GherkinFoldController(host);
    const markdownEditor = createEditor(createDocument('/workspace/readme.md', 'markdown'));
    host.activeEditor = markdownEditor;

    await controller.onActiveEditorChanged(markdownEditor);
    await controller.collapse(markdownEditor);
    await controller.expand(markdownEditor);

    const featureEditor = createEditor(createDocument('/workspace/upper.FEATURE', 'plaintext'));
    host.activeEditor = featureEditor;
    host.autoFoldEnabled = false;
    await controller.onActiveEditorChanged(featureEditor);

    assert.equal(host.rangeRequests, 0);
    assert.deepEqual(host.actions, []);
  });
});
