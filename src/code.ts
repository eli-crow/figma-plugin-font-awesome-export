import type { IconData, PluginData, PluginSettings } from './types';

const storage = figma.root

function getPluginSettings(): PluginSettings {
  return JSON.parse(storage.getPluginData("pluginSettings") || "null") || {};
}

function setPluginSettings(settings: PluginSettings): void {
  storage.setPluginData("pluginSettings", JSON.stringify(settings));
  figma.ui.postMessage({
    type: "SETTINGS_UPDATED",
    payload: settings
  })
}

function matchesPrefix(string: string): boolean {
  const settings = getPluginSettings();
  const prefixRegex = new RegExp(`^\\s*${settings.framePrefix}\\s*/\\s*`, 'g')
  return Boolean(string.match(prefixRegex))
}

function toIconName(string: string): string {
  const settings = getPluginSettings();
  const prefixRegex = new RegExp(`^\\s*${settings.framePrefix}\\s*/\\s*`, 'g')
  return string.trim().replace(prefixRegex, '')
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

function getIconData(): IconData[] {
  const iconFrames: Array<FrameNode> = figma.root.findAll(n =>
    (n.type === 'FRAME' || n.type === 'COMPONENT')
    && n.visible
    && n.opacity > 0
    && matchesPrefix(n.name)
  ) as Array<FrameNode>

  const results: IconData[] = [];
  iconFrames.forEach(frame => {

    const descendents = frame.findAll(n =>
      (
        n.type === 'BOOLEAN_OPERATION' ||
        n.type === 'ELLIPSE' ||
        n.type === 'LINE' ||
        n.type === 'POLYGON' ||
        n.type === 'RECTANGLE' ||
        n.type === 'STAR' ||
        n.type === 'TEXT' ||
        n.type === 'VECTOR'
      )
      && n.parent.type !== 'BOOLEAN_OPERATION'
      && n.opacity > 0
      && n.visible
      && !isCompletelyTransparent(n)
    )

    if (descendents.length === 0) return

    //hacky hack hack.
    const clonedDescendents = descendents.map(n => {
      const clone = n.clone()
      if (frame.rotation !== 0) {
        clone.rotation -= frame.rotation;
      }

      try {
        //@ts-ignore
        if (clone.outlineStroke) {
          //@ts-ignore
          const strokes = clone.outlineStroke()
          if (strokes != null) {
            const union = figma.union([strokes, clone], figma.currentPage)
            const flat = figma.flatten([union], figma.currentPage)
            return flat
          }
          else {
            const flat = figma.flatten([clone], figma.currentPage)
            return flat
          }
        }
        else {
          const flat = figma.flatten([clone], figma.currentPage)
          return flat
        }
      }
      catch (e) {
        return null;
      }
    }).filter(n => n !== null)

    if (clonedDescendents.length <= 0) {
      return;
    }

    const finalUnion = figma.union(clonedDescendents, figma.currentPage);
    const flattened = figma.flatten([finalUnion], figma.currentPage);

    const iconData: IconData = {
      name: toIconName(frame.name),
      width: frame.width,
      height: frame.height,
      offsetX: flattened.x,
      offsetY: flattened.y,
      iconWidth: flattened.width,
      iconHeight: flattened.height,
      data: flattened.vectorPaths.map(p => p.data).join(' '),
    };
    // Don't add duplicates
    if (!results.some(existingIcon => existingIcon.name === iconData.name)) {
      results.push(iconData);
    }

    flattened.remove()
  })

  return results.reverse()
}

figma.ui.onmessage = ({ type, payload }) => {
  if (type === "UPDATE_SETTINGS") {
    setPluginSettings(payload as PluginSettings)
  }
  else if (type === "DOWNLOAD") {
    const payload: PluginData = {
      pluginSettings: getPluginSettings(),
      figmaDocumentName: figma.root.name,
      icons: getIconData()
    }
    figma.ui.postMessage({
      type: "DOWNLOAD_SUCCESS",
      payload: payload
    })
  }
  else if (type === "COPY") {
    const payload: PluginData = {
      pluginSettings: getPluginSettings(),
      figmaDocumentName: figma.root.name,
      icons: getIconData()
    }
    figma.ui.postMessage({
      type: "COPY_SUCCESS",
      payload: payload
    })
  }
};

function init() {
  figma.showUI(__html__, { width: 320, height: 280 });
  const settingDefaults: PluginSettings = {
    framePrefix: 'icon',
    fileName: 'icons',
    preserveMargins: true,
    format: 'Font Awesome JS Library',
  };
  setPluginSettings({
    ...settingDefaults,
    ...getPluginSettings(),
  });
  figma.ui.postMessage({
    type: "INIT",
    payload: getPluginSettings(),
  })
}

init();