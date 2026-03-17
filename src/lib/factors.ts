export type FactorCategory = "core" | "secondary" | "blue_sky";

export interface FactorDefinition {
  name: string;
  category: FactorCategory;
  description?: string;
}

export const seedFactors: FactorDefinition[] = [
  // Core Factors
  { name: "Overall academic level", category: "core" },
  { name: "Subject-specific achievement", category: "core" },
  { name: "Set / pathway", category: "core" },
  { name: "Learning support needs (LS)", category: "core" },
  { name: "EAL / language support needs", category: "core" },
  { name: "Classroom behaviour", category: "core" },
  { name: "Behaviour alerts", category: "core" },
  { name: "Work habits / organisation", category: "core" },
  { name: "Effort / engagement level", category: "core" },
  { name: "Hard avoids", category: "core" },
  { name: "Preferential avoids", category: "core" },
  { name: "Teacher / student preference / avoid", category: "core" },
  { name: "Social-emotional needs", category: "core" },
  { name: "Students requiring specific environments", category: "core" },
  { name: "Students who should not be isolated", category: "core" },
  { name: "Class size limits", category: "core" },

  // Secondary Factors
  { name: "Spreading high achievers", category: "secondary" },
  { name: "Avoiding clustering of low attainment", category: "secondary" },
  {
    name: "Avoiding too many high-need students in one class",
    category: "secondary"
  },
  { name: "Distributing strong role models", category: "secondary" },
  { name: "Friendship preferences", category: "secondary" },
  { name: "Sociogram data", category: "secondary" },
  { name: "Communication strength", category: "secondary" },
  { name: "Gender balance", category: "secondary" },
  { name: "Nationality balance", category: "secondary" },
  { name: "Language mix", category: "secondary" },
  { name: "Balancing workload across teachers", category: "secondary" },
  {
    name: "Matching class profile to teacher strengths",
    category: "secondary"
  },

  // Blue Sky Factors
  { name: "Chronic lateness patterns", category: "blue_sky" },
  { name: "Absentee clustering", category: "blue_sky" },
  { name: "Attendance volatility", category: "blue_sky" },
  { name: "Improving vs declining students", category: "blue_sky" },
  { name: "Sudden drops or spikes in grades", category: "blue_sky" },
  { name: "Stability vs volatility in grades", category: "blue_sky" },
  { name: "High effort, low outcome students", category: "blue_sky" },
  { name: "Low effort, high ability students", category: "blue_sky" },
  {
    name: "Students consistently rated differently across teachers",
    category: "blue_sky"
  },
  { name: "Outlier students in grading patterns", category: "blue_sky" },
  {
    name: "Behaviour issues linked to subjects / time of day",
    category: "blue_sky"
  },
  { name: "Participation in sports teams", category: "blue_sky" },
  { name: "Participation in performing arts", category: "blue_sky" },
  { name: "Participation in clubs / service groups", category: "blue_sky" },
  { name: "Number of activities involved in", category: "blue_sky" },
  { name: "Students who are always in the same teams/clubs", category: "blue_sky" },
  { name: "Strong co-curricular friend groups", category: "blue_sky" },
  { name: "Team captains", category: "blue_sky" },
  { name: "Club leaders", category: "blue_sky" },
  { name: "Student council / house leaders", category: "blue_sky" },
  { name: "High service involvement", category: "blue_sky" },
  { name: "STEM-heavy students", category: "blue_sky" },
  { name: "Arts-focused students", category: "blue_sky" },
  { name: "Sports-dominant students", category: "blue_sky" },
  {
    name: "Connector students involved in multiple groups",
    category: "blue_sky"
  },
  { name: "House system participation", category: "blue_sky" },
  { name: "Academic alerts", category: "blue_sky" }
];

