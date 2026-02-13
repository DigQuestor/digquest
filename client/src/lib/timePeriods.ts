export const FIND_TIME_PERIODS = [
  "Bronze Age",
  "Iron Age",
  "Roman",
  "Saxon",
  "Viking",
  "Byzantine Era",
  "Medieval",
  "Renaissance",
  "Elizabethan",
  "Early Modern",
  "Georgian",
  "Victorian",
  "Edwardian",
  "Modern",
  "Unknown",
] as const;

export const FIND_TIME_PERIOD_FILTERS = ["All Periods", ...FIND_TIME_PERIODS] as const;
