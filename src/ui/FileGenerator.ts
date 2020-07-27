import copyToClipboard from "copy-to-clipboard";
import paper from "paper/dist/paper-core";
import type { PluginData, FormatPlugin, FormatPluginConstructor } from "../types";

export default class FileGenerator {
    public plugins: { [key: string]: FormatPlugin } = {};
    private canvas: HTMLCanvasElement = document.createElement("canvas");

    constructor() {
        paper.setup(this.canvas);
    }

    private generate(data: PluginData) {
        //corrects winding order and some other things. Couldn't figure out how to do this in code.ts.
        data.icons.forEach(icon => {
            const p = new paper.CompoundPath(icon.data);
            p.reorient(false, true);
            if (data.pluginSettings.preserveMargins) {
                console.log('yes');
                p.translate(new paper.Point(icon.offsetX, icon.offsetY));
            }
            icon.data = p.pathData;
        })

        const plugin = this.plugins[data.pluginSettings.format];
        const fileText = plugin.generateFileText(data);
        const fileName = `${data.pluginSettings.fileName ?? "Icons"}.${plugin.getFileExtension()}`;
        return { fileName, fileText };
    }

    public copyToClipboard(data: PluginData) {
        const { fileText } = this.generate(data);
        copyToClipboard(fileText);
    }

    public download(data: PluginData) {
        const { fileName, fileText } = this.generate(data);

        const a = document.createElement("a");
        a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileText));
        a.setAttribute("download", fileName);
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    public use(plugin: FormatPluginConstructor) {
        const pluginInstance = new plugin();
        this.plugins[pluginInstance.getFormatName()] = pluginInstance;
    }
}