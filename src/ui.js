import "./figma-plugin-ds.min.css";
import "./figma-plugin-ds.min.js";
import "./ui.css";

import paper from "paper/dist/paper-core";
import copyToClipboard from "copy-to-clipboard";

//all very hacky. I couldn't get paper-jsdom working, so i'm just using it on the browser side.

const TARGET_IDS = [
  "download",
  "copyAsText",
  "filenameLabel",
  "settings",
  "framePrefix",
  "filename",
  "preserveMargins",
  "outputType",
];
const targets = TARGET_IDS.reduce((result, name) => {
  result[name] = document.getElementById(name);
  return result;
}, {});

const paperCanvas = document.createElement("canvas");
paper.setup(paperCanvas);

const fileTextFunctions = {
  'xamarin-forms'(iconData, documentName) {
    const output = iconData
      .map((data) => {
        const p = new paper.CompoundPath(data.pathData);
        p.reorient(false, true);
        const correctedPathData = p.pathData;
        return `\t<PathGeometry x:Name="${data.varName}" Figures="${correctedPathData}" />`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="utf-8"?>

<!-- generated from Figma document "${documentName}" using the "FontAwesome Export" plugin -->
<ResourceDictionary xmlns="http://xamarin.com/schemas/2014/forms"
                    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml">
${output}
</ResourceDictionary>
  `;
  },

  'font-awesome'(iconData, documentName) {
    const output = iconData
      .map((data) => {
        const p = new paper.CompoundPath(data.pathData);
        p.reorient(false, true);
        if (data.preserveMargins) {
          p.translate(new paper.Point(data.offsetX, data.offsetY));
        }
        const correctedPathData = p.pathData;
        return `export const ${data.varName} = ${JSON.stringify({
          prefix: "fas",
          iconName: data.iconName,
          icon: [
            data.preserveMargins ? data.width : data.iconWidth,
            data.preserveMargins ? data.height : data.iconHeight,
            [],
            data.unicode,
            correctedPathData,
          ],
        })};`;
      })
      .join("\n");

    return `// generated from Figma document "${documentName}" using the "FontAwesome Export" plugin
${output}
  `;
  }
};

function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function updateView() {
  targets.filenameLabel.innerHTML = targets.filenameLabel.value + ".js";
}

onmessage = (e) => {
  const { type, payload } = e.data.pluginMessage;
  switch (type) {
    case "INIT":
      const settings = payload;
      targets.framePrefix.value = settings.framePrefix;
      targets.filenameLabel.value = settings.filename;
      if (settings.preserveMargins === 'true') {
        targets.preserveMargins.checked = true;
      } else {
        targets.preserveMargins.removeAttribute("checked");
      }
      Array.from(targets.outputType.options).forEach(o => {
        if (o.value === settings.outputType) {
          o.selected = true;
        }
        else {
          o.removeAttribute("selected")
        }
      })
      updateView();
      break;

    case "DOWNLOAD_SUCCESS": {
      const { filename, data, documentName } = payload;
      const outputType = targets.outputType.options[targets.outputType.selectedIndex].value;
      download(filename, fileTextFunctions[outputType](data, documentName));
      break;
    }

    case "COPY_AS_TEXT_SUCCESS": {
      const { data, documentName } = payload;
      const outputType = targets.outputType.options[targets.outputType.selectedIndex].value;
      copyToClipboard(fileTextFunctions[outputType](data, documentName));
      break;
    }

    default:
      console.warn(`Unknown message from plugin:
type:    "${type}"
payload: "${JSON.stringify(payload)}"`);
      break;
  }
};

function emit(type, payload) {
  if (!type) return;
  const message = {
    type: type,
  };
  if (payload) message.payload = payload;
  parent.postMessage({ pluginMessage: message }, "*");
}

targets.download.addEventListener("click", (e) => {
  emit("DOWNLOAD");
});

targets.copyAsText.addEventListener("click", (e) => {
  emit("COPY_AS_TEXT");
});

targets.settings.addEventListener("change", (e) => {
  const newSettings = {
    preserveMargins: targets.preserveMargins.checked ? 'true' : 'false',
    filename: targets.filename.value,
    framePrefix: targets.framePrefix.value,
    outputType: targets.outputType.options[targets.outputType.selectedIndex].value,
  };
  emit("UPDATE_SETTINGS", newSettings);
  updateView();
});
