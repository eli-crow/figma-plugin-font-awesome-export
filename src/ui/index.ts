
import "./ui.css";

import FileGenerator from "./FileGenerator";
import FontAwesomeJSPlugin from "./plugins/FontAwesomeJSPlugin";
import XamarinFormsResourceDictionaryPlugin from "./plugins/XamarinFormsPathGeometryPlugin";
import { PluginSettings, PluginData } from "types";

//all very hacky. I couldn't get paper-jsdom working, so i'm just using it on the browser side.

const targets = {
  framePrefix: document.querySelector<HTMLInputElement>("#framePrefix"),
  filenameLabel: document.querySelector<HTMLElement>("#filenameLabel"),
  preserveMargins: document.querySelector<HTMLInputElement>("#preserveMargins"),
  fileName: document.querySelector<HTMLInputElement>("#fileName"),
  fileExtension: document.querySelector<HTMLInputElement>("#fileExtension"),
  format: document.querySelector<HTMLSelectElement>("#format"),
  download: document.querySelector<HTMLButtonElement>("#download"),
  copyAsText: document.querySelector<HTMLButtonElement>("#copyAsText"),
  pluginSettings: document.querySelector<HTMLFormElement>("#pluginSettings"),
}

const generator = new FileGenerator();
generator.use(FontAwesomeJSPlugin);
generator.use(XamarinFormsResourceDictionaryPlugin);

function emit(type: string, payload?: any) {
  const pluginMessage: { type: string, payload?: any } = { type };
  if (payload) pluginMessage.payload = payload;
  parent.postMessage({ pluginMessage }, "*");
}

function updateView(settings: PluginSettings) {
  const activePlugin = generator.plugins[settings.format];

  targets.framePrefix.value = settings.framePrefix;

  targets.filenameLabel.innerText = `${settings.fileName}.${activePlugin.getFileExtension()}`;

  targets.fileExtension.innerText = `.${activePlugin.getFileExtension()}`;

  if (settings.preserveMargins) targets.preserveMargins.checked = true;
  else targets.preserveMargins.removeAttribute("checked");

  targets.format.innerHTML = '';
  for (let name in generator.plugins) {
    const o = document.createElement('option');
    o.value = name;
    o.innerText = name;
    if (name === settings.format) o.selected = true;
    targets.format.appendChild(o);
  }
}

function init(settings: PluginSettings) {
  updateView(settings);
  targets.download.addEventListener("click", (e) => {
    emit("DOWNLOAD");
  });
  targets.copyAsText.addEventListener("click", (e) => {
    emit("COPY");
  });
  targets.pluginSettings.addEventListener("change", (e) => {
    const newSettings: PluginSettings = {
      preserveMargins: targets.preserveMargins.checked ? true : false,
      fileName: targets.fileName.value,
      framePrefix: targets.framePrefix.value,
      format: targets.format.options[targets.format.selectedIndex].value,
    }
    emit("UPDATE_SETTINGS", newSettings);
  });
}

onmessage = (e) => {
  const { type, payload } = e.data.pluginMessage;
  if (type === "INIT") {
    init(payload as PluginSettings);
  }
  else if (type === "SETTINGS_UPDATED") {
    updateView(payload as PluginSettings);
  }
  else if (type === "DOWNLOAD_SUCCESS") {
    generator.download(payload as PluginData);
  }
  else if (type === "COPY_SUCCESS") {
    generator.copyToClipboard(payload as PluginData);
  }
};