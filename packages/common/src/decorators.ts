export function singleton<T extends { new (...args: any[]): {} }>(
  constructor: T,
) {
  let instance: {} | null = null;
  return class extends constructor {
    constructor(...args: any[]) {
      if (instance !== null) return instance;
      super(...args);
      instance = this;
    }
  };
}
