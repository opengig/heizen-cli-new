import { Command, Help } from 'commander';
import chalk from 'chalk';
import { projectsCommand } from './modules/projects.js';
import { loginCommand } from './modules/login.js';
import { workCommand } from './modules/work/index.js';
import { sprintsCommand } from './modules/sprints.js';
import { taskCommand } from './modules/task.js';
import { meetingsCommand } from './modules/meetings.js';
import { resourcesCommand } from './modules/resources.js';
import { wikiCommand } from './modules/wiki.js';
import { resetCommand } from './modules/reset.js';

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
  formatHelp: (cmd, helper) => {
    if (!cmd.parent) {
      return rootHelpBefore + '\n' + rootHelpAfter;
    }
    return Help.prototype.formatHelp.call(helper, cmd, helper);
  },
});

program.name('hz').description('Manage worklogs, projects, and sprints from the terminal').version('1.0.0');

const rootHelpBefore = [
  '',
  chalk.bold.cyan('  Heizen CLI'),
  chalk.dim('  Manage worklogs and sprint tasks from the terminal.'),
  '',
  chalk.bold.green('  WORKLOG ') + chalk.gray('(worklog.opengig.work — time tracking)'),
  chalk.dim('  ' + '─'.repeat(52)),
  chalk.dim('  ') + chalk.green('hz work [days]') + chalk.dim('                    List worklogs (0=today, -5=5 days ago)'),
  chalk.dim('        ') + chalk.yellow('-p, --pending') + chalk.dim('               List locally pending works only'),
  '',
  chalk.dim('  ') + chalk.green('hz work login') + chalk.dim('                     Interactive login (email/password)'),
  '',
  chalk.dim('  ') + chalk.green('hz work refresh') + chalk.dim('                   Refetch user data from API'),
  '',
  chalk.dim('  ') + chalk.green('hz work projects [filter]') + chalk.dim('         List worklog projects'),
  chalk.dim('        ') + chalk.yellow('-a, --all') + chalk.dim('                   Show all projects (not just recent)'),
  chalk.dim('        ') + chalk.gray('[filter]') + chalk.dim('                    Case-insensitive filter'),
  '',
  chalk.dim('  ') + chalk.green('hz work active [name]') + chalk.dim('             Show or set active project for this directory'),
  chalk.dim('        ') + chalk.gray('[name]') + chalk.dim('                      Project name (exact or partial match)'),
  chalk.dim('        ') + chalk.dim('(no arg)') + chalk.dim('                    Show linked project'),
  '',
  chalk.dim('  ') + chalk.green('hz work start <name>') + chalk.dim('              Start work (requires active project)'),
  chalk.dim('        ') + chalk.gray('<name>') + chalk.dim('                      Work name'),
  '',
  chalk.dim('  ') + chalk.green('hz work done <hash>') + chalk.dim('               Mark work done by hash prefix, sync to API'),
  chalk.dim('        ') + chalk.gray('<hash>') + chalk.dim('                      Hash prefix (e.g. abc)'),
  '',
  chalk.dim('  Aliases: ') + chalk.magenta('hz wa') + chalk.dim(' => hz work active, ') + chalk.magenta('hz wp') + chalk.dim(' => hz work projects'),
  '',
  chalk.bold.blue('  DASHBOARD ') + chalk.gray('(api.studio.heizen.work — projects & sprints)'),
  chalk.dim('  ' + '─'.repeat(52)),
  chalk.dim('  ') + chalk.cyan('hz login') + chalk.dim('                          Sign in dashboard with browser OAuth'),
  chalk.dim('  ') + chalk.cyan('hz projects') + chalk.dim('                       List dashboard projects (table)'),
  chalk.dim('        ') + chalk.yellow('-v, --verbose') + chalk.dim('               Para-wise output with sprint counts'),
  '',
  chalk.dim('  ') + chalk.cyan('hz projects open [name]') + chalk.dim('           Link project to this directory'),
  chalk.dim('        ') + chalk.gray('[name]') + chalk.dim('                      Project name (resolve by title/uniqueName)'),
  chalk.dim('        ') + chalk.dim('(no arg)') + chalk.dim('                    Show linked project and working sprint'),
  '',
  chalk.dim('  ') + chalk.cyan('hz sprints') + chalk.dim('                        List sprints of linked project (name, status, dates)'),
  '',
  chalk.dim('  ') + chalk.cyan('hz sprints set') + chalk.dim('                    Set working sprint (interactive prompt)'),
  '',
  chalk.dim('  ') + chalk.cyan('hz tasks [taskIndex] [storyIndex] [status]'),
  chalk.dim('                                    List tasks, view stories, or update story status'),
  chalk.dim('        ') + chalk.yellow('-d, --details') + chalk.dim('               Show all tasks with all stories (table)'),
  chalk.dim('        ') + chalk.yellow('-v, --view') + chalk.dim('                  Interactive mode (prompt for task/story)'),
  chalk.dim('        ') + chalk.gray('[taskIndex]') + chalk.dim('                 1-based task index'),
  chalk.dim('        ') + chalk.gray('[storyIndex]') + chalk.dim('                1-based story index'),
  chalk.dim('        ') + chalk.gray('[status]') + chalk.dim('                    done | review | todo | inprogress'),
  '',
  chalk.dim('  ') + chalk.cyan('hz meetings [index]') + chalk.dim('               List meeting recordings (interactive) or view details'),
  chalk.dim('        ') + chalk.yellow('-s, --summary') + chalk.dim('               Show summary'),
  chalk.dim('        ') + chalk.yellow('-t, --transcript') + chalk.dim('            Show transcript'),
  '',
  chalk.dim('  ') + chalk.cyan('hz resources') + chalk.dim('                      List project resources (interactive) or full details'),
  chalk.dim('        ') + chalk.yellow('-d, --details') + chalk.dim('               Show full resource details'),
  '',
  chalk.dim('  ') + chalk.cyan('hz wiki [index]') + chalk.dim('                   List wiki documents or view document content'),
  chalk.dim('        ') + chalk.yellow('-d, --details') + chalk.dim('               Show document details only (no content)'),
  '',
  chalk.dim('  ' + '─'.repeat(52)),
  chalk.dim(`  Auth: 'hz work login' for worklog. 'hz login' for dashboard.`),
  '',
  chalk.dim('  ') + chalk.red('hz reset') + chalk.dim('                          Clear local db, pending work & auth (with confirmation)'),
  '',
].join('\n');

const rootHelpAfter = [
  chalk.dim('  ' + '─'.repeat(52)),
  chalk.bold.yellow('  EXAMPLES'),
  '',
  chalk.green('  Worklog:'),
  chalk.dim('    ') + chalk.green('hz work login') + chalk.dim('                   Sign in'),
  chalk.dim('    ') + chalk.green('hz work') + chalk.dim('                         List today\'s worklogs'),
  chalk.dim('    ') + chalk.green('hz work 5') + chalk.dim('                       List worklogs from 5 days ago'),
  chalk.dim('    ') + chalk.green('hz work -p') + chalk.dim('                      List pending (not yet synced) works'),
  chalk.dim('    ') + chalk.green('hz work projects --all') + chalk.dim('          List all worklog projects'),
  chalk.dim('    ') + chalk.green('hz work active "My Project"') + chalk.dim('     Set active project'),
  chalk.dim('    ') + chalk.magenta('hz wa "My Project"') + chalk.dim('              Same (alias)'),
  chalk.dim('    ') + chalk.magenta('hz wp') + chalk.dim('                           List work projects (alias)'),
  chalk.dim('    ') + chalk.green('hz work start "Fix bug"') + chalk.dim('         Start work'),
  chalk.dim('    ') + chalk.green('hz work done abc') + chalk.dim('                Mark work with hash abc as done'),
  '',
  chalk.blue('  Dashboard:'),
  chalk.dim('    ') + chalk.cyan('hz login') + chalk.dim('                        Sign in dashboard with browser OAuth'),
  chalk.dim('    ') + chalk.cyan('hz projects') + chalk.dim('                     List dashboard projects'),
  chalk.dim('    ') + chalk.cyan('hz projects -v') + chalk.dim('                  Verbose (para-wise with sprint counts)'),
  chalk.dim('    ') + chalk.cyan('hz projects open "Acme"') + chalk.dim('         Link project to this directory'),
  chalk.dim('    ') + chalk.cyan('hz projects open') + chalk.dim('                Show linked project and sprint'),
  chalk.dim('    ') + chalk.cyan('hz sprints') + chalk.dim('                      List sprints'),
  chalk.dim('    ') + chalk.cyan('hz sprints set') + chalk.dim('                  Set working sprint (interactive)'),
  chalk.dim('    ') + chalk.cyan('hz tasks') + chalk.dim('                        List tasks in sprint'),
  chalk.dim('    ') + chalk.cyan('hz tasks -d') + chalk.dim('                     List tasks with all stories'),
  chalk.dim('    ') + chalk.cyan('hz tasks -v') + chalk.dim('                     Interactive: pick task, pick story'),
  chalk.dim('    ') + chalk.cyan('hz tasks 2') + chalk.dim('                      Show task 2 and its stories'),
  chalk.dim('    ') + chalk.cyan('hz tasks 2 4') + chalk.dim('                    Show story 4 of task 2'),
  chalk.dim('    ') + chalk.cyan('hz tasks 2 4 done') + chalk.dim('               Mark story as Done'),
  chalk.dim('    ') + chalk.cyan('hz meetings') + chalk.dim('                     List meetings (interactive)'),
  chalk.dim('    ') + chalk.cyan('hz meetings 4 -s') + chalk.dim('                Show summary of meeting 4'),
  chalk.dim('    ') + chalk.cyan('hz resources') + chalk.dim('                    List resources (interactive)'),
  chalk.dim('    ') + chalk.cyan('hz resources -d') + chalk.dim('                 Show full resource details'),
  chalk.dim('    ') + chalk.cyan('hz wiki') + chalk.dim('                         List wiki documents'),
  chalk.dim('    ') + chalk.cyan('hz wiki 3') + chalk.dim('                       View wiki document 3'),
  chalk.dim('    ') + chalk.cyan('hz wiki 3 -d') + chalk.dim('                    Show wiki document 3 details only'),
  '',
  chalk.yellow('  Reset:'),
  chalk.dim('    ') + chalk.yellow('hz reset') + chalk.dim('                        Clear all local data (db, pending work, auth)'),
  '',
].join('\n');

function inheritHelpAndExit(cmd: Command, parent: Command) {
  cmd.copyInheritedSettings(parent);
  for (const sub of cmd.commands) {
    inheritHelpAndExit(sub, cmd);
  }
}

inheritHelpAndExit(projectsCommand, program);
inheritHelpAndExit(loginCommand, program);
inheritHelpAndExit(workCommand, program);
inheritHelpAndExit(sprintsCommand, program);
inheritHelpAndExit(taskCommand, program);
inheritHelpAndExit(meetingsCommand, program);
inheritHelpAndExit(resourcesCommand, program);
inheritHelpAndExit(wikiCommand, program);
inheritHelpAndExit(resetCommand, program);

program.addCommand(projectsCommand);
program.addCommand(loginCommand);
program.addCommand(workCommand);
program.addCommand(sprintsCommand);
program.addCommand(taskCommand);
program.addCommand(meetingsCommand);
program.addCommand(resourcesCommand);
program.addCommand(wikiCommand);
program.addCommand(resetCommand);

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
