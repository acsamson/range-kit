<template>
  <div class="playground-home">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <h1 class="brand-title">RangeSDK Playground</h1>
          <span class="brand-subtitle">企业级选区管理解决方案</span>
        </div>
        <a href="/range-sdk/" class="back-link">
          ← 返回文档
        </a>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <div class="content-container">
        <!-- 介绍区域 -->
        <section class="hero-section">
          <div class="hero-content">
            <h2 class="hero-title">交互式演示环境</h2>
            <p class="hero-description">
              在真实场景中体验和测试 RangeSDK 的强大功能，验证选区持久性和多层级恢复算法的稳定性与精确性。
            </p>
          </div>
        </section>

        <!-- 功能模块 -->
        <section class="modules-section">
          <div class="modules-grid">

            <div class="module-card" @click="navigateToModule('./selection')">
              <div class="module-icon">🎯</div>
              <div class="module-content">
                <h3 class="module-title">选区管理演示</h3>
                <p class="module-description">核心选区管理功能展示，包括选区序列化、恢复、批量操作和事件处理</p>
                <div class="module-features">
                  <span class="feature-tag">选区序列化</span>
                  <span class="feature-tag">多层级恢复</span>
                  <span class="feature-tag">批量操作</span>
                  <span class="feature-tag">事件回调</span>
                </div>
              </div>
              <div class="module-arrow">→</div>
            </div>

            <div class="module-card" @click="navigateToModule('./dictionary')">
              <div class="module-icon">📚</div>
              <div class="module-content">
                <h3 class="module-title">词典功能演示</h3>
                <p class="module-description">文本搜索高亮和词典标记功能，支持交互式词典条目浏览</p>
                <div class="module-features">
                  <span class="feature-tag">文本搜索</span>
                  <span class="feature-tag">高亮显示</span>
                  <span class="feature-tag">交互事件</span>
                  <span class="feature-tag">历史记录</span>
                </div>
              </div>
              <div class="module-arrow">→</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
const navigateToModule = (path) => {
  // 移除开头的 ./ 并添加 /range-sdk/playground/ 前缀
  const cleanPath = path.replace(/^\.\//, '')
  window.location.href = `/range-sdk/playground/${cleanPath}`
}
</script>

<style scoped>
/* 企业级设计变量 - 直接在组件上定义 */
.playground-home {
  --primary-color: #2563eb;
  --primary-light: #3b82f6;
  --primary-dark: #1d4ed8;
  --secondary-color: #64748b;
  --background-primary: #f8fafc;
  --background-secondary: #ffffff;
  --background-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius: 8px;
  --radius-lg: 12px;
  
  /* 主容器样式 */
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: var(--text-primary);
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 重置样式 */
.playground-home * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 导航栏 */
.navbar {
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--background-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.back-link:hover {
  background: var(--border-light);
  color: var(--text-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* 主要内容 */
.main-content {
  padding: 3rem 0;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 介绍区域 */
.hero-section {
  text-align: center;
  margin-bottom: 4rem;
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-description {
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  font-weight: 400;
}

/* 模块区域 */
.modules-section {
  margin-bottom: 4rem;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
}

.module-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.module-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  transform: scaleX(0);
  transition: transform 0.3s ease;
  transform-origin: left;
}

.module-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.module-card:hover::before {
  transform: scaleX(1);
}

.module-icon {
  width: 3rem;
  height: 3rem;
  background: var(--background-tertiary);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.module-card:hover .module-icon {
  background: var(--primary-color);
  color: white;
  transform: scale(1.05);
}

.module-content {
  flex: 1;
}

.module-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.module-description {
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.module-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.feature-tag {
  background: var(--background-tertiary);
  color: var(--text-tertiary);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--border-light);
}

.module-arrow {
  color: var(--text-tertiary);
  font-size: 1.25rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
  transform: translateX(0);
}

.module-card:hover .module-arrow {
  color: var(--primary-color);
  transform: translateX(0.25rem);
}

/* 技术规格 */
.specs-section {
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.specs-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  text-align: center;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.spec-item {
  text-align: center;
  padding: 1rem;
  background: var(--background-tertiary);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
}

.spec-item h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.spec-item p {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }
  
  .specs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .content-container {
    padding: 0 1rem;
  }
  
  .nav-container {
    padding: 0 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .module-card {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
  }
  
  .specs-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .modules-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .module-card {
    padding: 1rem;
  }
  
  .main-content {
    padding: 2rem 0;
  }
}
</style>