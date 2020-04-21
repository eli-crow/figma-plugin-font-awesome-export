import "./figma-plugin-ds.min.css";
import "./figma-plugin-ds.min.js";
import "./ui.css";

import paper from "paper/dist/paper-core";

import copyToClipboard from "copy-to-clipboard";

const downloadEl = document.getElementById("download");
const copyAsTextEl = document.getElementById("copyAsText");
const filenameLabelEl = document.getElementById("filenameLabel");
const settingsEl = document.getElementById("settings");
const framePrefixEl = document.getElementById("framePrefix");
const filenameEl = document.getElementById("filename");
// const previewGroupEl = document.getElementById("previewGroup");

const paperCanvas = document.createElement("canvas");
paper.setup(paperCanvas);

function toFileText(iconData) {
  const output = iconData
    .map((data) => {
      const p = new paper.CompoundPath(data.pathData);
      p.reorient(false, true);
      p.translate(new paper.Point(data.offsetX, data.offsetY))
      const correctedPathData = p.pathData;
      return `export const ${data.varName} = ${JSON.stringify({
        prefix: "fas",
        iconName: data.iconName,
        icon: [data.width, data.height, [], data.unicode, correctedPathData],
      })};`;
    })
    .join("\n");

  return `// generated from Figma document using the "FontAwesome Custom Icon Export" plugin
${output}
`;
}

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
  filenameLabelEl.innerHTML = filenameEl.value + ".js";
}

onmessage = (e) => {
  const { type, payload } = e.data.pluginMessage;
  switch (type) {
    case "INIT":
      const settings = payload;
      framePrefixEl.value = settings.framePrefix;
      filenameEl.value = settings.filename;
      updateView();
      break;

    case "DOWNLOAD_SUCCESS": {
      const { filename, data } = payload;
      download(filename, toFileText(data));
      break;
    }

    case "COPY_AS_TEXT_SUCCESS": {
      const { data } = payload;
      copyToClipboard(toFileText(data));
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

downloadEl.addEventListener("click", (e) => {
  emit("DOWNLOAD");
});

copyAsTextEl.addEventListener("click", (e) => {
  emit("COPY_AS_TEXT");
});

settingsEl.addEventListener("change", (e) => {
  const newSettings = {};
  for (var el of settingsEl.elements) {
    newSettings[el.id] = el.value;
  }
  emit("UPDATE_SETTINGS", newSettings);
  updateView();
});
