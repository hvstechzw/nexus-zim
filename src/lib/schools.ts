// Shared constants for the schools platform

export const AGE_GROUPS = ["U8", "U10", "U12", "U14", "U16", "U18", "U19", "U20", "U21", "Open"] as const;

export const SCHOOL_TERMS = ["Term 1", "Term 2", "Term 3"] as const;

export const COMPETITION_STAGES = [
  { value: "zonal", label: "Zonal / Cluster", short: "Zonal" },
  { value: "district", label: "District", short: "District" },
  { value: "provincial", label: "Provincial", short: "Provincial" },
  { value: "national", label: "National", short: "National" },
] as const;

export type CompetitionStage = typeof COMPETITION_STAGES[number]["value"];

export const SCHOOL_TIERS = [
  { value: "all", label: "All Tiers" },
  { value: "primary_school", label: "Primary" },
  { value: "secondary_school", label: "Secondary" },
  { value: "club_academy", label: "Tertiary / College" },
] as const;


// Comprehensive school discipline catalogue
export const SCHOOL_DISCIPLINES = {
  "Field Sports": [
    "Football", "Rugby", "Rugby Sevens", "Cricket", "Hockey", "Lacrosse", "Softball", "Baseball", "Polo",
  ],
  "Court Sports": [
    "Netball", "Basketball", "Volleyball", "Beach Volleyball", "Tennis", "Badminton", "Squash", "Table Tennis", "Handball", "Korfball",
  ],
  "Athletics": [
    "Track Sprints", "Track Middle Distance", "Track Long Distance", "Hurdles", "Steeplechase", "Relays",
    "Long Jump", "High Jump", "Triple Jump", "Pole Vault",
    "Shot Put", "Discus", "Javelin", "Hammer Throw",
    "Cross Country", "Race Walking", "Marathon", "Decathlon", "Heptathlon",
  ],
  "Aquatics": [
    "Freestyle Swimming", "Backstroke", "Breaststroke", "Butterfly", "Medley", "Open Water",
    "Diving", "Water Polo", "Synchronised Swimming", "Lifesaving",
  ],
  "Combat & Martial Arts": [
    "Boxing", "Judo", "Karate", "Taekwondo", "Wrestling", "Kickboxing", "Fencing", "Jujitsu", "Kung Fu",
  ],
  "Cycling & Motor": [
    "Road Cycling", "Mountain Biking", "BMX", "Track Cycling", "Cyclocross",
  ],
  "Mind Sports": [
    "Chess", "Draughts", "Scrabble", "Bridge", "Go", "Sudoku",
  ],
  "Academic & Cultural": [
    "Debate", "Public Speaking", "Quiz", "Spelling Bee", "Maths Olympiad", "Science Olympiad",
    "Geography Olympiad", "Mock Trial", "Model UN", "Poetry Slam", "Drama", "Choir", "Band",
    "Traditional Dance", "Visual Art", "Photography", "Film Making",
  ],
  "Target & Precision": [
    "Archery", "Shooting", "Darts", "Bowling", "Snooker", "Pool", "Petanque", "Lawn Bowls", "Croquet",
  ],
  "Other": [
    "Gymnastics", "Rhythmic Gymnastics", "Trampoline", "Cheerleading",
    "Equestrian", "Rowing", "Sailing", "Canoeing", "Surfing", "Skateboarding",
    "Triathlon", "Pentathlon", "Golf", "Frisbee", "Tug of War", "Orienteering",
    "Esports", "Robotics",
  ],
} as const;

export const ALL_DISCIPLINES = Object.values(SCHOOL_DISCIPLINES).flat();

export const HOUSE_DEFAULTS = ["Red", "Blue", "Green", "Yellow"];

// Helpers
export function tierLabel(level: string | null | undefined): string {
  if (!level) return "—";
  const found = SCHOOL_TIERS.find((t) => t.value === level);
  return found?.label || level.replace(/_/g, " ");
}
