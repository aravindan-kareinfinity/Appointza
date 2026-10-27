const fs = require('fs');
const path = require('path');

const screenDirs = [
  'src/screens/track',
  'src/screens/account',
  'src/screens/auth',
  'src/screens/saved',
];

const screenReps = [
  [/from '\.\.\/services\//g, "from '../../services/"],
  [/from '\.\.\/location\//g, "from '../../location/"],
  [/from '\.\.\/components\//g, "from '../../components/"],
  [/from '\.\.\/constants\//g, "from '../../constants/"],
  [/from '\.\.\/navigation\//g, "from '../../navigation/"],
  [/from '\.\.\/theme'/g, "from '../../theme'"],
];

for (const dir of screenDirs) {
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(tsx?)$/.test(f)) continue;
    const fp = path.join(dir, f);
    let s = fs.readFileSync(fp, 'utf8');
    const o = s;
    for (const [a, b] of screenReps) s = s.replace(a, b);
    if (s !== o) fs.writeFileSync(fp, s);
  }
}

const gmp = 'src/services/maps/googleMapsPlaces.ts';
let g = fs.readFileSync(gmp, 'utf8');
g = g.replace("from './constants/androidApplicationId'", "from '../../constants/androidApplicationId'");
g = g.replace("from './constants/googleMaps'", "from '../../constants/googleMaps'");
fs.writeFileSync(gmp, g);

for (const f of ['deleteAccount.ts', 'hasValidSession.ts']) {
  const fp = path.join('src/services/firebase', f);
  let t = fs.readFileSync(fp, 'utf8');
  t = t.replace(/\.\.\/constants\//g, '../../constants/');
  fs.writeFileSync(fp, t);
}

for (const f of fs.readdirSync('src/location')) {
  if (!/\.(tsx?)$/.test(f)) continue;
  const fp = path.join('src/location', f);
  let t = fs.readFileSync(fp, 'utf8');
  t = t.replace(/from '\.\.\/services\/native\//g, "from '../services/native/");
  t = t.replace(/from '\.\.\/constants\/theme'/g, "from '../theme'");
  t = t.replace(/from '\.\.\/constants\/branding'/g, "from '../constants/branding'");
  fs.writeFileSync(fp, t);
}

for (const sub of ['common', 'map']) {
  const dir = path.join('src/components', sub);
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(tsx?)$/.test(f)) continue;
    const fp = path.join(dir, f);
    let t = fs.readFileSync(fp, 'utf8');
    t = t.replace(/from '\.\.\/constants\/theme'/g, "from '../../theme'");
    fs.writeFileSync(fp, t);
  }
}

console.log('fix-imports done');
