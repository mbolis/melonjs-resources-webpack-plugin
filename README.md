# melonjs-resources-webpack-plugin
A Webpack plugin to automatically generate a resources module for MelonJS games

## Usage
Include in `webpack.config.js` and configure as follows:
```js
// ./webpack.config.js

const MelonjsResourcesPlugin = require("melonjs-resources-webpack-plugin");

module.exports = {
  // ...

  plugins: [
    // ...

    new MelonjsResourcesPlugin({
      path: "./src/resources.json", // change as you see fit
      files: [
        {
          src: ["data/@(bgm|sfx|audio)/**/*"],
          type: "audio"
        },
        {
          src: ["data/fnt/**/*.fnt"],
          type: "binary"
        },
        {
          src: ["data/fnt/**/*.@(eot|woff|woff2|ttf|ttc|svg)"],
          type: "fontface"
        },
        { 
          src: ["data/@(img|gfx|fnt)/**/*.png"],
          type: "image"
        },
        {
          src: ["data/@(img|gfx)/**/*.json"],
          type: "json"
        },
        {
          src: ["data/map/**/*.@(tmx|json)"],
          type: "tmx"
        },
        {
          src: ["data/map/**/*.tsx"],
          type: "tsx"
        }
      ] 
    })
  ]
};
```

The resources file will be added as a virtual module (not written to disk) and accessible at the position specified with the `path` option.  
The specified file should not exist, otherwise it will be overwritten (TODO: merge existing files).

**Note** that `path`'s extension must be `.json`.

Using the previous example configuration, you can import the resources into your game like this:

```js
// ./src/game.js

import resources from "./resources.json";
me.loader.preload(resources, () => this.loaded());
```
