"use strict"

const GlobSync = require("glob").GlobSync;
const path = require("path");

const VirtualModulesPlugin = require('webpack-virtual-modules');

class ResourceMatcher {
  constructor(cwd, {src, type}) {
    const g = new GlobSync(src, {cwd});
    this._matcher = g.minimatch;
    this.found = g.found;
    this.type = type;
  }

  matches(path) {
    return this._matcher.match(path);
  }
}

class ResourceTree {
  constructor(cwd, files) {
    this._matchers = [];
    this.found = [];
    for (let file of files) {
      const m = new ResourceMatcher(path.resolve(cwd), file);
      this._matchers.push(m);
      for (let found of m.found) {
        this.found.push([found, m.type]);
      }
    }
    this.found.sort((f1, f2) => f1[0].localeCompare(f2[0]));
  }

  _findIndex(path) {
    let i = 0;
    let j = this.found.length - 1;

    while (i <= j) {
      const mi = (i+j) >>> 1;
      const mv = this.found[mi][0];
      if (mv === path) return mi;
      if (mv < path) i = mi + 1;
      else j = mi - 1;
    }

    return ~i;
  }

  match(path) {
    return this._matchers.find(m => m.matches(path))?.type;
  }

  offer(path) {
    const i = this._findIndex(path);
    if (i >= 0) return;

    const type = this.match(path);
    if (!type) return;

    this.found.splice(~i, 0, [path, type]);
    this._dirty = true;
    return type;
  }

  remove(path) {
    const i = this._findIndex(path);
    if (i < 0) return;

    this._dirty = true;
    return this.found.splice(i, 1)[0];
  }

  _dirty = true;

  get source() {
    if (!this._dirty) return this._source = this._source + " ";
    console.log("Rebuilding resource tree")

    const audio = {};
    const files = [];

    for (let [src, type] of this.found) {
      let name = path.basename(src, path.extname(src));
      switch (type) {
        case "audio":
          if (audio.hasOwnProperty(name)) {
            continue;
          }
          audio[name] = true;
          src = path.dirname(src) + "/";
          break;

        case "fontface":
          name = cssSafe(name);
          src = `url(${cssSafe(src)})`;
          break;
      }
      files.push({name, type, src});
    }

    this._dirty = false;
    return this._source = JSON.stringify(files);
  }
}

function cssSafe(string) {
  return `'${string.replace(/(['\\])/g, "\\$1")}'`;
}

module.exports = class ResourceTreePlugin extends VirtualModulesPlugin {
  constructor({path, files, cwd="."}) {
    if (!/\.json$/.test(path)) throw new Error("Only JSON path supported by ResourceTree plugin.");
    super();

    this._path = path;
    this._files = files.flatMap(f => f.src.map(src => ({src, type: f.type})));
    this._cwd = cwd;
  }

  apply(compiler) {
    super.apply(compiler);

    compiler.hooks.watchRun.tap("ResourceTreePlugin.watch", () => this._startWatching());
    compiler.hooks.compile.tap("ResourceTreePlugin", () => this._buildTree());
  }

  _startWatching() {
    if (this._watching) return;
    this._watching = {};
  }

  _buildTree() {
    if (this._ready) return;

    const tree = new ResourceTree(this._cwd, this._files);
    super.writeModule(this._path, tree.source);

    if (this._watching) {
      const chokidar = require("chokidar");
      
      const cwd = this._cwd;
      const baseDirs = tree.found
        .map(f => path.relative(".", f[0]).split(path.sep)[0])
        .reduce((baseDirs, dir) => {
          if (!baseDirs.includes(dir)) baseDirs.push(dir);
          return baseDirs;
        }, []);

      chokidar.watch(baseDirs, {cwd}).on("change", resource =>
        tree.match(resource) && super.writeModule(this._path, tree.source));
      chokidar.watch(baseDirs, {cwd}).on("add", resource =>
        tree.offer(resource) && super.writeModule(this._path, tree.source));
      chokidar.watch(baseDirs, {cwd}).on("unlink", resource =>
        tree.remove(resource) && super.writeModule(this._path, tree.source));
    }

    this._ready = true;
  }
};

