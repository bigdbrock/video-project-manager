export type UserRole = "admin" | "qc" | "editor";

export type ProjectStatus =
  | "NEW"
  | "ASSIGNED"
  | "EDITING"
  | "QC"
  | "REVISION_REQUESTED"
  | "READY"
  | "DELIVERED"
  | "ARCHIVED"
  | "ON_HOLD";
