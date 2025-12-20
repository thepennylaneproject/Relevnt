/**
 * ============================================================================
 * ADMIN DASHBOARD - MOCK DATA FOR DEVELOPMENT & TESTING
 * ============================================================================
 * Use this file to test AdminDashboard styling and functionality
 * while backend is being developed.
 * 
 * 🎓 LEARNING NOTE: In development, we mock APIs to test UI independently.
 * This lets frontend and backend teams work in parallel.
 * ============================================================================
 */

export type AdminStats = {
      users: {
            total: number;
            activeThisMonth: number;
            signupsThisWeek: number;
      };
      subscriptions: {
            totalActive: number;
            starterCount: number;
            proCount: number;
            premiumCount: number;
            mrrTotal: number;
      };
      jobs: {
            totalProcessed: number;
            processedThisWeek: number;
            avgMatchScore: number;
      };
      ai: {
            totalRequests: number;
            totalCost: number;
            avgCostPerRequest: number;
            topProviders: { name: string; count: number }[];
      };
      system: {
            errorRate: number;
            avgResponseTime: number;
            lastUpdated: string;
      };
};

/**
 * ============================================================================
 * SCENARIO 1: Healthy Growing Platform
 * ============================================================================
 * Use this when you want to show:
 * - Growing user base
 * - Good conversion to paid
 * - Strong AI usage
 * - Excellent system health
 * 
 * Good for: Demo, marketing screenshots, team meetings
 */
export const healthyPlatformStats: AdminStats = {
      users: {
            total: 2500,
            activeThisMonth: 1850,
            signupsThisWeek: 245,
      },
      subscriptions: {
            totalActive: 127,
            starterCount: 2373,
            proCount: 95,
            premiumCount: 32,
            mrrTotal: 626300, // $6,263/mo
      },
      jobs: {
            totalProcessed: 18500,
            processedThisWeek: 1250,
            avgMatchScore: 0.82, // 82% - very good
      },
      ai: {
            totalRequests: 45000,
            totalCost: 32450, // $324.50 total cost
            avgCostPerRequest: 72, // $0.0072 per request
            topProviders: [
                  { name: 'DeepSeek', count: 28000 },
                  { name: 'OpenAI', count: 12000 },
                  { name: 'Anthropic', count: 5000 },
            ],
      },
      system: {
            errorRate: 0.008, // 0.8% - excellent
            avgResponseTime: 425, // ms - fast
            lastUpdated: new Date().toISOString(),
      },
};

/**
 * ============================================================================
 * SCENARIO 2: Platform With Growing Pains
 * ============================================================================
 * Use this when you want to test:
 * - Warning colors (yellow alerts)
 * - Performance issues
 * - High error rate
 * - Expensive AI costs
 * 
 * Good for: Testing alert states, identifying optimization needs
 */
export const warningScenarioStats: AdminStats = {
      users: {
            total: 5000,
            activeThisMonth: 2100, // Lower engagement
            signupsThisWeek: 890,
      },
      subscriptions: {
            totalActive: 89, // Lower than should be for user count
            starterCount: 4911,
            proCount: 75,
            premiumCount: 14,
            mrrTotal: 421100, // $4,211/mo
      },
      jobs: {
            totalProcessed: 42300,
            processedThisWeek: 3200,
            avgMatchScore: 0.58, // 58% - declining match quality
      },
      ai: {
            totalRequests: 89500,
            totalCost: 156700, // $1,567 - high cost!
            avgCostPerRequest: 175, // $0.0175 per request - getting expensive
            topProviders: [
                  { name: 'OpenAI', count: 45000 }, // Too many expensive calls
                  { name: 'Anthropic', count: 30000 },
                  { name: 'DeepSeek', count: 14500 },
            ],
      },
      system: {
            errorRate: 0.035, // 3.5% - getting concerning
            avgResponseTime: 1200, // ms - slow!
            lastUpdated: new Date(Date.now() - 15 * 60000).toISOString(), // 15 min ago
      },
};

/**
 * ============================================================================
 * SCENARIO 3: Critical System Issues
 * ============================================================================
 * Use this when you want to test:
 * - Red alert colors
 * - Critical errors
 * - System down scenarios
 * - Urgent admin action needed
 * 
 * Good for: Testing error states, alert thresholds, admin notifications
 */
export const criticalIssueStats: AdminStats = {
      users: {
            total: 8500,
            activeThisMonth: 1200, // Very low engagement
            signupsThisWeek: 45, // Signups dropped
      },
      subscriptions: {
            totalActive: 42, // Many unsubscribed
            starterCount: 8458,
            proCount: 35,
            premiumCount: 7,
            mrrTotal: 206300, // $2,063/mo - dropped significantly
      },
      jobs: {
            totalProcessed: 62000,
            processedThisWeek: 120, // Almost no jobs processed this week!
            avgMatchScore: 0.31, // 31% - matching broken?
      },
      ai: {
            totalRequests: 250000, // Huge spike
            totalCost: 487500, // $4,875 - out of control
            avgCostPerRequest: 195, // $0.0195 per request - expensive
            topProviders: [
                  { name: 'OpenAI', count: 150000 }, // All expensive provider
                  { name: 'Anthropic', count: 100000 },
            ],
      },
      system: {
            errorRate: 0.087, // 8.7% - CRITICAL
            avgResponseTime: 3200, // ms - extremely slow
            lastUpdated: new Date(Date.now() - 2 * 60 * 60000).toISOString(), // 2 hours ago - stale!
      },
};

/**
 * ============================================================================
 * SCENARIO 4: Early Stage - Just Launched
 * ============================================================================
 * Use this when you want to test:
 * - Low numbers
 * - Early traction
 * - MVP metrics
 * - Zero cost (if using only free tier APIs)
 * 
 * Good for: Launch day, first week tracking, baseline metrics
 */
export const earlyStageStats: AdminStats = {
      users: {
            total: 85,
            activeThisMonth: 72,
            signupsThisWeek: 42,
      },
      subscriptions: {
            totalActive: 3,
            starterCount: 82,
            proCount: 3,
            premiumCount: 0,
            mrrTotal: 57000, // $570/mo - not much yet
      },
      jobs: {
            totalProcessed: 450,
            processedThisWeek: 340,
            avgMatchScore: 0.75,
      },
      ai: {
            totalRequests: 2150,
            totalCost: 950, // $9.50 - very cheap!
            avgCostPerRequest: 44, // $0.0044 per request
            topProviders: [
                  { name: 'DeepSeek', count: 1500 },
                  { name: 'OpenAI', count: 650 },
            ],
      },
      system: {
            errorRate: 0.001, // 0.1% - excellent
            avgResponseTime: 350,
            lastUpdated: new Date().toISOString(),
      },
};

/**
 * ============================================================================
 * HOW TO USE THESE MOCKS IN YOUR COMPONENT
 * ============================================================================
 * 
 * Option 1: Modify AdminDashboard.tsx to use mock in development
 * ─────────────────────────────────────────────────────────────────
 * 
 * import { healthyPlatformStats } from '../mocks/adminStats';
 * 
 * export function AdminDashboard(): JSX.Element {
 *   // ... existing code ...
 * 
 *   useEffect(() => {
 *     if (process.env.NODE_ENV === 'development' && !stats) {
 *       // For testing without backend
 *       setStats(healthyPlatformStats);
 *       setLoading(false);
 *     } else {
 *       fetchStats();
 *     }
 *   }, []);
 * 
 *   // ... rest of component ...
 * }
 * 
 * 
 * Option 2: Create a mock API response
 * ─────────────────────────────────────────────────────────────────
 * 
 * // In your mock server (MSW or similar)
 * import { healthyPlatformStats } from './adminStats';
 * 
 * rest.get('/.netlify/functions/admin/stats', (req, res, ctx) => {
 *   return res(ctx.json(healthyPlatformStats));
 * });
 * 
 * 
 * Option 3: Manually override in browser console
 * ─────────────────────────────────────────────────────────────────
 * 
 * // Open browser DevTools console and paste:
 * const mockStats = {
 *   users: { total: 2500, activeThisMonth: 1850, signupsThisWeek: 245 },
 *   // ... etc
 * };
 * sessionStorage.setItem('adminStats', JSON.stringify(mockStats));
 * // Refresh page
 */

/**
 * ============================================================================
 * TESTING CHECKLIST WITH THESE SCENARIOS
 * ============================================================================
 * 
 * Use healthyPlatformStats to test:
 * ☐ Dashboard renders without errors
 * ☐ Green color codes appear (healthy metrics)
 * ☐ Numbers format correctly (MRR shows $6,263.00)
 * ☐ MetricCards display all 12 metrics
 * ☐ Tier breakdown grid shows 3 cards
 * ☐ Top providers list shows correctly
 * ☐ All emojis and icons display
 * 
 * Use warningScenarioStats to test:
 * ☐ Yellow warning colors appear for:
 *   - avgMatchScore (58% is low)
 *   - avgCostPerRequest (high)
 *   - errorRate (3.5% is concerning)
 *   - avgResponseTime (1200ms is slow)
 * ☐ User sees timestamp is 15 minutes old
 * ☐ Refresh button appears and works
 * 
 * Use criticalIssueStats to test:
 * ☐ Red error colors appear for:
 *   - avgMatchScore (31% is broken)
 *   - errorRate (8.7% is critical)
 *   - avgResponseTime (3200ms is very slow)
 * ☐ Timestamp shows data is 2 hours old
 * ☐ Admin sees urgent action needed
 * 
 * Use earlyStageStats to test:
 * ☐ Dashboard works with small numbers
 * ☐ Numbers don't show NaN or infinity
 * ☐ Percentage calculations work (0-1 range)
 * ☐ Currency displays correctly
 * ☐ All colors still apply correctly
 */

/**
 * ============================================================================
 * GENERATING RANDOM STATS
 * ============================================================================
 * 
 * For continuous testing/stress testing:
 * 
 * export function generateRandomStats(): AdminStats {
 *   return {
 *     users: {
 *       total: Math.floor(Math.random() * 10000),
 *       activeThisMonth: Math.floor(Math.random() * 8000),
 *       signupsThisWeek: Math.floor(Math.random() * 1000),
 *     },
 *     subscriptions: {
 *       totalActive: Math.floor(Math.random() * 500),
 *       starterCount: Math.floor(Math.random() * 8000),
 *       proCount: Math.floor(Math.random() * 200),
 *       premiumCount: Math.floor(Math.random() * 100),
 *       mrrTotal: Math.floor(Math.random() * 1000000),
 *     },
 *     // ... etc
 *     system: {
 *       errorRate: Math.random() * 0.1,
 *       avgResponseTime: Math.floor(Math.random() * 2000) + 100,
 *       lastUpdated: new Date().toISOString(),
 *     },
 *   };
 * }
 */

// ============================================================================
// EXPORT ALL SCENARIOS
// ============================================================================

export const mockScenarios = {
      healthy: healthyPlatformStats,
      warning: warningScenarioStats,
      critical: criticalIssueStats,
      earlyStage: earlyStageStats,
};