const glob = require("glob");
const fs = require("fs");
const stylelint = require("stylelint");

const cssFiles = glob.sync("**/*.css", {
  nodir: true,
  ignore: ["**/node_modules/**", "**/public/**"],
});
const ignoreList = [];
cssFiles.forEach((file) => {
  const css = fs.readFileSync(file, "utf8");
  stylelint
    .lint({
      code: css,
      configFile: ".stylelintrc.json",
      formatter: "json",
    })
    .then((result) => {
      if (result.errored) {
        ignoreList.push(file);
        fs.writeFileSync(".stylelintignore", ignoreList.join("\n"));
      }
    });
});
