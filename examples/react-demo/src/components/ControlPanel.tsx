import React from 'react'
import type { SelectionTypeConfig } from 'range-kit-react'
import type { TranslationMessages } from '../../../common/i18n'
import './ControlPanel.css'

interface ControlPanelProps {
  isInitialized: boolean
  currentSelections: any[]
  availableTypes: SelectionTypeConfig[]
  getTypeConfig: (type: string) => SelectionTypeConfig | undefined
  selectedSelectionType: string
  interactionMode: string
  t: TranslationMessages
  onLoadMockData: () => void
  onRestoreAllSelections: () => void
  onClearHighlights: () => void
  onPrintData: () => void
  onSelectionTypeChange: (type: string) => void
  onInteractionModeChange: (mode: string) => void
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isInitialized,
  currentSelections,
  availableTypes,
  getTypeConfig,
  selectedSelectionType,
  interactionMode,
  t,
  onLoadMockData,
  onRestoreAllSelections,
  onClearHighlights,
  onPrintData,
  onSelectionTypeChange,
  onInteractionModeChange
}) => {
  return (
    <section className="control-panel">
      <div className="panel-header">
        <h2 className="panel-title">{t.controlPanel.title}</h2>
        <div className="selection-count">
          {t.controlPanel.savedSelections}: <span className="count-badge">{currentSelections.length}</span>
        </div>
      </div>

      <div className="control-grid">
        {/* Selection Type */}
        <div className="control-group">
          <h3 className="group-title">{t.controlPanel.selectionType}</h3>

          {/* Type Selector */}
          <div className="type-selector">
            <label className="type-label">{t.controlPanel.selectTypeHint}</label>
            <select 
              value={selectedSelectionType} 
              onChange={(e) => onSelectionTypeChange(e.target.value)}
              className="type-select"
            >
              {availableTypes.map(typeConfig => (
                <option key={typeConfig.type} value={typeConfig.type}>
                  {typeConfig.icon} {typeConfig.label}
                </option>
              ))}
            </select>
            <div className={`type-preview type-${selectedSelectionType}`}>
              {getTypeConfig(selectedSelectionType)?.description || t.controlPanel.defaultStylePreview}
            </div>
          </div>
        </div>

        {/* Interaction Mode */}
        <div className="control-group">
          <h3 className="group-title">{t.controlPanel.interactionMode}</h3>
          <div className="interaction-selector">
            <label className="type-label">{t.controlPanel.triggerActionHint}</label>
            <select 
              value={interactionMode} 
              onChange={(e) => onInteractionModeChange(e.target.value)}
              className="type-select"
            >
              <option value="click">{t.interactionModes.click}</option>
              <option value="hover">{t.interactionModes.hover}</option>
              <option value="dblclick">{t.interactionModes.dblclick}</option>
              <option value="contextmenu">{t.interactionModes.contextmenu}</option>
            </select>
          </div>
        </div>

        {/* Batch Operations */}
        <div className="control-group">
          <h3 className="group-title">{t.controlPanel.batchOperations}</h3>
          <div className="button-group">
            <button
              onClick={onLoadMockData}
              disabled={!isInitialized}
              className="btn btn-primary"
            >
              <span className="btn-icon">📥</span>
              {t.controlPanel.loadPresetData}
            </button>
            <button
              onClick={onRestoreAllSelections}
              disabled={!isInitialized || currentSelections.length === 0}
              className="btn btn-success"
            >
              <span className="btn-icon">🔄</span>
              {t.controlPanel.restoreAllSelections}
            </button>
            <button
              onClick={onClearHighlights}
              disabled={!isInitialized}
              className="btn btn-outline"
            >
              <span className="btn-icon">🧹</span>
              {t.controlPanel.clearAllHighlights}
            </button>
            <button
              onClick={onPrintData}
              disabled={!isInitialized || currentSelections.length === 0}
              className="btn btn-outline"
            >
              <span className="btn-icon">🖨️</span>
              {t.controlPanel.printData}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
