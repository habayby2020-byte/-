import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidDir = path.join(root, 'android');
const appDir = path.join(androidDir, 'app');
const packageName = 'com.example.windesktop';
const packagePath = packageName.replaceAll('.', '/');
const javaDir = path.join(appDir, 'src/main/java', packagePath);

if (!fs.existsSync(path.join(androidDir, 'gradlew'))) {
  throw new Error('Capacitor Android project was not generated');
}
fs.mkdirSync(javaDir, { recursive: true });

const plugins = [
  ['android-presentation-bridge/MiracastPresentationPlugin.java', 'MiracastPresentationPlugin.java'],
  ['android-installed-apps-bridge/InstalledAppsPlugin.java', 'InstalledAppsPlugin.java'],
  ['android-device-info-bridge/DeviceInfoPlugin.java', 'DeviceInfoPlugin.java'],
];

for (const [source, filename] of plugins) {
  const sourcePath = path.join(root, source);
  if (!fs.existsSync(sourcePath)) throw new Error('Missing native plugin source: ' + source);
  const destination = path.join(javaDir, filename);
  const java = fs.readFileSync(sourcePath, 'utf8').replace(/^package\\s+com\\.yourapp\\s*;[^\\n]*/m, 'package ' + packageName + ';');
  if (!java.startsWith('package ' + packageName + ';')) {
    throw new Error('Could not set Android package for ' + filename);
  }
  fs.writeFileSync(destination, java, 'utf8');
}

function findFile(dir, filename) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(full, filename);
      if (found) return found;
    } else if (entry.name === filename) return full;
  }
  return null;
}

const mainActivity = findFile(path.join(appDir, 'src/main/java'), 'MainActivity.java');
if (!mainActivity) throw new Error('Capacitor MainActivity.java was not found');
let main = fs.readFileSync(mainActivity, 'utf8');
const imports = [
  'import android.os.Bundle;',
  'import ' + packageName + '.MiracastPresentationPlugin;',
  'import ' + packageName + '.InstalledAppsPlugin;',
  'import ' + packageName + '.DeviceInfoPlugin;',
];
for (const line of imports) {
  if (!main.includes(line)) {
    const packageLine = main.match(/^package [^;]+;\\s*$/m);
    if (!packageLine) throw new Error('MainActivity package declaration not found');
    main = main.replace(packageLine[0], packageLine[0] + '\\n' + line);
  }
}
if (!main.includes('registerPlugin(MiracastPresentationPlugin.class)')) {
  const onCreate = /@Override\\s+public void onCreate\\(Bundle savedInstanceState\\)\\s*\\{([\\s\\S]*?)\\n\\s*\\}/m;
  if (onCreate.test(main)) {
    main = main.replace(onCreate, (match, body) =>
      match.replace(body, '\\n        registerPlugin(MiracastPresentationPlugin.class);\\n        registerPlugin(InstalledAppsPlugin.class);\\n        registerPlugin(DeviceInfoPlugin.class);' + body)
    );
  } else {
    const classOpen = /public class MainActivity extends BridgeActivity\\s*\\{/;
    if (!classOpen.test(main)) throw new Error('Unexpected MainActivity template; refusing unsafe patch');
    main = main.replace(classOpen, match => match + '\\n    @Override\\n    public void onCreate(Bundle savedInstanceState) {\\n        registerPlugin(MiracastPresentationPlugin.class);\\n        registerPlugin(InstalledAppsPlugin.class);\\n        registerPlugin(DeviceInfoPlugin.class);\\n        super.onCreate(savedInstanceState);\\n    }');
  }
}
fs.writeFileSync(mainActivity, main, 'utf8');

const manifestPath = path.join(appDir, 'src/main/AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('<queries>')) {
  const applicationTag = manifest.match(/\\s*<application\\b/);
  if (!applicationTag) throw new Error('AndroidManifest.xml has no application element');
  const queries = '\\n    <queries>\\n        <intent>\\n            <action android:name="android.intent.action.MAIN" />\\n            <category android:name="android.intent.category.LAUNCHER" />\\n        </intent>\\n    </queries>\\n';
  manifest = manifest.replace(applicationTag[0], queries + applicationTag[0]);
}
fs.writeFileSync(manifestPath, manifest, 'utf8');

const gradlePath = path.join(appDir, 'build.gradle');
if (!fs.existsSync(gradlePath)) throw new Error('android/app/build.gradle was not found');
let gradle = fs.readFileSync(gradlePath, 'utf8');
if (!gradle.includes('androidx.webkit:webkit:')) {
  if (/dependencies\\s*\\{/.test(gradle)) {
    gradle = gradle.replace(/dependencies\\s*\\{/, match => match + '\\n    implementation "androidx.webkit:webkit:1.10.0"');
  } else {
    gradle += '\\n\\ndependencies { implementation "androidx.webkit:webkit:1.10.0" }\\n';
  }
}
fs.writeFileSync(gradlePath, gradle, 'utf8');

console.log('Registered native plugins:', plugins.map(p => p[1]).join(', '));
console.log('MainActivity:', mainActivity);
console.log('Added Android package visibility and AndroidX WebKit dependency.');
