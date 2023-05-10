const fs = require("fs-extra");
const path = require("path");
const stylelint = require("stylelint");
const glob = require("glob");

// Путь до файлов, которые нужно проверить
const stylelintignorePath = path.resolve(".stylelintignore");
const readFile = fs.readFileSync(stylelintignorePath, "utf8").split("\n");

// Функция, которая проверяет файл на ошибки и добавляет игнор-директивы
async function lintFile(filePath) {
  const fileContent = await fs.readFile(filePath, "utf-8");

  // Проверяем файл на ошибки
  const lintResult = await stylelint.lint({
    code: fileContent,
    configFile: ".stylelintrc.json",
  });

  // Если в файле есть ошибки, добавляем игнор-директивы
  if (lintResult.errored) {
    const errors = lintResult.results[0].warnings;

    // Ищем уже существующие игнор-директивы в файле
    const existingIgnores = fileContent
      .split("\n")
      .filter((line) => line.includes("stylelint-disable-next-line"));

    // Функция для проверки, нужно ли добавлять игнор-директиву для данной ошибки
    function shouldIgnoreError(error) {
      const lineWithError = fileContent.split("\n")[error.line - 1];

      // Если в строке уже есть игнор-директива, то не добавляем новую
      if (lineWithError.includes("stylelint-disable-next-line")) {
        return false;
      }

      // Если в файле уже есть игнор-директива для всего файла, то не добавляем новые игноры
      if (
        existingIgnores.length > 0 &&
        existingIgnores[0].includes("stylelint-disable")
      ) {
        return false;
      }

      // Иначе, добавляем игнор-директиву
      return true;
    }

    errors;

    const fileLines = fileContent.split("\n");
    // Добавляем игнор-директивы для каждой ошибки
    errors
      .sort((a, b) => a.line - b.line)
      .filter(shouldIgnoreError)
      .map((error, index) =>
        fileLines.splice(
          error.line - 1 + index,
          0,
          `/* stylelint-disable-next-line ${error.rule} */`
        )
      );
    // Записываем изменения в файл
    await fs.writeFile(filePath, fileLines.join("\n"), "utf-8");
  }
}

// Проходимся по всем файлам и проверяем их на ошибки
Promise.all(readFile.map((filePath) => lintFile(filePath))).then(() => {
  fs.writeFile(stylelintignorePath, "", "utf-8");
  console.log("Done!");
});
