/**
 * SDK 单例管理器
 * 确保每个 appid 只有一个 SDK 实例
 */
export class SDKSingletonManager {
  private static instances: Map<string, any> = new Map();
  
  /**
   * 获取或创建 SDK 实例
   */
  static getOrCreate<T>(appid: string, factory: () => T): T {
    if (!this.instances.has(appid)) {
      console.log(`[SDKSingletonManager] Creating new instance for appid: ${appid}`);
      this.instances.set(appid, factory());
    } else {
      console.log(`[SDKSingletonManager] Reusing existing instance for appid: ${appid}`);
    }
    return this.instances.get(appid)!;
  }
  
  /**
   * 检查是否已存在实例
   */
  static hasInstance(appid: string): boolean {
    return this.instances.has(appid);
  }
  
  /**
   * 销毁指定 appid 的实例
   */
  static destroy(appid: string): void {
    // 直接从集合中移除，不要调用 instance.destroy() 避免循环
    // 因为 instance.destroy() 中会调用 SDKSingletonManager.destroy()
    if (this.instances.has(appid)) {
      this.instances.delete(appid);
      console.log(`[SDKSingletonManager] Removed instance for appid: ${appid}`);
    }
  }
  
  /**
   * 销毁所有实例
   */
  static destroyAll(): void {
    // 先复制一份 appid 列表，避免在迭代时修改集合
    const appids = Array.from(this.instances.keys());
    
    // 逐个销毁实例
    appids.forEach(appid => {
      const instance = this.instances.get(appid);
      // 先从集合中移除，避免循环调用
      this.instances.delete(appid);
      // 然后调用实例的 destroy 方法
      if (instance && typeof instance.destroy === 'function') {
        try {
          instance.destroy();
        } catch (error) {
          console.error(`[SDKSingletonManager] Error destroying instance for appid ${appid}:`, error);
        }
      }
    });
    
    console.log('[SDKSingletonManager] All instances destroyed');
  }
  
  /**
   * 获取当前实例数量
   */
  static getInstanceCount(): number {
    return this.instances.size;
  }
  
  /**
   * 获取所有 appid
   */
  static getAllAppIds(): string[] {
    return Array.from(this.instances.keys());
  }
}