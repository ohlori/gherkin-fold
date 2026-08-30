import * as vscode from 'vscode';
import { GherkinFoldController } from './foldController';

export function activate(context: vscode.ExtensionContext): void {
  const reportError = (error: unknown): void => {
    console.error('Gherkin Fold could not update scenario folding.', error);
  };

  const controller = new GherkinFoldController<vscode.TextDocument, vscode.TextEditor>({
    getActiveEditor: () => vscode.window.activeTextEditor,
    collapseOnOpen: (document) => vscode.workspace
      .getConfiguration('gherkinFold', document.uri)
      .get<boolean>('collapseOnOpen', true),
    getFoldingRanges: async (document) => vscode.commands.executeCommand<vscode.FoldingRange[]>(
      'vscode.executeFoldingRangeProvider',
      document.uri,
    ),
    executeEditorCommand: async (command, arguments_) => {
      await vscode.commands.executeCommand(command, arguments_);
    },
    reportError,
  });

  const collapse = async (editor: vscode.TextEditor): Promise<void> => {
    try {
      await controller.collapse(editor);
    } catch (error: unknown) {
      reportError(error);
    }
  };

  const expand = async (editor: vscode.TextEditor): Promise<void> => {
    try {
      await controller.expand(editor);
    } catch (error: unknown) {
      reportError(error);
    }
  };

  const foldCommand = vscode.commands.registerTextEditorCommand(
    'gherkinFold.foldScenarios',
    collapse,
  );
  const expandCommand = vscode.commands.registerTextEditorCommand(
    'gherkinFold.expandScenarios',
    expand,
  );

  const activeEditorListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
    void controller.onActiveEditorChanged(editor);
  });

  context.subscriptions.push(
    foldCommand,
    expandCommand,
    activeEditorListener,
  );
  void controller.onActiveEditorChanged(vscode.window.activeTextEditor);
}

export function deactivate(): void {}
