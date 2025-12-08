import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  useSelectionRestore,
  useSearchHighlight,
  SelectionPopover
} from 'range-kit-react'
import 'range-kit-react/styles'
import { useI18n, initI18n } from './hooks/use-i18n'
import { usePopover } from './hooks/use-popover'
import { useSelectionActions } from './hooks/use-selection-actions'
import { useSearchActions } from './hooks/use-search-actions'
import { useSelectionCallbacks } from './hooks/use-selection-callbacks'
import { getDefaultSelectionTypes, getUserSelectionTypes } from './constants'
import { mockSelections } from './services/mock'
import { SearchHighlight } from './components/SearchHighlight'
import { PopoverContent } from './components/PopoverContent'
import { ControlPanel } from './components/ControlPanel'
import './App.css'

// Initialize i18n with default locale (English)
initI18n('en')

const ARTICLE_CONTENT = `
<article class="article-content">
  <h1 style="text-align: center; margin-bottom: 10px;">出师表</h1>
  <h3 style="text-align: center; margin-bottom: 20px; color: #666;">诸葛亮</h3>
  <p>先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。</p>
  <p>宫中府中，俱为一体，陟罚臧否，不宜异同。若有作奸犯科及为忠善者，宜付有司论其刑赏，以昭陛下平明之理，不宜偏私，使内外异法也。</p>
  <p>侍中、侍郎郭攸之、费祎、董允等，此皆良实，志虑忠纯，是以先帝简拔以遗陛下。愚以为宫中之事，事无大小，悉以咨之，然后施行，必能裨补阙漏，有所广益。</p>
  <p>将军向宠，性行淑均，晓畅军事，试用于昔日，先帝称之曰能，是以众议举宠为督。愚以为营中之事，悉以咨之，必能使行阵和睦，优劣得所。</p>
  <p>亲贤臣，远小人，此先汉所以兴隆也；亲小人，远贤臣，此后汉所以倾颓也。先帝在时，每与臣论此事，未尝不叹息痛恨于桓、灵也。侍中、尚书、长史、参军，此悉贞良死节之臣，愿陛下亲之信之，则汉室之隆，可计日而待也。</p>
  <p>臣本布衣，躬耕于南阳，苟全性命于乱世，不求闻达于诸侯。先帝不以臣卑鄙，猥自枉屈，三顾臣于草庐之中，咨臣以当世之事，由是感激，遂许先帝以驱驰。后值倾覆，受任于败军之际，奉命于危难之间，尔来二十有一年矣。</p>
  <p>先帝知臣谨慎，故临崩寄臣以大事也。受命以来，夙夜忧叹，恐托付不效，以伤先帝之明，故五月渡泸，深入不毛。今南方已定，兵甲已足，当奖率三军，北定中原，庶竭驽钝，攘除奸凶，兴复汉室，还于旧都。此臣所以报先帝而忠陛下之职分也。至于斟酌损益，进尽忠言，则攸之、祎、允之任也。</p>
  <p>愿陛下托臣以讨贼兴复之效，不效，则治臣之罪，以告先帝之灵。若无兴德之言，则责攸之、祎、允等之慢，以彰其咎；陛下亦宜自谋，以咨诹善道，察纳雅言，深追先帝遗诏，臣不胜受恩感激。</p>
  <p>今当远离，临表涕零，不知所言。</p>
</article>

<article class="article-content" style="margin-top: 40px;">
  <h1 style="text-align: center; margin-bottom: 10px;">Memorial on Dispatching the Troops</h1>
  <h3 style="text-align: center; margin-bottom: 20px; color: #666;">Zhuge Liang</h3>
  <p>The late Emperor passed away before his work of founding the state was half completed. Now the empire is divided into three parts, and our state of Yizhou is exhausted and weak. This is truly a critical moment of life or death. Yet the officials at court work tirelessly, and the loyal soldiers sacrifice themselves abroad, for they remember the special treatment the late Emperor bestowed upon them and wish to repay His Majesty. Your Majesty should indeed open your ears to advice, to honor the late Emperor's legacy and inspire the spirit of loyal men. You should not belittle yourself, use improper analogies, or block the path of loyal remonstrance.</p>
  <p>The Palace and the Prime Minister's Office are one body. Rewards and punishments should not differ between them. If anyone does evil or good, they should be handed to the proper officials for judgment, to demonstrate Your Majesty's fair and enlightened governance. There should be no favoritism that would cause different laws inside and outside the court.</p>
  <p>The Palace Attendants Guo Youzhi, Fei Yi, and Dong Yun are all trustworthy and loyal. Therefore, the late Emperor selected them to serve Your Majesty. In my humble opinion, all matters in the palace, great or small, should be discussed with them before taking action. This will surely help cover any gaps and produce great benefit.</p>
  <p>General Xiang Chong is fair and capable, well-versed in military affairs. When the late Emperor tested him, he praised him as able. Therefore, the council recommended him as commander. In my humble opinion, all military matters should be discussed with him. This will surely bring harmony to the ranks and ensure everyone finds their proper place.</p>
  <p>Being close to worthy ministers and keeping away from petty men - this is why the Former Han flourished. Being close to petty men and keeping away from worthy ministers - this is why the Later Han declined. When the late Emperor was alive, whenever he discussed this with me, he never failed to sigh with regret over Emperors Huan and Ling. The Palace Attendants, Secretaries, Chief Clerks, and Military Advisors are all loyal and devoted ministers. I hope Your Majesty will trust them closely. Then the revival of the Han dynasty can be expected in due time.</p>
  <p>I was originally a commoner, farming in Nanyang, merely trying to survive in this chaotic age, not seeking fame among the lords. The late Emperor did not consider me lowly. He condescended to visit my thatched cottage three times to consult me on the affairs of the age. I was deeply moved and promised to serve him. Later, when disaster struck, I was entrusted with duty amid defeat and received orders in times of crisis. It has been twenty-one years since then.</p>
  <p>The late Emperor knew I was cautious, so on his deathbed he entrusted me with this great task. Since receiving this charge, I have worried day and night, fearing I might fail and damage the late Emperor's wisdom. Therefore, in the fifth month, I crossed the Lu River and ventured deep into barren lands. Now the south is pacified and our army is ready. I should lead the three armies north to pacify the Central Plains, exhaust my humble abilities, eliminate treacherous villains, restore the Han dynasty, and return to the old capital. This is how I repay the late Emperor and fulfill my duty to Your Majesty. As for weighing gains and losses and offering loyal advice, that is the responsibility of Youzhi, Yi, and Yun.</p>
  <p>I hope Your Majesty will entrust me with the task of punishing the traitors and restoring our state. If I fail, punish my crime to appease the late Emperor's spirit. If there is no virtuous advice, blame Youzhi, Yi, Yun, and the others, and make their faults clear. Your Majesty should also plan carefully, seeking good counsel, examining and accepting elegant words, and deeply honoring the late Emperor's last edict. I am overwhelmed with gratitude.</p>
  <p>Now as I depart on this distant journey, tears fall as I write this memorial, and I know not what I have said.</p>
</article>
`

function App() {
  const { locale, t, toggleLocale } = useI18n()
  const popover = usePopover()
  
  const [selectedType, setSelectedType] = useState('important')
  const [interactionMode, setInteractionMode] = useState('click')
  
  // Dictionary Configuration State
  const [dictionaryConfig, setDictionaryConfig] = useState({
    enabled: true,
    triggerAction: 'hover' as 'hover' | 'click' | 'dblclick' | 'contextmenu',
    title: '词典释义',
    contentTemplate: '"{{keyword}}" 的释义将显示在这里',
    showKeyword: true
  })

  // Compute selection types based on current locale
  const DEFAULT_SELECTION_TYPES = useMemo(() => getDefaultSelectionTypes(locale), [locale])
  const USER_SELECTION_TYPES = useMemo(() => getUserSelectionTypes(locale), [locale])

  // Refs for circular dependencies
  const refs = useRef({
    getInstance: (() => null) as () => any,
  })

  const onSearchHighlightInteractionRef = useRef<any>(null)
  
  const stableOnSearchHighlightInteraction = useCallback((event: any) => {
    onSearchHighlightInteractionRef.current?.(event)
  }, [])

  // 1. Initialize Search Highlight with stable callback
  const {
    searchKeywords,
    searchResults,
    addSearchKeyword,
    removeSearchKeyword,
    clearSearchHighlights
  } = useSearchHighlight({
    getInstance: () => refs.current.getInstance(),
    containers: ['#demo-content'],
    selectionStyles: DEFAULT_SELECTION_TYPES,
    onSearchHighlightInteraction: stableOnSearchHighlightInteraction
  })

  // 2. Initialize Callbacks with searchResults
  const callbacks = useSelectionCallbacks({
    popover,
    getInstance: () => refs.current.getInstance(),
    searchResults,
    interactionMode,
    dictionaryCardConfig: dictionaryConfig
  })

  // Update the ref for search interaction
  useEffect(() => {
    onSearchHighlightInteractionRef.current = callbacks.onSearchHighlightInteraction
  }, [callbacks.onSearchHighlightInteraction])

  // 3. Initialize Selection Restore
  const {
    saveCurrentSelection,
    restoreSelections,
    currentSelections,
    clearAllSelections,
    deleteSelection,
    clearAllSelectionsData,
    isInitialized,
    getInstance,
    navigation,
    getTypeConfig
  } = useSelectionRestore({
    rootNodeId: 'demo-content',
    selectionStyles: DEFAULT_SELECTION_TYPES,
    onSelectionAction: callbacks.onSelectionAction,
    onSelectionSaved: () => {
      popover.hidePopover()
    }
  })

  // Update Instance ref
  useEffect(() => {
    refs.current.getInstance = getInstance
  }, [getInstance])

  // Selection Actions
  const selectionActions = useSelectionActions({
    popover,
    selectedSelectionType: selectedType,
    currentSelections,
    getTypeConfig,
    saveCurrentSelection,
    restoreSelections,
    clearAllSelections,
    deleteSelection,
    clearAllSelectionsData
  })

  // Search Actions
  const searchActions = useSearchActions({
    addSearchKeyword,
    removeSearchKeyword,
    clearSearchHighlights
  })

  // Load mock data
  const handleLoadMockData = useCallback(async () => {
    for (let i = 0; i < mockSelections.length; i++) {
      const selectionsToShow = mockSelections.slice(0, i + 1)
      await restoreSelections(selectionsToShow, true)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }, [restoreSelections])

  // Handle Dictionary Config Change
  const handleDictionaryConfigChange = useCallback((config: typeof dictionaryConfig) => {
    setDictionaryConfig(config)
  }, [])

  // Handle scroll to hide popover
  useEffect(() => {
    const handleScroll = () => {
      if (popover.visible) {
        popover.hidePopover()
      }
    }

    const container = document.getElementById('demo-content')
    container?.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container?.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [popover])

  return (
    <div className="react-demo">
      <header>
        <h1>React Range Kit Demo</h1>
        <div className="header-actions">
          <button className="btn btn-outline locale-toggle" onClick={toggleLocale}>
            {locale === 'en' ? '中文' : 'EN'}
          </button>
        </div>
      </header>

      <div className="layout-container">
        <aside className="sidebar">
          <ControlPanel
            isInitialized={isInitialized}
            currentSelections={currentSelections}
            availableTypes={USER_SELECTION_TYPES}
            getTypeConfig={getTypeConfig}
            selectedSelectionType={selectedType}
            interactionMode={interactionMode}
            t={t}
            onLoadMockData={handleLoadMockData}
            onRestoreAllSelections={selectionActions.handleRestoreAllSelections}
            onClearHighlights={selectionActions.handleClearHighlights}
            onPrintData={selectionActions.handlePrintData}
            onSelectionTypeChange={setSelectedType}
            onInteractionModeChange={setInteractionMode}
          />
        </aside>

        <main className="main-content">
          <div className="main-panel-controls combined-controls">
            <div className="control-group search-nav-group">
              <div className="search-section">
                <SearchHighlight
                  isInitialized={isInitialized}
                  keywords={searchKeywords}
                  keywordResults={searchResults}
                  availableTypes={DEFAULT_SELECTION_TYPES}
                  getTypeConfig={getTypeConfig}
                  locale={locale}
                  onAddKeyword={searchActions.handleAddSearchKeyword}
                  onRemoveKeyword={searchActions.handleRemoveSearchKeyword}
                  onClearAll={searchActions.handleClearSearchKeywords}
                  onDictionaryConfigChange={handleDictionaryConfigChange}
                />
              </div>

              <div className="separator"></div>

              <div className="nav-section">
                <div className="nav-controls">
                  <button
                    className="btn btn-outline"
                    onClick={navigation.goToPrev}
                    disabled={navigation.total === 0}
                  >
                    {t.common.prev}
                  </button>
                  <span className="nav-info">
                    {navigation.currentIndex + 1} / {navigation.total}
                  </span>
                  <button
                    className="btn btn-outline"
                    onClick={navigation.goToNext}
                    disabled={navigation.total === 0}
                  >
                    {t.common.next}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            id="demo-content"
            className="demo-content"
            dangerouslySetInnerHTML={{ __html: ARTICLE_CONTENT }}
          />
        </main>
      </div>

      {/* Popover */}
      <SelectionPopover
        visible={popover.popoverVisible}
        data={popover.popoverData}
        onClose={popover.hidePopover}
      >
        <PopoverContent
          data={popover.popoverData}
          onSave={selectionActions.handleSaveItem}
          onDelete={selectionActions.handleDeleteItem}
        />
      </SelectionPopover>
    </div>
  )
}

export default App
