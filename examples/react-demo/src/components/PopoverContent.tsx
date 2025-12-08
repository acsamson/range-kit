import React, { useMemo } from 'react'
import type { PopoverData, PopoverItem } from 'range-kit-react'
import { useI18n } from '../hooks/use-i18n'

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const SaveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
)

interface PopoverContentProps {
  data: PopoverData
  onSave: (item: PopoverItem) => void
  onDelete: (item: PopoverItem) => void
}

export const PopoverContent: React.FC<PopoverContentProps> = ({
  data,
  onSave,
  onDelete
}) => {
  const { t } = useI18n()
  
  const hasDictionaryContent = useMemo(() => {
    return !!data?.dictionaryConfig &&
      data.items.some(item => item.itemType === 'search')
  }, [data])

  const searchKeyword = useMemo(() => {
    const searchItem = data?.items.find(item => item.itemType === 'search')
    return searchItem?.text || ''
  }, [data?.items])

  const renderedDictionaryContent = useMemo(() => {
    const template = data?.dictionaryConfig?.contentTemplate || ''
    const keyword = searchKeyword
    return template.replace(/\{\{keyword\}\}/g, keyword)
  }, [data?.dictionaryConfig?.contentTemplate, searchKeyword])

  const headerTitle = useMemo(() => {
    const items = data?.items || []
    const savedCount = items.filter(i => i.itemType === 'saved').length
    const searchCount = items.filter(i => i.itemType === 'search').length
    const newCount = items.filter(i => i.itemType === 'new').length

    if (items.length === 1) {
      if (savedCount === 1) return t.popover.selectionActions
      if (searchCount === 1) return t.popover.searchResults
      if (newCount === 1) return t.popover.newSelection
    }

    const parts: string[] = []
    if (savedCount > 0) parts.push(`${savedCount} ${t.popover.selections}`)
    if (searchCount > 0) parts.push(`${searchCount} ${t.popover.searches}`)
    if (newCount > 0) parts.push(`${newCount} ${t.popover.newSelections}`)

    return parts.join(' + ') || t.popover.selectionActions
  }, [data?.items, t])

  const getTypeLabel = (item: PopoverItem): string => {
    switch (item.itemType) {
      case 'saved':
        return t.popover.saved
      case 'search':
        return t.popover.search
      case 'new':
        return t.popover.new
      default:
        return ''
    }
  }

  const truncateText = (text: string | undefined, maxLen: number): string => {
    if (!text) return ''
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
  }

  return (
    <>
      {hasDictionaryContent && (
        <div className="rk-dictionary-card">
          <div className="rk-dictionary-header">
            <span className="rk-dictionary-title">{data?.dictionaryConfig?.title || '词典释义'}</span>
          </div>
          <div className="rk-dictionary-body">
            {data?.dictionaryConfig?.showKeyword && (
              <div className="rk-dictionary-keyword">{searchKeyword}</div>
            )}
            <div className="rk-dictionary-content">{renderedDictionaryContent}</div>
          </div>
        </div>
      )}

      <div className="rk-selection-list">
        <div className="rk-list-header">
          <span className="rk-header-title">{headerTitle}</span>
        </div>
        <div className="rk-list-content">
          {(data?.items || []).map((item: PopoverItem) => (
            <div
              key={item.id}
              className={`rk-selection-item rk-item-${item.itemType}`}
            >
              <span className={`rk-item-type-badge rk-badge-${item.itemType}`}>
                {getTypeLabel(item)}
              </span>
              <span className="rk-item-text" title={item.text}>
                {truncateText(item.text, 20)}
              </span>
              <div className="rk-item-actions">
                {item.itemType === 'saved' && (
                  <button
                    className="rk-action-btn rk-delete-btn"
                    onClick={() => onDelete(item)}
                    title="删除选区"
                  >
                    <DeleteIcon />
                  </button>
                )}
                {(item.itemType === 'search' || item.itemType === 'new') && (
                  <button
                    className="rk-action-btn rk-save-btn"
                    onClick={() => onSave(item)}
                    title="保存为选区"
                  >
                    <SaveIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
