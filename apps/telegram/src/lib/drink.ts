// ============================================
// Drink types (previously from @p360/core, now local)
// Claude-first: no more domain logic, just data types for storage
// ============================================

export interface DrinkLog {
  date: string; // YYYY-MM-DD
  amount: number; // number of standard drinks
  timestamp: Date;
}
