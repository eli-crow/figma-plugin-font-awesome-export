import { camelCase, kebabCase } from 'lodash'

figma.showUI(__html__);

const PREFIX_VAR = 'fa'
const PREFIX_SET = 'fas'

const storage = figma.root

const settingDefaults = {
  framePrefix: 'icon',
  filename: 'icons'
}
for (let name in settingDefaults) {
  const existing = storage.getPluginData(name);
  if (!existing) storage.setPluginData(name, settingDefaults[name])
}


function matchesPrefix(string: string): boolean {
  const framePrefix = storage.getPluginData("framePrefix")
  const prefixRegex = new RegExp(`^\\s*${framePrefix}\\s*/\\s*`, 'g')
  return Boolean(string.match(prefixRegex))
}

function toIconName(string: string): string {
  const framePrefix = storage.getPluginData("framePrefix")
  const prefixRegex = new RegExp(`^\\s*${framePrefix}\\s*/\\s*`, 'g')
  return kebabCase(string.trim().replace(prefixRegex, ''))
}

function getFileText() {
  const all = figma.root.findAll(n => n.type === 'FRAME' && matchesPrefix(n.name))

  //TODO: resolve winding rules
  let unicodeCounter = 1
  const results = []
  all.forEach(n => {
    if (n.type === "FRAME") {
      const frame: FrameNode = n;

      if (frame.children.length <= 0) return;

      const clone = frame.clone()
      const vector = figma.flatten(clone.children)

      const unicode = 'e' + unicodeCounter.toString().padStart(3, '0')
      unicodeCounter++
      const pathData = vector.vectorPaths.map(p => p.data).join(' ')
      results.push({
        varName: camelCase(PREFIX_VAR + ' ' + frame.name),
        prefix: PREFIX_SET,
        iconName: toIconName(frame.name),
        icon: [
          frame.width,
          frame.height,
          [],
          unicode,
          pathData
        ]
      })

      clone.remove()
    }
  })

  const output = results
    .map(result => {
      const { varName, ...rest } = result
      return `export const ${varName} = ${JSON.stringify(rest)};`
    })
    .join('\n');

  return `// generated from Figma document using the "FontAwesome Custom Icon Export" plugin
${output}
`
}

figma.ui.onmessage = ({ type, payload }) => {
  switch (type) {
    case "UPDATE_SETTINGS":
      const settings = payload
      for (let name in settings) {
        storage.setPluginData(name, settings[name])
      }
      break;

    case "DOWNLOAD":
      figma.ui.postMessage({
        type: "DOWNLOAD_SUCCESS",
        payload: {
          filename: storage.getPluginData("filename") + '.js',
          text: getFileText()
        }
      })
      break;

    case "COPY_AS_TEXT":
      figma.ui.postMessage({
        type: "COPY_AS_TEXT_SUCCESS",
        payload: {
          text: getFileText()
        }
      })
      break;
  }
};

const initialSettings = {}
for (let name in settingDefaults) {
  initialSettings[name] = storage.getPluginData(name)
}
figma.ui.postMessage({
  type: "INIT",
  payload: initialSettings
})