import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  findFoldableScenarioLines,
  findScenarioHeaderLines,
} from '../src/gherkinFolding';

describe('findScenarioHeaderLines', () => {
  it('finds scenarios and scenario outlines without selecting the feature or rule', () => {
    const feature = [
      'Feature: Reviews',
      '  Background:',
      '    Given a signed-in user',
      '',
      '  Scenario: Show review ratings',
      '    When the page opens',
      '    Then ratings are shown',
      '',
      '  Rule: Empty state',
      '    Scenario Outline: Show <state>',
      '      Given the account is <state>',
      '      Then the empty state is correct',
      '',
      '      Examples:',
      '        | state |',
      '        | new   |',
    ].join('\n');

    assert.deepEqual(findScenarioHeaderLines(feature), [4, 9]);
  });

  it('does not select tags or comments', () => {
    const feature = [
      'Feature: Tagged scenarios',
      '  Scenario: First',
      '    Given one step',
      '',
      '  # Run this in the main suite',
      '  @smoke @main',
      '  Scenario: Second',
      '    Given another step',
    ].join('\n');

    assert.deepEqual(findScenarioHeaderLines(feature), [1, 6]);
  });

  it('does not treat section-like text inside doc strings as Gherkin headers', () => {
    const feature = [
      'Feature: API',
      '  Scenario: Return documentation',
      '    Then the response is:',
      '      """text/plain',
      '      Scenario: This is response text',
      '      """',
      '    And the response is valid',
      '  Scenario: Continue normally',
      '    Given a real step',
    ].join('\n');

    assert.deepEqual(findScenarioHeaderLines(feature), [1, 7]);
  });

  it('supports Scenario Template and CRLF line endings', () => {
    const feature = [
      'Feature: Templates',
      '  Scenario Template: Add <amount>',
      '    When I add <amount>',
      '    Then the total changes',
    ].join('\r\n');

    assert.deepEqual(findScenarioHeaderLines(feature), [1]);
  });

  it('handles tabs, a UTF-8 BOM, flexible header spacing, and lone CR endings', () => {
    const feature = [
      '\uFEFFFeature: Spacing',
      '\tScenario : First',
      '\t\tGiven a step',
      '\tScenario  Outline : Second',
      '\t\tGiven another step',
    ].join('\r');

    assert.deepEqual(findScenarioHeaderLines(feature), [1, 3]);
  });

  it('ignores commented headers', () => {
    const feature = [
      'Feature: Drafts',
      '  # Scenario: Disabled',
      '  Scenario: Empty draft',
      '  Scenario: Implemented',
      '    Given a step',
    ].join('\n');

    assert.deepEqual(findScenarioHeaderLines(feature), [2, 3]);
  });

  it('keeps an unterminated doc string opaque', () => {
    const feature = [
      'Feature: Draft response',
      '  Scenario: Return a draft',
      '    Then the response is:',
      '      ```text',
      '      Scenario: This is response text',
      '      Scenario Outline: So is this',
    ].join('\n');

    assert.deepEqual(findScenarioHeaderLines(feature), [1]);
  });

  it('requires exact VS Code folding-range starts', () => {
    const feature = [
      'Feature: Empty scenario',
      '  Rule: Drafts',
      '    Scenario: Empty',
      '    Scenario: Foldable',
      '      Given a step',
    ].join('\n');

    // The Rule is foldable at line 1, but the empty Scenario on line 2 is not.
    assert.deepEqual(
      findFoldableScenarioLines(feature, [{ start: 0 }, { start: 1 }, { start: 3 }]),
      [3],
    );
  });
});
