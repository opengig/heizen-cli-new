import { Command } from 'commander';
import chalk from 'chalk';
import worklogCommand from './commands/worklog.js';
import projectsCommand from './commands/projects.js';
import sprintCommand from './commands/sprint.js';

process.exitCode = 0;

const program = new Command();

program.exitOverride((err) => {
  const code = err.exitCode ?? 1;
  process.exitCode = code === 1 && err.code === 'commander.help' ? 0 : code;
  throw err;
});

program.configureHelp({
  styleTitle: (str) => chalk.bold(str),
  styleUsage: (str) => chalk.cyan(str),
  styleCommandDescription: (str) => chalk.gray(str),
  styleOptionTerm: (str) => chalk.cyan(str),
  styleOptionDescription: (str) => chalk.gray(str),
  styleSubcommandTerm: (str) => chalk.green(str),
  styleSubcommandDescription: (str) => chalk.gray(str),
});

program.name('hz').description('Manage worklogs, projects, and sprints from the terminal').version('1.0.0');

const rootHelpBefore = [
  '',
  chalk.bold.cyan('  Heizen CLI'),
  chalk.dim('  Manage worklogs and sprint tasks from the terminal.'),
  '',
  chalk.dim('  Two separate systems (different project IDs):'),
  chalk.dim('  • ') + chalk.cyan('Worklog') + chalk.dim(' — time tracking (worklog.opengig.work)'),
  chalk.dim('  • ') + chalk.cyan('Dashboard') + chalk.dim(' — projects & sprints (api.studio.heizen.work)'),
  '',
  chalk.dim('  Set HEIZEN_WORKLOG_COOKIE and HEIZEN_DASHBOARD_TOKEN in .env'),
  '',
].join('\n');

const rootHelpAfter = [
  '',
  chalk.bold('  Examples:'),
  chalk.dim('    ') + chalk.cyan('hz worklog projects') + chalk.dim('       List worklog projects'),
  chalk.dim('    ') + chalk.cyan('hz worklog add -p <id> -h 2') + chalk.dim('   Log 2 hours'),
  chalk.dim('    ') + chalk.cyan('hz projects list') + chalk.dim('         List Studio Heizen projects'),
  chalk.dim('    ') + chalk.cyan('hz sprint board <id>') + chalk.dim('     View sprint board'),
  chalk.dim('    ') + chalk.cyan('hz sprint done <id>') + chalk.dim('       Mark story as Done'),
  '',
].join('\n');

program.addHelpText('beforeAll', (ctx) => (ctx.command.parent === null ? rootHelpBefore : ''));
program.addHelpText('afterAll', (ctx) => (ctx.command.parent === null ? rootHelpAfter : ''));

function inheritHelpAndExit(cmd: Command, parent: Command) {
  cmd.copyInheritedSettings(parent);
  for (const sub of cmd.commands) {
    inheritHelpAndExit(sub, cmd);
  }
}

inheritHelpAndExit(worklogCommand, program);
inheritHelpAndExit(projectsCommand, program);
inheritHelpAndExit(sprintCommand, program);

program.addCommand(worklogCommand);
program.addCommand(projectsCommand);
program.addCommand(sprintCommand);

try {
  program.parse();
} catch {
  process.exit(process.exitCode ?? 1);
}
