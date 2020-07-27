# Figma Plugin: Awesome Icon Export (Beta)

Take control of your iconography by connecting the best icon system of all time with the best design tool of all time. Export your Figma layers into FontAwesome's javascript icon library format for use on the web.

* Works with almost all figma objects
* Completely Non-destructive: you don't have to flatten strokes, vector networks, text, or anything. Keep everything in its pristine, editable glory. You don't need to worry about colors or frame sizes either.

> WARNING: this is in beta. Expect bugs! If you find any, submit them [here](https://github.com/eli-crow/figma-plugin-font-awesome-export/issues).

Turns this:
<!-- image of icons -->

Into this:
``` js
// generated from Figma document using the "FontAwesome Custom Icon Export" plugin
export const faIconCard = {"prefix":"fas","iconName":"card","icon":[23.698854446411133,23.92340087890625,[],"e001","M11.84943,23.9234h-9.84943c-1.10457,0 -2,-0.89543 -2,-2v-19.9234c0,-1.10457 0.89543,-2 2,-2h19.69885c1.10457,0 2,0.89543 2,2v9.9617zM20.69885,3h-17.69885v17.9234h7.34943v-7.9617c0,-1.38071 1.11929,-2.5 2.5,-2.5h7.84943zM13.34943,18.1464l4.64073,-4.6847h-4.64073z"]};
export const faIconDividerV = {"prefix":"fas","iconName":"divider-v","icon":[23.698854446411133,23.92340087890625,[],"e002","M13.34943,3v17.9234h7.34943v-17.9234zM3,3v17.9234h7.34943v-17.9234zM21.69885,0c1.10457,0 2,0.89543 2,2v19.9234c0,1.10457 -0.89543,2 -2,2h-19.69885c-1.10457,0 -2,-0.89543 -2,-2v-19.9234c0,-1.10457 0.89543,-2 2,-2z"]};
export const faIconDividerH = {"prefix":"fas","iconName":"divider-h","icon":[23.923402786254883,23.698856353759766,[],"e003","M20.9234,13.34943l-17.9234,0l0,7.34943h17.9234zM20.9234,3l-17.9234,0l0,7.34943l17.9234,0zM23.9234,21.69886c0,1.10457 -0.89543,2 -2,2h-19.9234c-1.10457,0 -2,-0.89543 -2,-2l0,-19.69885c0,-1.10457 0.89543,-2 2,-2l19.9234,0c1.10457,0 2,0.89543 2,2z"]};
// ...
```

Which means you can do this:
<!-- example gif showing off fontawesome capabilities -->

## Settings
Settings are stored on a project by project basis.
* __Frame Prefix__: The plugin will export all frames with this before the first slash (_example:_ `icon / close`, `icon / download`). Everything after the first slash will be converted to `kebab-case` and used as the icon's name.
* __Filename__: The name of the file to be downloaded 
* __Preserve Margins__: When enabled, the space around the icon in the frame will be included in the icon export – otherwise the icon's `viewBox` will be fit to the bounds of thie icon.

## Bug Reports / Feature Requests
Please submit all bug reports and ideas on the GitHub repo's [issue page](https://github.com/eli-crow/figma-plugin-font-awesome-export/issues).

## Installing Your Custom Icons
``` js
import { library } from '@fortawesome/fontawesome-svg-core';
import * as customIcons from './path/to/icons.js';
import { faCheck, faTimes } from '@fortawesome/free-solid-icons';

//add all custom icons
library.add(customIcons)
//plays well with official icons
library.add(faCheck, faTimes)
```

### Vue Example
``` js
// main.js
import Vue from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import * as customIcons from './path/to/icons.js';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
library.add(customIcons)
```

If you want to enable the component globally:
``` js
// main.js
Vue.component('Icon', FontAwesomeIcon)
```

If you just want to import it in a single component:
``` jsx
<!-- SomeComponent.vue -->
<template>
    <div>
        <FontAwesomeIcon icon="custom-icon-name"/>
    </div>
</template>

<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
export default {
    components: {
        FontAwesomeIcon
    }
}
</script>
```

### React Example
``` jsx
// SomeComponent.js
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCustomIcon } from './path/to/icons.js';

export default (props) => {
    <div>
        <FontAwesomeIcon icon={faCustomIcon}/>
    </div>
}
```

For more info, read [the official documentation](https://fontawesome.com/how-to-use/on-the-web/advanced/svg-javascript-core).
