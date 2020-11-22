const { createPlugins } = require("rollup-plugin-atomic")

const plugins = createPlugins(["js", "babel", "coffee"])

module.exports = {
  input: "src/atom-utils.js",
  output: [
    {
      dir: "lib",
      format: "cjs",
      sourcemap: true,
    },
  ],
  plugins: plugins,
}
