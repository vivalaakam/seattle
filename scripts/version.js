const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const pckg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')));

const folders = Array.from(pckg.workspaces);

const version = pckg.version.split('.').map(v => parseInt(v, 10));

version[version.length - 1] += 1;

const newVersion = version.join('.');

const packages = [
  {
    entry: pckg,
    file: path.join(__dirname, '..', 'package.json'),
  },
];
const existsPackages = new Set();

while (folders.length) {
  const folder = folders.shift();
  const p = folder.split('/');

  let index = p.indexOf('*');

  if (index === -1) {
    const file = path.join(folder, 'package.json');

    if (fs.existsSync(file)) {
      const entry = JSON.parse(fs.readFileSync(file));
      existsPackages.add(entry.name);
      packages.push({
        entry,
        file,
      });
    }
  } else {
    const readPath = p.slice(0, index);

    const entries = fs.readdirSync(path.join(...readPath));

    for (const entry of entries) {
      if (entry !== '.' && entry !== '..') {
        const newPath = Array.from(p);
        newPath[index] = entry;
        folders.push(newPath.join('/'));
      }
    }
  }
}

const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'];

for (const pckgWS of packages) {
  const { entry, file } = pckgWS;
  entry.version = newVersion;

  for (const depType of depTypes) {
    if (entry[depType]) {
      Object.keys(entry[depType]).forEach(dep => {
        if (existsPackages.has(dep)) {
          entry[depType][dep] = newVersion;
        }
      });
    }
  }

  fs.writeFileSync(file, JSON.stringify(entry, null, 2));
}

execSync('npm install -ws');

execSync('git add --all');
execSync(`git commit -m "v${newVersion}"`);
execSync(`git tag -a v${newVersion} -m v${newVersion}`);
execSync(`git push origin v${newVersion}`);
