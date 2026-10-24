import type { QualityIssue, QualityIssueInput } from "@/types/quality";
import { createCrudService } from "./crud";

export const qualityIssueService = createCrudService<QualityIssue, QualityIssueInput>("/api/v1/quality-issues");