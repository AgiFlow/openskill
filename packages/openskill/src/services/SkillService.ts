/**
 * SkillService
 *
 * Service for reading and parsing Claude Code skills from .claude/skills/ directory.
 * Extracts skill metadata from SKILL.md frontmatter.
 *
 * DESIGN PATTERNS:
 * - Service layer pattern for business logic
 * - Separation of concerns
 *
 * CODING STANDARDS:
 * - Handle file system errors gracefully
 * - Parse frontmatter using gray-matter
 * - Return structured skill data
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Skill, SkillMetadata } from '../types/index.js';

export class SkillService {
  private skillsPath: string;

  constructor(skillsPath = '.claude/skills') {
    this.skillsPath = skillsPath;
  }

  /**
   * Get all available skills from the .claude/skills directory
   * @returns Array of skills with name, description, and location
   */
  async getSkills(): Promise<Skill[]> {
    const skills: Skill[] = [];

    try {
      // Resolve the skills path relative to the current working directory
      const resolvedPath = path.resolve(process.cwd(), this.skillsPath);

      // Check if skills directory exists
      if (!fs.existsSync(resolvedPath)) {
        return skills;
      }

      // Read all directories in the skills path
      const skillDirs = fs
        .readdirSync(resolvedPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      // Process each skill directory
      for (const skillDir of skillDirs) {
        const skillFilePath = path.join(resolvedPath, skillDir, 'SKILL.md');
        const skillBasePath = path.join(resolvedPath, skillDir);

        // Check if SKILL.md exists in this directory
        if (fs.existsSync(skillFilePath)) {
          try {
            const skillContent = fs.readFileSync(skillFilePath, 'utf-8');
            const { data, content } = matter(skillContent);

            // Extract metadata from frontmatter
            const metadata = data as SkillMetadata;

            skills.push({
              name: metadata.name || skillDir,
              description: metadata.description || '',
              location: 'project',
              content: content,
              basePath: skillBasePath,
            });
          } catch (error) {
            // Skip skills with invalid frontmatter
            console.error(
              `Error parsing skill ${skillDir}:`,
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to read skills: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return skills;
  }

  /**
   * Get a specific skill by name
   * @param name - Name of the skill to retrieve
   * @returns Skill object or null if not found
   */
  async getSkill(name: string): Promise<Skill | null> {
    const skills = await this.getSkills();
    return skills.find((skill) => skill.name === name) || null;
  }
}
