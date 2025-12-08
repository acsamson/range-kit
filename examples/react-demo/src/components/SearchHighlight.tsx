import { useState, useCallback, useMemo, useEffect, type FC } from 'react'
import type { SelectionTypeConfig } from 'range-kit-react'
import type { TranslationMessages, Locale } from '../../../common/i18n'
import { messages } from '../../../common/i18n'

interface SearchResultItem {
  keyword: string
  matchCount: number
  type?: string
}

interface TypeConfig {
  type: string
  label: string
  style?: {
    backgroundColor?: string
    textDecorationColor?: string
  }
}

interface DictionaryConfig {
  enabled: boolean
  triggerAction: 'hover' | 'click' | 'dblclick' | 'contextmenu'
  title: string
  contentTemplate: string
  showKeyword: boolean
}

interface SearchHighlightProps {
  isInitialized: boolean
  keywords: string[]
  keywordResults: SearchResultItem[]
  availableTypes: SelectionTypeConfig[]
  getTypeConfig: (type: string) => TypeConfig | undefined
  locale: Locale
  onAddKeyword: (keyword: string, type: string, options: { caseSensitive: boolean; wholeWord: boolean; skipOverlap: boolean }) => void
  onRemoveKeyword: (keyword: string) => void
  onClearAll: () => void
  onDictionaryConfigChange?: (config: DictionaryConfig) => void
}

export const SearchHighlight: FC<SearchHighlightProps> = ({
  isInitialized,
  keywords,
  keywordResults,
  availableTypes,
  getTypeConfig,
  locale,
  onAddKeyword,
  onRemoveKeyword,
  onClearAll,
  onDictionaryConfigChange
}) => {
  const t = useMemo<TranslationMessages>(() => messages[locale], [locale])

  const [inputValue, setInputValue] = useState('')
  const [selectedType, setSelectedType] = useState('search')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [skipOverlap, setSkipOverlap] = useState(false)

  // Dictionary Configuration
  const [showDictionaryConfig, setShowDictionaryConfig] = useState(false)
  const [dictionaryCardEnabled, setDictionaryCardEnabled] = useState(true) // Default to true
  const [dictionaryTriggerAction, setDictionaryTriggerAction] = useState<'hover' | 'click' | 'dblclick' | 'contextmenu'>('hover')
  const [dictionaryCardTitle, setDictionaryCardTitle] = useState('词典释义')
  const [dictionaryCardContent, setDictionaryCardContent] = useState('"{{keyword}}" 的释义将显示在这里')
  const [showKeywordInCard, setShowKeywordInCard] = useState(true)

  // Notify parent of dictionary config changes
  useEffect(() => {
    onDictionaryConfigChange?.({
      enabled: dictionaryCardEnabled,
      triggerAction: dictionaryTriggerAction,
      title: dictionaryCardTitle,
      contentTemplate: dictionaryCardContent,
      showKeyword: showKeywordInCard
    })
  }, [
    dictionaryCardEnabled, 
    dictionaryTriggerAction, 
    dictionaryCardTitle, 
    dictionaryCardContent, 
    showKeywordInCard, 
    onDictionaryConfigChange
  ])

  // Initialize selected type
  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.some(t => t.type === selectedType)) {
      setSelectedType(availableTypes[0].type)
    }
  }, [availableTypes, selectedType])

  const currentTypeColor = useMemo(() => {
    const config = getTypeConfig(selectedType)
    return config?.style?.backgroundColor || config?.style?.textDecorationColor || '#2196f3'
  }, [selectedType, getTypeConfig])

  const getTypeColorByKeyword = useCallback((keyword: string): string => {
    const result = keywordResults.find(r => r.keyword === keyword)
    if (result?.type) {
      const config = getTypeConfig(result.type)
      return config?.style?.backgroundColor || config?.style?.textDecorationColor || '#2196f3'
    }
    return '#2196f3'
  }, [keywordResults, getTypeConfig])

  const getTagStyle = useCallback((item: SearchResultItem) => {
    if (item.matchCount > 0 && item.type) {
      const config = getTypeConfig(item.type)
      if (config?.style?.backgroundColor) {
        return {
          backgroundColor: config.style.backgroundColor + '40',
          borderColor: config.style.backgroundColor
        }
      }
    }
    return {}
  }, [getTypeConfig])

  const handleAddKeyword = useCallback(() => {
    const keyword = inputValue.trim()
    if (!keyword) return

    if (keywords.includes(keyword)) {
      setInputValue('')
      return
    }

    onAddKeyword(keyword, selectedType, { caseSensitive, wholeWord, skipOverlap })
    setInputValue('')
  }, [inputValue, keywords, selectedType, caseSensitive, wholeWord, skipOverlap, onAddKeyword])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddKeyword()
    }
  }, [handleAddKeyword])

  return (
    <section className="search-filter-bar">
      {/* Search Input */}
      <div className="filter-input-group">
        <span className="filter-icon">🔍</span>
        <input
          type="text"
          className="filter-input"
          placeholder={t.searchHighlight.placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isInitialized}
        />
        <button
          className="filter-add-btn"
          onClick={handleAddKeyword}
          disabled={!isInitialized || !inputValue.trim()}
          title={t.searchHighlight.addKeyword}
        >
          +
        </button>
      </div>

      {/* Dictionary Card Config */}
      <div className="dictionary-config-inline">
        <label className="config-toggle-inline">
          <input
            type="checkbox"
            checked={dictionaryCardEnabled}
            onChange={(e) => setDictionaryCardEnabled(e.target.checked)}
          />
          <span>{t.searchHighlight.dictionaryCard}</span>
        </label>
        <select
          value={dictionaryTriggerAction}
          onChange={(e) => setDictionaryTriggerAction(e.target.value as any)}
          className="config-select-inline"
          disabled={!dictionaryCardEnabled}
        >
          <option value="hover">{t.interactionModes.hover}</option>
          <option value="click">{t.interactionModes.click}</option>
          <option value="dblclick">{t.interactionModes.dblclick}</option>
          <option value="contextmenu">{t.interactionModes.contextmenu}</option>
        </select>
        <button
          className={`config-expand-btn ${showDictionaryConfig ? 'active' : ''}`}
          onClick={() => setShowDictionaryConfig(!showDictionaryConfig)}
          disabled={!dictionaryCardEnabled}
          title={t.searchHighlight.expandConfig}
        >
          ⚙️
        </button>
      </div>

      {/* Dictionary Card Detailed Config */}
      {showDictionaryConfig && dictionaryCardEnabled && (
        <div className="dictionary-config-panel">
          <div className="config-item">
            <label className="config-label">{t.searchHighlight.cardTitle}</label>
            <input
              type="text"
              value={dictionaryCardTitle}
              onChange={(e) => setDictionaryCardTitle(e.target.value)}
              className="config-input"
            />
          </div>

          <div className="config-item config-item-vertical">
            <label className="config-label">{t.searchHighlight.contentTemplate}</label>
            <textarea
              value={dictionaryCardContent}
              onChange={(e) => setDictionaryCardContent(e.target.value)}
              className="config-textarea"
              placeholder={t.searchHighlight.contentPlaceholder}
              rows={2}
            />
          </div>

          <label className="config-checkbox-label">
            <input
              type="checkbox"
              checked={showKeywordInCard}
              onChange={(e) => setShowKeywordInCard(e.target.checked)}
            />
            <span>{t.searchHighlight.showKeywordInCard}</span>
          </label>
        </div>
      )}

      {/* Type Selector */}
      {availableTypes.length > 0 && (
        <div className="filter-type-selector">
          <select
            className="type-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={!isInitialized}
          >
            {availableTypes.map((typeConfig) => (
              <option key={typeConfig.type} value={typeConfig.type}>
                {typeConfig.label}
              </option>
            ))}
          </select>
          <span
            className="type-color-dot"
            style={{ backgroundColor: currentTypeColor }}
          />
        </div>
      )}

      {/* Search Options */}
      <div className="filter-options">
        <label className="filter-option">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          <span>{t.searchHighlight.caseSensitive}</span>
        </label>
        <label className="filter-option">
          <input
            type="checkbox"
            checked={wholeWord}
            onChange={(e) => setWholeWord(e.target.checked)}
          />
          <span>{t.searchHighlight.wholeWord}</span>
        </label>
        <label className="filter-option" title={t.searchHighlight.skipOverlap}>
          <input
            type="checkbox"
            checked={skipOverlap}
            onChange={(e) => setSkipOverlap(e.target.checked)}
          />
          <span>{t.searchHighlight.skipOverlap}</span>
        </label>
      </div>

      {/* Keyword Tags */}
      {keywords.length > 0 && (
        <div className="filter-tags">
          {keywordResults.map((item) => (
            <div
              key={item.keyword}
              className={`filter-tag ${item.matchCount > 0 ? 'has-matches' : ''}`}
              style={getTagStyle(item)}
            >
              <span
                className="tag-type-dot"
                style={{ backgroundColor: getTypeColorByKeyword(item.keyword) }}
              />
              <span className="tag-text">{item.keyword}</span>
              {item.matchCount > 0 && (
                <span className="tag-count">{item.matchCount}</span>
              )}
              <button
                className="tag-remove"
                onClick={() => onRemoveKeyword(item.keyword)}
                title={t.searchHighlight.remove}
              >
                ×
              </button>
            </div>
          ))}

          <button
            className="filter-clear-btn"
            onClick={onClearAll}
            title={t.common.clearAll}
          >
            {t.common.clear}
          </button>
        </div>
      )}
    </section>
  )
}