import { camelCase, kebabCase } from 'lodash';

figma.showUI(__html__, { height: 226 });

const PREFIX_VAR = 'fa'
const PREFIX_SET = 'fas'
const VECTORABLES = [
  'BOOLEAN_OPERATION',
]

const storage = figma.root

const settingDefaults = {
  framePrefix: 'icon',
  filename: 'icons',
  preserveMargins: 'true',
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

function isCompletelyTransparent(node: GeometryMixin): boolean {
  if (node.fillStyleId) {
    const style = figma.getStyleById(node.fillStyleId.toString())
    if (style.type === 'PAINT') {
      //@ts-ignore
      const paintStyle: PaintStyle = style;
      if (paintStyle.paints.some(p => p.visible && p.opacity > 0)) {
        return false
      }
    }
  } else {
    //@ts-ignore
    if (node.fills.some(p => p.visible && p.opacity > 0)) {
      return false
    }
  }

  if (node.strokeStyleId) {
    const style = figma.getStyleById(node.strokeStyleId.toString())
    if (style.type === 'PAINT') {
      //@ts-ignore
      const paintStyle: PaintStyle = style;
      if (paintStyle.paints.some(p => p.visible && p.opacity > 0)) {
        return false
      }
    }
  } else {
    //@ts-ignore
    if (node.strokes.some(p => p.visible && p.opacity > 0)) {
      return false
    }
  }

  return true
}

function getIconData() {
  const iconFrames: Array<FrameNode> = figma.root.findAll(n => (n.type === 'FRAME' || n.type === 'COMPONENT') && matchesPrefix(n.name)) as Array<FrameNode>

  //TODO: resolve winding rules
  let unicodeCounter = 1
  const results = []
  iconFrames.forEach(frame => {

    const descendents = frame.findAll(n =>
      (
        n.type === 'BOOLEAN_OPERATION' ||
        n.type === 'ELLIPSE' ||
        n.type === 'FRAME' ||
        n.type === 'LINE' ||
        n.type === 'POLYGON' ||
        n.type === 'RECTANGLE' ||
        n.type === 'STAR' ||
        n.type === 'TEXT' ||
        n.type === 'VECTOR'
      )
      && n.visible
      && n.parent.type !== 'BOOLEAN_OPERATION'
      && !isCompletelyTransparent(n)
    )

    if (descendents.length === 0) return

    //hacky hack hack. 
    const clonedDescendents = descendents.map(n => {
      let cloned = n.clone()
      //@ts-ignore
      if (n.outlineStroke) {
        //@ts-ignore
        const strokes = cloned.outlineStroke()
        if (strokes != null) {
          cloned = figma.flatten([figma.union([strokes, cloned], figma.currentPage)])
        }
      }

      return cloned
    })

    const boolean = figma.union(clonedDescendents, figma.currentPage);
    const flattened = figma.flatten([boolean], figma.currentPage);

    const unicode = 'e' + unicodeCounter.toString().padStart(3, '0')
    unicodeCounter++
    const pathData = flattened.vectorPaths.map(p => p.data).join(' ')
    results.push({
      offsetX: flattened.x,
      offsetY: flattened.y,
      varName: camelCase(PREFIX_VAR + ' ' + frame.name),
      prefix: PREFIX_SET,
      iconName: toIconName(frame.name),
      width: frame.width,
      height: frame.height,
      iconWidth: flattened.width,
      iconHeight: flattened.height,
      unicode: unicode,
      pathData: pathData,
      preserveMargins: storage.getPluginData("preserveMargins") === 'true' ? true : false,
    })

    flattened.remove();
  })

  return results
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
          data: getIconData()
        }
      })
      break;

    case "COPY_AS_TEXT":
      figma.ui.postMessage({
        type: "COPY_AS_TEXT_SUCCESS",
        payload: {
          data: getIconData()
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