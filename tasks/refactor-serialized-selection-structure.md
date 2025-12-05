# 重构任务：SerializedSelection 结构优化

## 目标

将 `SerializedSelection` 从平铺结构重构为分层结构，减少数据体积约 75-80%。

## 目标结构

```typescript
interface SerializedSelection {
  // 业务标识
  id: string;
  text: string;
  type?: string;

  // 恢复算法数据
  restore: {
    anchors: AnchorInfo;           // L1
    paths: PathInfo;               // L2
    multipleAnchors: MultipleAnchorInfo; // L3
    fingerprint: StructuralFingerprint;  // L4
    context: TextContext;          // L4 辅助
  };

  // 运行时状态（前端用，不存后端）
  runtime?: {
    restoreStatus: RestoreStatus;
    successLayer: number;
  };
}
```

## 任务清单

### 阶段 1：类型定义重构

- [ ] **1.1** 在 `types/core.ts` 中新增 `RestoreData` 接口
  ```typescript
  interface RestoreData {
    anchors: AnchorInfo;
    paths: PathInfo;
    multipleAnchors: MultipleAnchorInfo;
    fingerprint: StructuralFingerprint;
    context: TextContext;
  }
  ```

- [ ] **1.2** 在 `types/core.ts` 中新增 `RuntimeData` 接口
  ```typescript
  interface RuntimeData {
    restoreStatus: RestoreStatus;
    successLayer: number;
  }
  ```

- [ ] **1.3** 重构 `SerializedSelection` 接口为新结构

- [ ] **1.4** 删除不再需要的类型：
  - `MetadataInfo`
  - `ViewportInfo`
  - `MediaInfo`（已删除）
  - `SelectionContent`（已删除）

- [ ] **1.5** 更新 `SerializedSelectionSimple` 类型定义
  ```typescript
  type SerializedSelectionSimple = Pick<SerializedSelection, 'id' | 'text' | 'type' | 'restore'>;
  ```

- [ ] **1.6** 更新 `types/index.ts` 导出

### 阶段 2：序列化器重构

- [ ] **2.1** 修改 `serializer/serializer.ts` 中的 `serialize()` 方法
  - 移除 `extractMetadataInfo` 调用
  - 移除 `generateContentHash` 调用
  - 将算法数据包装到 `restore` 对象中
  - 不生成 `runtime` 字段

- [ ] **2.2** 删除 `extractMetadataInfo` 函数

- [ ] **2.3** 删除 `generateContentHash` 函数（如不再需要）

- [ ] **2.4** 更新 `core/selection-serializer.ts` 适配新结构

### 阶段 3：恢复算法重构

- [ ] **3.1** 修改 `restorer/layers/layer1-id-anchors.ts`
  - `data.anchors` → `data.restore.anchors`

- [ ] **3.2** 修改 `restorer/layers/layer2-original-paths.ts`
  - `data.paths` → `data.restore.paths`

- [ ] **3.3** 修改 `restorer/layers/layer3-multiple-anchors.ts`
  - `data.multipleAnchors` → `data.restore.multipleAnchors`
  - `data.text` 保持不变（顶层字段）

- [ ] **3.4** 修改 `restorer/layers/layer4-structural-fingerprint.ts`
  - `data.structuralFingerprint` → `data.restore.fingerprint`
  - `data.textContext` → `data.restore.context`

- [ ] **3.5** 修改 `restorer/layers/layer4/` 目录下所有文件
  - 更新字段访问路径

- [ ] **3.6** 修改 `restorer/restorer.ts` 主恢复逻辑

### 阶段 4：存储层重构

- [ ] **4.1** 修改 `storage/memory-storage.ts`
  - 移除 `getByUrl` 方法（不再有 metadata.url）
  - 移除 `getByContentHash` 方法（不再有 contentHash）
  - 移除 `updateRestoreStatus` 方法（改为更新 runtime）
  - 简化 `getStats` 方法

- [ ] **4.2** 修改 `storage/api-storage.ts`
  - 同上调整

- [ ] **4.3** 更新 `types/interfaces.ts` 中的 `Storage` 接口
  - 移除 `getByUrl`
  - 移除 `getByContentHash`
  - 移除 `updateRestoreStatus`
  - 移除 `getCurrentPageStats`

- [ ] **4.4** 修改 `core/selection-storage.ts` 适配

### 阶段 5：API 层重构

- [ ] **5.1** 修改 `api/core-api.ts`
  - `restore()` 函数更新 `runtime` 而非顶层字段

- [ ] **5.2** 修改 `api/storage-api.ts`
  - 移除不再需要的方法

- [ ] **5.3** 更新 `index.ts` 主类
  - 移除相关方法导出

- [ ] **5.4** 更新 `types/api.ts` 中的 `SelectionRestoreAPI` 接口
  - 移除 `getByUrl` 等方法签名

### 阶段 6：辅助模块更新

- [ ] **6.1** 修改 `manager/content-monitor.ts`
  - 更新 `SelectionChangeInfo` 使用

- [ ] **6.2** 修改 `manager/selection-instance.ts`
  - 更新数据访问路径

- [ ] **6.3** 修改 `helpers/batch-operations.ts`
  - 更新字段访问

- [ ] **6.4** 修改 `utils/index.ts`
  - 更新 `convertToSimple` 函数

### 阶段 7：清理与验证

- [ ] **7.1** 删除不再使用的代码
  - `extractMetadataInfo` 函数
  - `ViewportInfo` 相关代码
  - `generateContentHash` 函数（如无其他用途）

- [ ] **7.2** 运行构建验证
  ```bash
  pnpm build
  ```

- [ ] **7.3** 运行测试验证
  ```bash
  pnpm test
  ```

- [ ] **7.4** 更新 `src/index.ts` 导出
  - 移除 `MetadataInfo` 等类型导出
  - 新增 `RestoreData`、`RuntimeData` 导出

## 预期收益

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| 每选区体积 | 2-3 KB | 400-600 字节 |
| 体积减少 | - | 75-80% |
| 字段数量 | ~15 | ~6 |
| 后端存储字段 | 混杂 | 仅 `id, text, type, restore` |

## 注意事项

1. **Breaking Change** - 这是不兼容的结构变更
2. **测试文件** - 需要同步更新所有测试用例中的 mock 数据
3. **字段重命名** - `structuralFingerprint` → `fingerprint`，`textContext` → `context`
4. **运行时填充** - `runtime` 字段在序列化时不生成，恢复成功后由 API 层填充

## 执行顺序建议

1. 先完成阶段 1（类型定义），确保类型正确
2. 阶段 2-6 可并行或按顺序进行
3. 最后执行阶段 7 验证
