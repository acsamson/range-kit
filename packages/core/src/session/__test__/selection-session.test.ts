/**
 * SelectionSession 测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SelectionSession } from '../selection-session';
import type { Highlighter, SelectionRestoreOptions, SerializedSelection } from '../../types';
import { createDefaultRestoreData } from '../../locator/__test__/test-helpers';

describe('SelectionSession', () => {
  let manager: SelectionSession;
  let mockHighlighter: Highlighter;
  let mockOptions: Required<SelectionRestoreOptions>;

  beforeEach(() => {
    vi.useFakeTimers();

    mockHighlighter = createMockHighlighter();
    mockOptions = createMockOptions();

    manager = new SelectionSession(mockHighlighter, mockOptions);
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize correctly', () => {
      expect(manager).toBeDefined();
      expect(manager.highlighter).toBe(mockHighlighter);
    });

    it('should register types from options', () => {
      const optionsWithTypes = createMockOptions({
        selectionStyles: [
          { type: 'custom', label: 'Custom Type', style: { backgroundColor: 'red' } },
        ],
      });

      const managerWithTypes = new SelectionSession(mockHighlighter, optionsWithTypes);

      const typeConfig = managerWithTypes.getRegisteredType('custom');
      expect(typeConfig).toBeDefined();
      expect(typeConfig?.label).toBe('Custom Type');

      managerWithTypes.destroy();
    });
  });

  describe('addSelection', () => {
    it('should add a selection instance', () => {
      const selectionData = createMockSelectionData('test-id', 'test text');

      const instance = manager.addSelection(selectionData);

      expect(instance).toBeDefined();
      expect(instance.id).toBe('test-id');
      expect(manager.getSelection('test-id')).toBe(instance);
    });

    it('should use default type if not specified', () => {
      const selectionData = createMockSelectionData('test-id', 'test text');
      delete (selectionData as Partial<SerializedSelection>).type;

      const instance = manager.addSelection(selectionData);

      expect(instance.type).toBe('default'); // default from selectionStyles[0]
    });

    it('should start monitoring if enabled', () => {
      const selectionData = createMockSelectionData('test-id', 'test text');

      manager.addSelection(selectionData);

      // Monitoring is handled internally, just verify no errors
      expect(manager.getSelection('test-id')).toBeDefined();
    });
  });

  describe('removeSelection', () => {
    it('should remove a selection instance', () => {
      const selectionData = createMockSelectionData('test-id', 'test text');
      manager.addSelection(selectionData);

      manager.removeSelection('test-id');

      expect(manager.getSelection('test-id')).toBeUndefined();
    });

    it('should clear highlight when removing', () => {
      const selectionData = createMockSelectionData('test-id', 'test text');
      manager.addSelection(selectionData);
      manager.selectionHighlights.set('test-id', 'highlight-123');

      manager.removeSelection('test-id');

      expect(mockHighlighter.clearHighlightById).toHaveBeenCalledWith('highlight-123');
    });

    it('should not throw when removing non-existent selection', () => {
      expect(() => manager.removeSelection('nonexistent')).not.toThrow();
    });
  });

  describe('getSelection / getAllSelections', () => {
    it('should get a specific selection', () => {
      const selectionData = createMockSelectionData('test-id', 'test text');
      const instance = manager.addSelection(selectionData);

      expect(manager.getSelection('test-id')).toBe(instance);
      expect(manager.getSelection('nonexistent')).toBeUndefined();
    });

    it('should get all selections', async () => {
      manager.addSelection(createMockSelectionData('id-1', 'text 1'));
      manager.addSelection(createMockSelectionData('id-2', 'text 2'));

      const all = await manager.getAllSelections();

      expect(all.length).toBe(2);
      expect(all.map(s => s.id)).toContain('id-1');
      expect(all.map(s => s.id)).toContain('id-2');
    });
  });

  describe('registerType / getRegisteredType / getAllRegisteredTypes', () => {
    it('should register a new type', () => {
      manager.registerType({
        type: 'highlight',
        label: 'Highlight',
        style: { backgroundColor: 'yellow' },
      });

      const config = manager.getRegisteredType('highlight');
      expect(config).toBeDefined();
      expect(config?.label).toBe('Highlight');
    });

    it('should merge type configurations', () => {
      manager.registerType({
        type: 'highlight',
        label: 'Highlight',
        style: { backgroundColor: 'yellow' },
      });

      manager.registerType({
        type: 'highlight',
        label: 'Updated Highlight',
        style: { borderBottom: '2px solid red' },
      });

      const config = manager.getRegisteredType('highlight');
      expect(config?.label).toBe('Updated Highlight');
      expect(config?.style?.backgroundColor).toBe('yellow');
      expect(config?.style?.borderBottom).toBe('2px solid red');
    });

    it('should get all registered types', () => {
      manager.registerType({ type: 'type1', label: 'Type 1' });
      manager.registerType({ type: 'type2', label: 'Type 2' });

      const allTypes = manager.getAllRegisteredTypes();

      expect(allTypes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getStyleForType', () => {
    it('should return registered type style', () => {
      manager.registerType({
        type: 'custom',
        label: 'Custom',
        style: { backgroundColor: 'blue' },
      });

      const style = manager.getStyleForType('custom');

      expect(style.backgroundColor).toBe('blue');
    });

    it('should return default style for unknown type', () => {
      const style = manager.getStyleForType('unknown');

      // 默认样式来自 selectionStyles[0].style
      const defaultStyle = mockOptions.selectionStyles?.[0]?.style || {};
      expect(style).toEqual(defaultStyle);
    });
  });

  describe('Range management', () => {
    it('should register and get active range', () => {
      const mockRange = createMockRange();

      manager.registerActiveRange('sel-1', mockRange);

      const retrieved = manager.getActiveRange('sel-1');
      expect(retrieved).toBeDefined();
    });

    it('should unregister active range', () => {
      const mockRange = createMockRange();
      manager.registerActiveRange('sel-1', mockRange);

      manager.unregisterActiveRange('sel-1');

      expect(manager.getActiveRange('sel-1')).toBeUndefined();
    });

    it('should get all active selection IDs', () => {
      const mockRange = createMockRange();
      manager.registerActiveRange('sel-1', mockRange);
      manager.registerActiveRange('sel-2', mockRange);

      const ids = manager.getAllActiveSelectionIds();

      expect(ids).toContain('sel-1');
      expect(ids).toContain('sel-2');
    });

    it('should clear all active ranges', () => {
      const mockRange = createMockRange();
      manager.registerActiveRange('sel-1', mockRange);
      manager.registerActiveRange('sel-2', mockRange);

      manager.clearAllActiveRanges();

      expect(manager.getAllActiveSelectionIds().length).toBe(0);
    });

    it('should trigger onActiveRangesChange callback', () => {
      const mockRange = createMockRange();

      manager.registerActiveRange('sel-1', mockRange);

      expect(mockOptions.onActiveRangesChange).toHaveBeenCalled();
    });
  });

  describe('setCustomIdConfig / getCustomIdConfig', () => {
    it('should set and get custom ID config', () => {
      manager.setCustomIdConfig('data-custom-id');

      const config = manager.getCustomIdConfig();

      expect(config.customIdAttribute).toBe('data-custom-id');
    });
  });

  describe('destroy', () => {
    it('should clean up all resources', () => {
      manager.addSelection(createMockSelectionData('id-1', 'text'));
      manager.registerActiveRange('id-1', createMockRange());

      manager.destroy();

      expect(manager.getSelection('id-1')).toBeUndefined();
      expect(manager.getAllActiveSelectionIds().length).toBe(0);
    });
  });
});

// ===== Helper functions =====

function createMockHighlighter(): Highlighter {
  return {
    highlight: vi.fn().mockReturnValue('highlight-id'),
    highlightWithType: vi.fn().mockReturnValue('highlight-id'),
    clearHighlight: vi.fn(),
    clearHighlightById: vi.fn(),
    registerTypeStyle: vi.fn(),
    getTypeStyle: vi.fn(),
  };
}

function createMockOptions(overrides: Partial<SelectionRestoreOptions> = {}): Required<SelectionRestoreOptions> {
  return {
    rootNodeId: 'test-container',
    selectionStyles: [
      { type: 'default', label: 'Default', style: { backgroundColor: 'rgba(255, 255, 0, 0.3)' } },
    ],
    onSelectionInteraction: vi.fn(),
    onSelectionBehavior: vi.fn(),
    onActiveRangesChange: vi.fn(),
    advanced: undefined,
    ...overrides,
  } as Required<SelectionRestoreOptions>;
}

function createMockSelectionData(id: string, text: string): SerializedSelection {
  return {
    id,
    text,
    type: 'default',
    restore: createDefaultRestoreData(),
  };
}

function createMockRange(): Range {
  const mockRect = new DOMRect(10, 10, 100, 20);
  const mockRectList = {
    length: 1,
    0: mockRect,
    item: (index: number) => (index === 0 ? mockRect : null),
    [Symbol.iterator]: function* () {
      yield mockRect;
    },
  } as unknown as DOMRectList;

  const mockRange = {
    getClientRects: () => mockRectList,
    getBoundingClientRect: () => mockRect,
    cloneRange: function() { return this; },
    startContainer: document.createTextNode('test'),
    endContainer: document.createTextNode('test'),
    startOffset: 0,
    endOffset: 4,
    collapsed: false,
    commonAncestorContainer: document.body,
    toString: () => 'test',
  } as unknown as Range;

  return mockRange;
}
