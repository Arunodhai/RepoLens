import Prism from 'prismjs';

// Ensure Prism is globally available on window and globalThis BEFORE any language component files load
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Prism = Prism;
}

export default Prism;
