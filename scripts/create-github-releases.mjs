#!/usr/bin/env node
/**
 * Creates GitHub releases for published packages.
 * Scans all packages, checks if a release already exists for the current version,
 * and creates one if not. Safe to run on every push (idempotent).
 */
import { execSync } from 'child_process';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REPO = 'reactive/data-client';
const BLOG_BASE_URL = 'https://dataclient.io/blog';
const DRY_RUN = process.argv.includes('--dry-run');

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find a blog post for a given major.minor version
 * Blog posts are named like: 2026-01-06-v0.15-*.md
 */
function findBlogPost(majorMinor) {
  const blogDir = join(process.cwd(), 'website/blog');
  if (!existsSync(blogDir)) return null;

  const files = readdirSync(blogDir);
  const versionPattern = new RegExp(
    `^(\\d{4})-(\\d{2})-(\\d{2})-v${escapeRegExp(majorMinor)}-.*\\.md$`,
  );

  for (const file of files) {
    const match = file.match(versionPattern);
    if (match) {
      const [, year, month, day] = match;
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
    if (line.match(new RegExp(`^## ${escapeRegExp(version)}\\s*$`))) {
      capturing = true;
      continue;
    }
    if (capturing && line.match(/^## \d+\.\d+/)) {
      break;
    }
    if (capturing) {
      changelog.push(line);
    }
  }

  return changelog.join('\n').trim();
}

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

function createRelease(tag, name, body) {
  if (DRY_RUN) {
    console.log(`  [dry-run] Would create release: ${tag}`);
    console.log(`  Body preview: ${body.slice(0, 200)}${body.length > 200 ? '...' : ''}`);
    return true;
  }
  console.log(`Creating release: ${tag}`);
  try {
    execSync(
      `gh release create "${tag}" --repo ${REPO} --title "${name}" --notes-file -`,
      {
        input: body,
        stdio: ['pipe', 'inherit', 'inherit'],
      },
    );
    console.log(`  ✓ Created ${tag}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to create ${tag}:`, error.message);
    return false;
  }
}

async function main() {
  if (DRY_RUN) console.log('Running in dry-run mode (no releases will be created)\n');
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
    if (pkg.private) continue;

    const tag = `${pkg.name}@${pkg.version}`;

    if (releaseExists(tag)) {
      skippedCount++;
      continue;
    }

    let changelog = getChangelogForVersion(packageDir, pkg.version);

    const majorMinor = pkg.version.split('.').slice(0, 2).join('.');
    const blogUrl = findBlogPost(majorMinor);

    let body = '';
    if (blogUrl) {
      body += `📝 **[Read the full release announcement](${blogUrl})**\n\n---\n\n`;
    }
    if (changelog) {
      body += changelog;
    } else {
      body += `Release ${pkg.name}@${pkg.version}`;
    }

    if (createRelease(tag, tag, body)) {
      createdCount++;
    }
  }

  console.log(
    `\nDone! Created ${createdCount} releases, skipped ${skippedCount} existing.`,
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
