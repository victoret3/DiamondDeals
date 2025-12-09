import { Database } from "./database.types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// Profile types
export type Profile = Tables<"profiles">;
export type UserRole = "admin" | "player";

// Player types
export type Player = Tables<"players">;
export type PlayerStatus = "pending" | "active" | "inactive";

// Club types
export type Club = Tables<"clubs">;
export type PlayerClub = Tables<"player_clubs">;

// Condition types
export type ConditionTemplate = Tables<"condition_templates">;
export type ConditionRule = Tables<"condition_rules">;
export type PlayerCondition = Tables<"player_conditions">;
export type ConditionType = "fixed" | "dynamic";

// Stats types
export type PlayerStats = Tables<"player_stats">;

// Insert types (for creating new records)
export type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];
export type ClubInsert = Database["public"]["Tables"]["clubs"]["Insert"];
export type PlayerClubInsert = Database["public"]["Tables"]["player_clubs"]["Insert"];
export type ConditionTemplateInsert = Database["public"]["Tables"]["condition_templates"]["Insert"];
export type ConditionRuleInsert = Database["public"]["Tables"]["condition_rules"]["Insert"];
export type PlayerConditionInsert = Database["public"]["Tables"]["player_conditions"]["Insert"];
export type PlayerStatsInsert = Database["public"]["Tables"]["player_stats"]["Insert"];

// Update types
export type PlayerUpdate = Database["public"]["Tables"]["players"]["Update"];
export type ClubUpdate = Database["public"]["Tables"]["clubs"]["Update"];
export type PlayerClubUpdate = Database["public"]["Tables"]["player_clubs"]["Update"];

export type { Database };
