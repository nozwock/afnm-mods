const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const util = require('util');
const child_process = require('child_process');
const { zip } = require('zip-a-folder');

dotenv.config();
const args = util.parseArgs({
  options: {
    copyMod: {
      type: 'boolean',
    },
  },
  allowPositionals: true,
});

main();

// NOTE: process.cwd() will always be directory of package.json
function main() {
  if (args.values.copyMod && !process.env.AFNM_MODS_PATH) {
    console.error(
      `Error: Missing env var AFNM_MODS_PATH required in copyMod mode
Hint: Define AFNM_MODS_PATH in an .env file in the project root.`,
    );
    process.exit(1);
  }

  // Would need to use bun's --cwd flag (bun run --cwd . build) if you're passing in a path while being in a nested
  // directory. WAIT, scratch that, this BS doesn't work: https://github.com/oven-sh/bun/issues/6386
  //
  // We'd have made use of npm's INIT_CWD env var in "script" properties to pass-in the invoked directory to this
  // script, to avoid passing --cwd like flags etc, but the damn npm doesn't normalize how the env var is evaluated
  // across different OS, so on POSIX it'd be "node build.js $INIT_CWD" but on Windows it's "node build.js %INIT_CWD%"
  const buildMods = args.positionals;

  const packagesPath = path.resolve(__dirname, '../packages');
  const packageDirs = buildMods.length
    ? buildMods.map((nameOrPath) =>
        fs.existsSync(nameOrPath)
          ? nameOrPath
          : path.join(packagesPath, nameOrPath),
      )
    : fs
        .readdirSync(packagesPath)
        .map((name) => path.join(packagesPath, name))
        .filter(
          (pkgDir) =>
            fs.existsSync(path.join(pkgDir, 'package.json')) &&
            fs.existsSync(path.join(pkgDir, 'src', 'mod.ts')),
        );

  if (buildMods.length) {
    const invalidPackageDirs = packageDirs.filter(
      (pkgDir) => !fs.existsSync(path.join(pkgDir, 'package.json')),
    );
    if (invalidPackageDirs.length > 0) {
      console.error(
        `Error: Invalid package directories: ${invalidPackageDirs}`,
      );
      process.exit(1);
    }
  }

  build(packageDirs);
}

/**
 * @param {string[]} packageDirs
 */
async function build(packageDirs) {
  const buildPromises = packageDirs.map(async (packageDir) => {
    console.log(`Building ${path.basename(packageDir)}...`);

    await fs.promises.rm(path.join(packageDir, 'dist'), {
      recursive: true,
      force: true,
    });

    await spawnAsync('afnm-extract-translations', [], {
      stdio: 'inherit',
      cwd: packageDir,
    });

    await spawnAsync(
      'webpack',
      ['--config', '../../webpack.base.config.js', '--mode', 'production'],
      {
        stdio: 'inherit',
        cwd: packageDir,
      },
    );

    await copyTranslations(packageDir);

    const zipPath = await zipDist(packageDir);
    if (args.values.copyMod) {
      const package = require(`${packageDir}/package.json`);
      const target = path.join(
        process.env.AFNM_MODS_PATH,
        `${getFilenameFromPackageName(package.name)}.zip`,
      );

      console.log(`Copying mod "${path.basename(zipPath)}" to "${target}"`);
      await fs.promises.copyFile(zipPath, target);
    }
  });

  try {
    await Promise.all(buildPromises);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

/**
 * @param {string} command
 * @param {readonly string[]} args
 * @param {child_process.SpawnOptionsWithoutStdio | undefined} options
 */
function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    child_process.spawn(command, args, options).on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Command "${command} ${args.join(' ')}" failed with code: ${code}`,
          ),
        );
      }
    });
  });
}

/**
 * https://github.com/Lyeeedar/AfnmExampleMod/blob/fd46121d7793c0a7fa5170fc097dacfe0b5392ef/scripts/copy-translations.js
 * @param {string} packageDir
 */
async function copyTranslations(packageDir) {
  const package = require(`${packageDir}/package.json`);
  const translationsDir = path.resolve(packageDir, 'translations');
  const distDir = path.resolve(packageDir, `dist/${package.name}/translations`);

  if (!fs.existsSync(translationsDir)) {
    console.log('No translations directory found, skipping copy.');
    process.exit(0);
  }

  await fs.promises.mkdir(distDir, { recursive: true });

  const files = (await fs.promises.readdir(translationsDir)).filter((f) =>
    f.endsWith('.json'),
  );
  await Promise.all(
    files.map((file) =>
      fs.promises.copyFile(
        path.join(translationsDir, file),
        path.join(distDir, file),
      ),
    ),
  );

  console.log(`Copied ${files.length} translation file(s) to dist.`);
}

/**
 * https://github.com/Lyeeedar/AfnmExampleMod/blob/fd46121d7793c0a7fa5170fc097dacfe0b5392ef/scripts/zip-dist.js
 * @param {string} packageDir
 */
async function zipDist(packageDir) {
  const package = require(`${packageDir}/package.json`);
  const distPath = path.resolve(packageDir, `dist/${package.name}`);
  const buildsDir = path.resolve(packageDir, 'builds');
  const zipPath = path.resolve(
    buildsDir,
    `${getFilenameFromPackageName(package.name)}-${package.version}.zip`,
  );

  try {
    if (!fs.existsSync(buildsDir)) {
      await fs.promises.mkdir(buildsDir, { recursive: true });
    }

    await zip(distPath, zipPath);
    console.log(`Successfully zipped ${package.name} to ${zipPath}`);

    return zipPath;
  } catch (err) {
    console.error('Error: Failed zipping dist/ folder:', err);
  }
}

/**
 * Supports namespaced packages by organization name.
 * @param {string} name
 */
function getFilenameFromPackageName(name) {
  return name.replace(/^@/, '').replace(/[/\\]/, '-');
}
