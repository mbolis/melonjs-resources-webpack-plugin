# melonjs-resources-webpack-plugin
A Webpack plugin to automatically generate a resources module for MelonJS games

## Usage
Install package from NPM repository:
```bash
npm i -D melonjs-resources-webpack-plugin
```

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
      cwd: "./public",            // optional
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

Files will be searched following the provided [glob](https://www.npmjs.com/package/glob#glob-primer) expressions, starting from `cwd` (default: `"."`).  
Note that `cwd` will not be present in the generated URLs.

Using the previous example configuration, you can import the resources into your game like this:

```js
// ./src/game.js

import resources from "./resources.json";
me.loader.preload(resources, () => this.loaded());
```
