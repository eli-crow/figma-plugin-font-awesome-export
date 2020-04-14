import {camelCase} from 'lodash'

figma.showUI(__html__);

const PREFIX_VAR = 'fa'

figma.ui.onmessage = ({ type }) => {
  switch (type) {
    case "LINK_SELECTED":
      for (var selectedNode of figma.currentPage.selection) {
        if (selectedNode.type === "FRAME") {
          selectedNode.setPluginData("export", "true");
        }
      }
      figma.ui.postMessage({
        type: "LINK_SELECTED_SUCCESS"
      });
      break;

    case "UNLINK_SELECTED":
      for (var selectedNode of figma.currentPage.selection) {
        if (selectedNode.type === "FRAME") {
          selectedNode.setPluginData("export", "");
        }
      }
      figma.ui.postMessage({
        type: "UNLINK_SELECTED_SUCCESS"
      });
      break;

    case "EXPORT_ALL":
      let unicodeCounter = 1
      const all = figma.root.findAll(n => n.getPluginData("export") === "true")
      const results = []

      function processVector(frame: FrameNode, vector: VectorNode) {
        const varName = camelCase(PREFIX_VAR + ' ' + frame.name)
        const unicode = 'e' + unicodeCounter.toString().padStart(3, '0')
        const pathData = vector.vectorPaths.map(p => p.data).join('')
        unicodeCounter++
        results.push({
          varName: varName,
          prefix: 'fas',
          iconName: frame.name,
          icon: [frame.width, frame.height, [], unicode, pathData]
        })
      }

      //TODO: outline strokes(?), boolean add everything, flatten all children to one path
      //TODO: resolve transforms before export
      //TODO: resolve winding rules
      all.forEach(n => {
        if (n.type === "FRAME") {
          const frame: FrameNode = n;
          if (frame.children.length !== 1) {
            return
          }
          const child = frame.children[0]
          switch (child.type) {
            case "VECTOR":
              processVector(frame, child);
              break;

            case "ELLIPSE":
            case "POLYGON":
            case "RECTANGLE":
            case "STAR":
            case "BOOLEAN_OPERATION":
              const clone = child.clone()
              const vector: VectorNode = figma.flatten([clone]);
              processVector(frame, vector);
              clone.remove()
              vector.remove()
              break;

            default:
              break;
          }
        }
      })

      const output = results
        .map(result => {
          const { varName, ...rest } = result
          return `export const ${varName} = ${JSON.stringify(rest)};`
        })
        .join('\n');

      figma.ui.postMessage({
        type: "EXPORT_ALL_SUCCESS",
        payload: output
      })
      break;
  }
};
