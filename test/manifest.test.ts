import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

interface CommandContribution {
  readonly command: string;
  readonly title: string;
  readonly icon?: string;
}

interface MenuContribution {
  readonly command: string;
  readonly when?: string;
  readonly group?: string;
}

interface ExtensionManifest {
  readonly displayName: string;
  readonly description: string;
  readonly keywords: string[];
  readonly contributes: {
    readonly configurationDefaults: {
      readonly 'cursor.general.pinnedTitleActions': string[];
    };
    readonly commands: CommandContribution[];
    readonly menus: {
      readonly 'editor/title': MenuContribution[];
    };
    readonly configuration: {
      readonly properties: {
        readonly 'gherkinFold.collapseOnOpen': {
          readonly default: boolean;
        };
      };
    };
  };
}

describe('extension manifest', () => {
  it('includes user-facing Marketplace search metadata', () => {
    const manifestPath = path.resolve(__dirname, '../../package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ExtensionManifest;

    assert.equal(manifest.displayName, 'Gherkin Fold');
    assert.equal(manifest.description, 'View all scenarios in a glance.');
    assert.ok(manifest.keywords.includes('gherkin fold'));
    assert.ok(manifest.keywords.includes('scenario folding'));
    assert.equal(
      manifest.contributes.configuration.properties['gherkinFold.collapseOnOpen'].default,
      false,
    );
  });

  it('contributes expand and collapse buttons to .feature editor titles', () => {
    const manifestPath = path.resolve(__dirname, '../../package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ExtensionManifest;
    const commands = new Map(
      manifest.contributes.commands.map((command) => [command.command, command]),
    );

    assert.equal(commands.get('gherkinFold.foldScenarios')?.icon, '$(collapse-all)');
    assert.equal(commands.get('gherkinFold.expandScenarios')?.icon, '$(expand-all)');
    assert.deepEqual(
      manifest.contributes.configurationDefaults['cursor.general.pinnedTitleActions'],
      ['gherkinFold.foldScenarios', 'gherkinFold.expandScenarios'],
    );
    assert.deepEqual(manifest.contributes.menus['editor/title'], [
      {
        command: 'gherkinFold.foldScenarios',
        when: 'resourceExtname == .feature',
        group: 'navigation@1',
      },
      {
        command: 'gherkinFold.expandScenarios',
        when: 'resourceExtname == .feature',
        group: 'navigation@2',
      },
    ]);
  });
});
