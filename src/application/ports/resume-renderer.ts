import type { Resume } from "../../domain/schemas/resume-schema.js";

export interface ResumeRenderer<T = string | Buffer> {
  /**
   * Renders the given structured Resume into the target output format.
   * @param resume The strongly typed Resume object.
   * @param options Additional render options (template path, custom styling, etc.).
   */
  render(resume: Resume, options?: Record<string, unknown>): Promise<T>;
}
