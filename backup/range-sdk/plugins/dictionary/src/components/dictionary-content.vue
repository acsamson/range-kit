<template>
  <div class="dictionary-content-wrapper">
    <!-- 头部 -->
    <div class="dictionary-header">
      <div class="dictionary-title-group">
        <h3 class="dictionary-title">{{ entry.word }}</h3>
        <!-- 别名标签 -->
        <div v-if="entry.alias_words && entry.alias_words.length > 0" class="alias-tags">
          <span v-for="alias in entry.alias_words" :key="alias" class="alias-tag">
            {{ alias }}
          </span>
        </div>
      </div>
    </div>

    <!-- 可滚动的主体区域 -->
    <div class="dictionary-body" @wheel.stop @touchmove.stop>
      <!-- 内容 -->
      <div class="definition-wrapper" :class="{ 'has-expand-button': showExpandButton }">
        <div class="dictionary-definition" :class="{ expanded: isExpanded }">
          <div v-html="entry.content" ref="contentDiv"></div>
        </div>
        <button v-if="showExpandButton" class="expand-btn" @click.stop="toggleExpand">
          <span>{{ isExpanded ? '收起' : '展开' }}</span>
          <component :is="isExpanded ? Up : Down" :size="14" />
        </button>
      </div>

      <!-- 图片 -->
      <div v-if="entry.image_links && entry.image_links.length > 0" class="dictionary-section">
        <div class="section-header">
          <h4 class="section-title">相关图片 ({{ entry.image_links.length }})</h4>
        </div>
        <div class="images-wrapper" :class="{ 'has-expand-button': showImagesExpandButton }">
          <div class="dictionary-images" :class="{ expanded: isImagesExpanded }">
            <div v-for="(image, index) in entry.image_links" :key="index" class="image-item">
              <img :src="image" :alt="`${entry.word}-${index}`" @click="$emit('clickImage', image, index)" />
            </div>
          </div>
          <button v-if="showImagesExpandButton" class="expand-btn" @click.stop="toggleImagesExpand">
            <span>{{ isImagesExpanded ? '收起' : '展开' }}</span>
            <component :is="isImagesExpanded ? Up : Down" :size="14" />
          </button>
        </div>
      </div>

      <!-- 标签 -->
      <div v-if="entry.tags && entry.tags.length > 0" class="dictionary-section">
        <div class="section-header">
          <h4 class="section-title">标签 ({{ entry.tags.length }})</h4>
        </div>
        <div class="tags-list">
          <span
            v-for="(tag, index) in entry.tags"
            :key="index"
            class="tag-item"
            @click="$emit('clickTag', tag)"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 负责人 -->
      <div v-if="entry.owners && entry.owners.length > 0" class="dictionary-section">
        <div class="section-header">
          <h4 class="section-title">相关联系人 ({{ entry.owners.length }})</h4>
        </div>
        <AdStaffLink multiple valueKey="username" :staff="owners" />
      </div>

      <!-- 飞书文档 -->
      <div v-if="entry.lark_doc_links && entry.lark_doc_links.length > 0" class="dictionary-section">
        <div class="section-header">
          <h4 class="section-title">相关链接 ({{ entry.lark_doc_links.length }})</h4>
        </div>
        <ol class="links-list">
          <li
            v-for="(doc, index) in entry.lark_doc_links"
            :key="index"
            class="link-item-wrapper"
          >
            <a
              :href="doc"
              class="link-item"
              :title="doc"
              @click.prevent="$emit('clickLarkDoc', doc)"
            >
              {{ doc }}
            </a>
          </li>
        </ol>
      </div>

      <!-- 外部链接 -->
      <div v-if="entry.web_links && entry.web_links.length > 0" class="dictionary-section">
        <div class="section-header">
          <h4 class="section-title">相关词条 ({{ entry.web_links.length }})</h4>
        </div>
        <ol class="links-list">
          <li
            v-for="(link, index) in entry.web_links"
            :key="index"
            class="link-item-wrapper"
          >
            <a
              :href="link"
              class="link-item"
              :title="link"
              @click.prevent="$emit('clickWebLink', link)"
            >
              {{ link }}
            </a>
          </li>
        </ol>
      </div>
    </div>

    <!-- 底部 -->
    <div class="dictionary-footer">
      <a href="/audit/dictionary" class="dict-link" @click.prevent="handleDictionaryClick">
        <BookOpen :size="16" />
        <span>词典</span>
      </a>
      <div class="footer-actions">
        <button ref="likeButtonRef" class="action-btn" @click="handleLike" :class="{ liked: isLiked }">
          <ThumbsUp :size="18" :fill="isLiked ? '#ff4d4f' : '#8f959e'" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { BookOpen, ThumbsUp, Down, Up } from '@icon-park/vue-next'
import { AdStaffLink } from '@ad-audit/orz-ui-next'
import confetti from 'canvas-confetti'
import type { WordData } from '../../bam-auto-generate/bes.fe.web_core/namespaces/dictionary'
import { sendTeaEvent } from '../tea'
import { TeaEventName } from '../tea/constants'

interface Props {
  entry: WordData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  clickTag: [tag: string]
  clickLarkDoc: [doc: string]
  clickWebLink: [link: string]
  clickImage: [url: string, index: number]
  like: [id: number]
}>()

// 展开/收起状态
const isExpanded = ref(false)
const showExpandButton = ref(false)
const contentDiv = ref<HTMLElement>()

// 图片展开/收起状态
const isImagesExpanded = ref(false)
const showImagesExpandButton = ref(false)

// 点赞状态
const isLiked = ref(false)
const hasLikedBefore = ref(false)
const likeButtonRef = ref<HTMLElement>()

// 切换展开/收起
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 切换图片展开/收起
const toggleImagesExpand = () => {
  isImagesExpanded.value = !isImagesExpanded.value
}

// 处理负责人
const owners = computed(() => {
  return props.entry?.owners?.map((email: string) => email.split('@')[0])
})

// 处理点赞
const handleLike = () => {
  const wasLiked = isLiked.value
  isLiked.value = !isLiked.value

  // 发送点赞埋点
  sendTeaEvent(TeaEventName.DICTIONARY_CARD_LIKE, {
    section: {
      word: props.entry?.word,
      wordId: props.entry?.id
    },
    data: {
      word: props.entry?.word,
      word_id: props.entry?.id,
      is_like: isLiked.value,
      action: isLiked.value ? 'like' : 'unlike',
      has_content: !!props.entry?.content,
      has_images: !!(props.entry?.image_links && props.entry.image_links.length > 0),
      has_tags: !!(props.entry?.tags && props.entry.tags.length > 0),
      has_owners: !!(props.entry?.owners && props.entry.owners.length > 0),
      has_links: !!(props.entry?.lark_doc_links && props.entry.lark_doc_links.length > 0)
    }
  })

  if (isLiked.value && likeButtonRef.value) {
    const rect = likeButtonRef.value.getBoundingClientRect()
    const x = (rect.left + rect.width / 2) / window.innerWidth
    const y = (rect.top + rect.height / 2) / window.innerHeight

    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '2000'
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true
    })
    
    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { x, y },
      colors: ['#ff4d4f', '#ff7875', '#ffa39e', '#ffccc7', '#ffe7e7']
    })

    setTimeout(() => {
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
    }, 3000)
  }

  if (!hasLikedBefore.value && isLiked.value) {
    hasLikedBefore.value = true
    emit('like', props.entry?.id || 0)
  }
}

// 处理词典链接点击
const handleDictionaryClick = () => {
  // 暂时屏蔽跳转
}

// 检查内容是否需要展开按钮
const checkExpandButton = () => {
  nextTick(() => {
    if (contentDiv.value && contentDiv.value.parentElement) {
      const contentHeight = contentDiv.value.scrollHeight
      showExpandButton.value = contentHeight > 140
    }
  })
}

// 检查图片是否需要展开按钮
const checkImagesExpandButton = () => {
  nextTick(() => {
    if (props.entry?.image_links) {
      showImagesExpandButton.value = props.entry.image_links.length > 3
    }
  })
}

// 监听entry变化
watch(() => props.entry, () => {
  isExpanded.value = false
  isImagesExpanded.value = false
  isLiked.value = false
  hasLikedBefore.value = false
  checkExpandButton()
  checkImagesExpandButton()
}, { immediate: true })

onMounted(() => {
  checkExpandButton()
  checkImagesExpandButton()
})
</script>

<style lang="scss" scoped>
@use './dictionary-card.scss';
</style>