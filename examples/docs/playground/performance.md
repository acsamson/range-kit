# 性能监控演示

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import PerformanceMonitor from '../.vitepress/components/PerformanceMonitor.vue'
</script>

<PerformanceMonitor />

## 使用说明

这个页面展示了 Range SDK 的实时性能监控数据：

1. **内存占用** - 实时显示 SDK 各部分的内存使用情况
2. **性能指标** - 展示各种操作的执行时间和成功率
3. **系统资源** - 显示页面内存和 DOM 节点等信息
4. **操作统计** - 详细的操作执行统计数据

你可以在这个页面上执行各种操作，然后观察性能数据的变化。