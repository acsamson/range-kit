<template>
  <section class="demo-text-section">
    <div class="demo-header">
      <h3 class="demo-title">演示文本区域</h3>
      <p class="demo-subtitle">在下方文本中选择任意内容，然后使用上方按钮进行选区管理操作</p>
    </div>

    <div
      class="demo-text-container"
      ref="demoTextRef"
      @mouseup="$emit('text-selection')"
    >
      <h1>出师表</h1>
      <p class="author">诸葛亮</p>
      <div class="text-content">
        <p>
          臣亮言：先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。
        </p>
        <p>
          宫中府中，俱为一体；陟罚臧否，不宜异同。若有作奸犯科及为忠善者，宜付有司论其刑赏，以昭陛下平明之理；不宜偏私，使内外异法也。
        </p>
        <p>
          侍中、侍郎郭攸之、费祎、董允等，此皆良实，志虑忠纯，是以先帝简拔以遗陛下：愚以为宫中之事，事无大小，悉以咨之，然后施行，必能裨补阙漏，有所广益。
        </p>
        <p>
          将军向宠，性行淑均，晓畅军事，试用于昔日，先帝称之曰"能"，是以众议举宠为督：愚以为营中之事，悉以咨之，必能使行阵和睦，优劣得所。
        </p>
        <p>
          亲贤臣，远小人，此先汉所以兴隆也；亲小人，远贤臣，此后汉所以倾颓也。先帝在时，每与臣论此事，未尝不叹息痛恨于桓、灵也。侍中、尚书、长史、参军，此悉贞良死节之臣，愿陛下亲之、信之，则汉室之隆，可计日而待也。
        </p>
        <p>
          臣本布衣，躬耕于南阳，苟全性命于乱世，不求闻达于诸侯。先帝不以臣卑鄙，猥自枉屈，三顾臣于草庐之中，咨臣以当世之事，由是感激，遂许先帝以驱驰。后值倾覆，受任于败军之际，奉命于危难之间，尔来二十有一年矣。
        </p>
        <p>
          先帝知臣谨慎，故临崩寄臣以大事也。受命以来，夙夜忧叹，恐托付不效，以伤先帝之明；故五月渡泸，深入不毛。今南方已定，兵甲已足，当奖率三军，北定中原，庶竭驽钝，攘除奸凶，兴复汉室，还于旧都。此臣所以报先帝而忠陛下之职分也。至于斟酌损益，进尽忠言，则攸之、祎、允之任也。
        </p>
        <p>
          愿陛下托臣以讨贼兴复之效，不效，则治臣之罪，以告先帝之灵。若无兴德之言，则责攸之、祎、允等之慢，以彰其咎；陛下亦宜自谋，以咨诹善道，察纳雅言，深追先帝遗诏。臣不胜受恩感激。
        </p>
        <p>
          今当远离，临表涕零，不知所言。
        </p>
      </div>

      <!-- 多媒体展示区域 -->
      <div class="media-section">
        <h2>多媒体内容展示</h2>
        <p class="media-description">以下是图片和视频内容，可以测试在多媒体周围进行选区操作。</p>

        <!-- 图片展示 -->
        <div class="media-item">
          <h3>图片展示</h3>
          <p>这是一张示例图片，你可以选择图片周围的文字进行选区测试。</p>
          <figure class="image-wrapper">
            <img
              src="https://tosv.byted.org/obj/bes-fe/pms/kunkun.png"
              alt="示例图片"
              class="demo-image"
            />
            <figcaption>图片说明：示例图片展示</figcaption>
          </figure>
          <p>图片上方和下方的文字都可以被选中并创建选区。</p>
        </div>

        <!-- 视频展示 -->
        <div class="media-item">
          <h3>视频展示</h3>
          <p>这是一段示例视频，你可以选择视频周围的文字进行选区测试。</p>
          <figure class="video-wrapper">
            <video
              src="https://tosv.byted.org/obj/bes-fe/pms/kunkun.mp4"
              controls
              class="demo-video"
            >
              您的浏览器不支持视频播放。
            </video>
            <figcaption>视频说明：示例视频展示</figcaption>
          </figure>
          <p>视频上方和下方的文字都可以被选中并创建选区。</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

// 演示文本容器引用
const demoTextRef = ref(null)

// 定义事件
defineEmits(['text-selection'])

// 暴露引用给父组件
defineExpose({
  demoTextRef
})
</script>