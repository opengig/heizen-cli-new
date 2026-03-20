import { Command } from 'commander';
import chalk from 'chalk';
import { projectsCommand } from './modules/projects/index.js';
import { sprintCommand } from './modules/sprint/index.js';
import { workCommand } from './modules/work/index.js';
import { linkCommand } from './modules/link/command.js';
import { sprintsCommand } from './modules/sprints/command.js';
import { taskCommand } from './modules/task/command.js';
import { storyCommand } from './modules/story/command.js';

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
  chalk.dim('  Run hz work login to sign in to worklog. Set HEIZEN_DASHBOARD_TOKEN for dashboard.'),
  '',
].join('\n');

const rootHelpAfter = [
  '',
  chalk.bold('  Examples:'),
  chalk.dim('    ') + chalk.cyan('hz work login') + chalk.dim('             Sign in to worklog'),
  chalk.dim('    ') + chalk.cyan('hz work') + chalk.dim('                 List worklogs for today'),
  chalk.dim('    ') + chalk.cyan('hz work -5') + chalk.dim('               List worklogs for 5 days ago'),
  chalk.dim('    ') + chalk.cyan('hz work projects --all') + chalk.dim('  List worklog projects'),
  chalk.dim('    ') + chalk.cyan('hz work active "project"') + chalk.dim(' Set active project'),
  chalk.dim('    ') + chalk.cyan('hz projects list') + chalk.dim('         List Studio Heizen projects'),
  chalk.dim('    ') + chalk.cyan('hz sprint board <id>') + chalk.dim('     View sprint board'),
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

inheritHelpAndExit(projectsCommand, program);
inheritHelpAndExit(sprintCommand, program);
inheritHelpAndExit(workCommand, program);
inheritHelpAndExit(linkCommand, program);
inheritHelpAndExit(sprintsCommand, program);
inheritHelpAndExit(taskCommand, program);
inheritHelpAndExit(storyCommand, program);

program.addCommand(projectsCommand);
program.addCommand(sprintCommand);
program.addCommand(workCommand);
program.addCommand(linkCommand);
program.addCommand(sprintsCommand);
program.addCommand(taskCommand);
program.addCommand(storyCommand);

// Aliases: hz wa => hz work active, hz wp => hz work projects
const args = process.argv.slice(2);
if (args[0] === 'wa') {
  process.argv = [process.argv[0], process.argv[1], 'work', 'active', ...args.slice(1)];
}
if (args[0] === 'wp') {
  process.argv = [process.argv[0], process.argv[1], 'work', 'projects', ...args.slice(1)];
}
// hz work -5 => hz work 5 (N days ago as positional)
if (args[0] === 'work' && args[1]?.match(/^-(\d+)$/)) {
  const n = args[1].slice(1);
  process.argv = [process.argv[0], process.argv[1], 'work', n, ...args.slice(2)];
}

try {
  program.parse();
} catch {
  process.exit(process.exitCode ?? 1);
}
