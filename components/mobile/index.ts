/**
 * Mobile-First Components
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Optimized for Malaysia market:
 * - Low-end Android devices
 * - 4G connections
 * - Small screens (360-412px typical)
 *
 * @see /docs/UI-AMENDMENTS.md
 */

// Scroll utilities
export { ScrollToTop } from './scroll-to-top';

// Touch-optimized button
export { TouchButton } from './touch-button';

// Layout components
export {
  MobileStack,
  MobileGrid,
  MobileContainer,
  MobileBottomBar,
  MobileBottomSpacer,
} from './mobile-stack';

// Development tools
export { ViewportDebug, DeviceSimulator } from './viewport-debug';
