#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const program = require("commander");
const inquirer = require("inquirer");
const ejs = require("ejs");
const { version } = require("./../package.json");
const questions = require("./questions");
const templates = require("./template-names");
const chalk = require("chalk");
const exec = require("child_process").exec;
let error = false;
let reflections = {};

// Current working directory
const templatePath = path.join(__dirname, `../templates`);
const reactTemplatePath = templatePath + "/react_+_node";

/**
 * Check if the particular file is actual file or a folder
 *
 * @param {Object} file File Object
 *
 * @return {boolean} TRUE: If file else FALSE
 */
const isFile = file => {
  return file.isFile();
};

const parseEjs = (filePath, data) => {
  const fileContent = fs.readFileSync(filePath).toString();
  return ejs.render(fileContent, reflections);
};

/**
 * Copy files recursively from the source to destination
 *
 * @param {string} from Source from where copy starts
 * @param {string} to Destination where to copy
 *
 * @return {void}
 */
const copyRecursively = (from, to) => {
  // Make the destination directory
  try {
    fs.mkdirSync(to);
  } catch (e) {
    if (e.code === "EEXIST") {
      error = true;
      console.log(chalk.red.bold("\nDirectory already present. ❌ \n"));
    }
    return;
  }

  const files = fs.readdirSync(from, { withFileTypes: true });

  // Loop through the file and checking if type is file then just copy else repeat copyRecursively
  files.forEach(file => {
    const newFrom = `${from}/${file.name}`;
    const newTo = `${to}/${file.name}`;

    // Check file is file or directory
    if (isFile(file)) {
      // Copy file in a sync way
      // Check if the file is ejs then need parse template out of it
      if (path.extname(file.name) === ".ejs") {
        const mainFileName = file.name.slice(0, file.name.length - 4);

        if (file.name === "index.ejs.ejs") {
          fs.copyFileSync(newFrom, `${to}/${mainFileName}`);
          return;
        }

        const content = parseEjs(newFrom);
        fs.writeFileSync(`${to}/${mainFileName}`, content);

        console.log(
          `Created ${(to + "/" + mainFileName).replace(
            new RegExp(process.cwd(), "g"),
            ""
          )} 👻`
        );
      } else {
        if (file.name === "package-lock.json") return;

        fs.copyFileSync(newFrom, newTo);
        console.log(
          `Created ${newTo.replace(new RegExp(process.cwd(), "g"), "")} 💩`
        );
      }
    } else {
      const { boilerplate } = reflections;
      // If some how node_modules and dist directory are left there
      if (file.name === "node_modules" || file.name === "dist") return;

      if (
        ((templates.indexOf(boilerplate) === 0 ||
          templates.indexOf(boilerplate) === 1) &&
          file.name === "store") ||
        (templates.indexOf(boilerplate) === 0 && file.name === "components") ||
        (templates.indexOf(boilerplate) === 2 && file.name === "controllers") ||
        (templates.indexOf(boilerplate) === 2 && file.name === "db") ||
        (templates.indexOf(boilerplate) === 2 && file.name === "models") ||
        (templates.indexOf(boilerplate) === 2 && file.name === "routes")
      )
        return;

      // Repeat the procedure again
      copyRecursively(newFrom, newTo);
    }
  });
};

/**
 * Generates the Welcome message
 *
 * @param {string} appName string Name
 *
 * @return {void}
 */
const welcomeMsg = appName => {
  console.log(
    `${chalk.bold("Boilerplate is generated. \nRun ")} ${chalk.bold.cyan(
      `cd ${appName} && npm run dev`
    )} ${chalk.bold(`for starting dev server. \n`)}`
  );
  console.log(
    chalk
      .hex("#fdf39f")
      .bold("\n🕸  With Great Power Comes Great Devonsibility 🚀\n")
  );
};

/**
 * Creates the project
 *
 * @param {string} appName Name of the project
 *
 * @return {void}
 */
const createTemplate = appName => {
  const currentDirectoryPath = process.cwd() + `/${appName}`;
  console.log(
    chalk.bold.magenta(
      `\n---------------------------------------------------\n
               Generating Boilerplate
    \n--------------------------------------------------- \n`
    )
  );
  copyRecursively(reactTemplatePath, currentDirectoryPath);
};

/**
 * Initialize function for boilerplate creation
 *
 * @param {string} appName Name of the project
 *
 * @return {void}
 */
const init = async appName => {
  console.log("Welcome to renode.🚀");

  const answers = await inquirer.prompt(questions);

  reflections = {
    ...answers,
    appName
  };

  createTemplate(appName);

  if (!error) {
    console.log(chalk.bold(`\nWait untill node_modules install...\n`));

    exec(
      `cd ${process.cwd()}/${appName} && npm i && cd ..`,
      (err, stderr, stdout) => {
        if (err) {
          console.log(chalk.red(`\n🐞 ${err} \n`));
        }

        console.log(stdout);
        welcomeMsg(appName);
      }
    );
  }
};

program.on("--help", () => {
  console.log(
    chalk
      .hex("#fdf39f")
      .bold("\n🕸  With Great Power Comes Great Devonsibility 🕷 \n")
  );
});

program
  .version(version, "-v, --version")
  .command("create <project-name>") // sub-command name, appName = type, required
  .description("Make a project") // command description
  // function to execute when command is uses
  .action(init);

// allow commander to parse `process.argv`
program.parse(process.argv);
