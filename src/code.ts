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

function getFileText() {
  let unicodeCounter = 1
  const all = figma.root.findAll(
    n => n.type === 'FRAME' && n.name.trim().startsWith(storage.getPluginData("framePrefix")))
  const results = []

  //TODO: outline strokes(?), boolean add everything, flatten all children to one path
  //TODO: resolve transforms before export
  //TODO: resolve winding rules
  all.forEach(n => {
    if (n.type === "FRAME") {
      const frame: FrameNode = n;
      if (frame.children.length <= 0) return;

      const clone = frame.clone()
      const vector = figma.flatten(clone.children)

      const varName = camelCase(PREFIX_VAR + ' ' + frame.name)
      const iconName = kebabCase(frame.name.trim().replace(new RegExp(`^${storage.getPluginData("framePrefix")}\\s*/\\s*`, 'g'), ''))
      const unicode = 'e' + unicodeCounter.toString().padStart(3, '0')
      const pathData = vector.vectorPaths.map(p => p.data).join('')
      unicodeCounter++
      results.push({
        varName: varName,
        prefix: PREFIX_SET,
        iconName: iconName,
        icon: [frame.width, frame.height, [], unicode, pathData]
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