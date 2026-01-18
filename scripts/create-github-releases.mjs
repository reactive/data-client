#!/usr/bin/env node
/**
 * Creates GitHub releases for published packages.
 * Run after yarn publish to create releases that changesets/action would normally create.
 */
import { execSync } from 'child_process';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REPO = 'reactive/data-client';
const BLOG_BASE_URL = 'https://dataclient.io/blog';

/**
 * Find a blog post for a given major.minor version
 * Blog posts are named like: 2026-01-06-v0.15-*.md
 */
function findBlogPost(majorMinor) {
  const blogDir = join(process.cwd(), 'website/blog');
  if (!existsSync(blogDir)) return null;

  const files = readdirSync(blogDir);
  // Look for blog post matching this version (e.g., v0.15)
  const versionPattern = new RegExp(
    `^(\\d{4})-(\\d{2})-(\\d{2})-v${majorMinor.replace('.', '\\.')}-.*\\.md$`,
  );

  for (const file of files) {
    const match = file.match(versionPattern);
    if (match) {
      const [, year, month, day] = match;
      // Read the file to get the slug from the filename
      const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
      return `${BLOG_BASE_URL}/${year}/${month}/${day}/${slug}`;
    }
  }
  return null;
}

/**
 * Extract changelog content for a specific version from CHANGELOG.md
 */
function getChangelogForVersion(packageDir, version) {
  const changelogPath = join(packageDir, 'CHANGELOG.md');
  if (!existsSync(changelogPath)) return '';

  const content = readFileSync(changelogPath, 'utf-8');
  const lines = content.split('\n');

  let capturing = false;
  let changelog = [];

  for (const line of lines) {
    // Start capturing at ## {version}
    if (line.match(new RegExp(`^## ${version.replace(/\./g, '\\.')}\\s*$`))) {
      capturing = true;
      continue;
    }
    // Stop at next version header
    if (capturing && line.match(/^## \d+\.\d+/)) {
      break;
    }
    if (capturing) {
      changelog.push(line);
    }
  }

  return changelog.join('\n').trim();
}

/**
 * Check if a GitHub release already exists
 */
function releaseExists(tag) {
  try {
    execSync(`gh release view "${tag}" --repo ${REPO}`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a GitHub release
 */
function createRelease(tag, name, body) {
  console.log(`Creating release: ${tag}`);
  try {
    // Use stdin for body to avoid shell escaping issues with markdown/code blocks
    execSync(
      `gh release create "${tag}" --repo ${REPO} --title "${name}" --notes-file -`,
      {
        input: body,
        stdio: ['pipe', 'inherit', 'inherit'],
      },
    );
    console.log(`  ✓ Created ${tag}`);
  } catch (error) {
    console.error(`  ✗ Failed to create ${tag}:`, error.message);
  }
}

async function main() {
  const packagesDir = join(process.cwd(), 'packages');
  const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => join(packagesDir, d.name));

  let createdCount = 0;
  let skippedCount = 0;

  for (const packageDir of packageDirs) {
    const pkgJsonPath = join(packageDir, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;

    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

    // Skip private packages
    if (pkg.private) continue;

    const tag = `${pkg.name}@${pkg.version}`;

    // Skip if release already exists
    if (releaseExists(tag)) {
      skippedCount++;
      continue;
    }

    // Get changelog content
    let changelog = getChangelogForVersion(packageDir, pkg.version);

    // Check for blog post (using major.minor version)
    const majorMinor = pkg.version.split('.').slice(0, 2).join('.');
    const blogUrl = findBlogPost(majorMinor);

    // Build release body
    let body = '';
    if (blogUrl) {
      body += `📝 **[Read the full release announcement](${blogUrl})**\n\n---\n\n`;
    }
    if (changelog) {
      body += changelog;
    } else {
      body += `Release ${pkg.name}@${pkg.version}`;
    }

    createRelease(tag, tag, body);
    createdCount++;
  }

  console.log(
    `\nDone! Created ${createdCount} releases, skipped ${skippedCount} existing.`,
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
