import "./figma-plugin-ds.min.css";
import "./figma-plugin-ds.min.js";
import "./ui.css";

import paper from "paper/dist/paper-core";
import copyToClipboard from "copy-to-clipboard";

const TARGET_IDS = [
  "download",
  "copyAsText",
  "filenameLabel",
  "settings",
  "framePrefix",
  "filename",
  "preserveMargins",
];
const targets = TARGET_IDS.reduce((result, name) => {
  result[name] = document.getElementById(name);
  return result;
}, {});

const paperCanvas = document.createElement("canvas");
paper.setup(paperCanvas);

function toFileText(iconData) {
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
  };
  emit("UPDATE_SETTINGS", newSettings);
  updateView();
});
