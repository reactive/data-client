const github = require('@changesets/changelog-github');

const originalFunctions = github.default || github;

/** Usernames that should not get "Thanks @user!" in changelogs (e.g. repo owner) */
const EXCLUDED_USERS = ['ntucker'];

function stripThanks(line) {
  for (const user of EXCLUDED_USERS) {
    const userPattern = `\\[@${user}\\]\\([^)]*\\)`;
    // User is the sole contributor: " Thanks [@user](url)!" → ""
    line = line.replace(new RegExp(` Thanks ${userPattern}!`, 'g'), '');
    // User is first/middle in list: "[@user](url), " → ""
    line = line.replace(new RegExp(`${userPattern}, `, 'g'), '');
    // User is last in list: ", [@user](url)" → ""
    line = line.replace(new RegExp(`, ${userPattern}`, 'g'), '');
  }
  // Clean up leftover "- -" when thanks was the only prefix content
  line = line.replace(/^(\n*-)\s+-\s+/m, '$1 ');
  return line;
}

const changelogFunctions = {
  ...originalFunctions,
  getReleaseLine: async (...args) => {
    const line = await originalFunctions.getReleaseLine(...args);
    return stripThanks(line);
  },
};

exports.default = changelogFunctions;
