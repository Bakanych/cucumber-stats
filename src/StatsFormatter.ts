import chalk from "chalk";
import { Formatter } from "cucumber";
const { formatterHelpers } = require("cucumber");

export default class StatsFormatter extends Formatter {
  constructor(options: any) {
    super(options);

    options.eventBroadcaster.on("test-run-finished", () => {
      const usage = formatterHelpers.getUsage({
        cwd: (this as any).cwd,
        stepDefinitions: (this as any).supportCodeLibrary.stepDefinitions,
        eventDataCollector: (this as any).eventDataCollector,
      });

      const undefinedScenarios = (this as any).eventDataCollector
        .getTestCaseAttempts()
        .filter((x: any) => x.result.status === "undefined");

      const undefinedSteps = (undefinedScenarios as []).reduce(
        (all: any[], scenario: any) => {
          const pickleSteps = (scenario.pickle.steps as []).reduce(
            (steps: any[], step: any, index) => {
              if (scenario.stepResults[index].status === "undefined") {
                steps.push({
                  location: `${scenario.pickle.uri}:${step.locations[0].line}`,
                  step: step.text,
                });
              }
              return steps;
            },
            []
          );

          return all.concat(pickleSteps);
        },
        []
      );

      this.printStats(usage, undefinedSteps);
    });
  }

  private printStats(usage: any[], undefinedSteps: any[]) {
    const stats = usage
      .map((x) => ({
        step: x.pattern as string,
        uri: `${x.uri}:${x.line}`,
        count: x.matches.length as number,
      }))
      .sort((a, b) => b.count - a.count);

    const stepCounts = stats.map((x) => x.count);
    const mid = Math.floor(stepCounts.length / 2);
    const median =
      stepCounts.length % 2 !== 0
        ? stepCounts[mid]
        : (stepCounts[mid - 1] + stepCounts[mid]) / 2;

    console.log(chalk.underline("\nStep usage statistics"));

    stats.map((x) => {
      const stepStats = `[${x.count}] ${x.step}`;
      let coloredStepStats =
        x.count < median
          ? chalk.green(stepStats)
          : chalk.greenBright(stepStats);
      if (x.count === median) coloredStepStats = chalk.cyan(stepStats);
      if (x.count === 0) coloredStepStats = chalk.yellow(stepStats);
      console.log(`${coloredStepStats} (${chalk.grey(x.uri)})`);
    });

    console.log(`\nStep definitions total: ${stats.length}`);
    console.log(
      `Scenario steps total: ${stats.reduce((x, y) => (x += y.count), 0)}`
    );
    console.log(`Step usage median: ${median}\n`);

    if (undefinedSteps?.length) {
      console.log(chalk.underline(`Undefined Steps: ${undefinedSteps.length}`));
      undefinedSteps.map((x) =>
        console.log(`${chalk.red(x.step)} (${chalk.grey(x.location)})`)
      );
      console.log();
    }
  }
}
