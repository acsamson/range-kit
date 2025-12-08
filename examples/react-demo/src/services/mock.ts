/**
 * Mock data for React demo
 * Re-exports from common
 */

import type { SerializedSelection } from 'range-kit-react'
import { getVueDemoMockSelections } from '../../../common/mock'

// Convert mock selections to SerializedSelection format
export const mockSelections: SerializedSelection[] = getVueDemoMockSelections() as unknown as SerializedSelection[]
