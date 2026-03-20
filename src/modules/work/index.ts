import { createListCommand } from './list/command.js';
import { loginCommand, refreshCommand } from './auth/command.js';
import { activeCommand } from './active/command.js';
import { projectsCommand } from './projects/command.js';
import { startCommand, doneCommand } from './timer/command.js';

const workCommand = createListCommand()
  .addCommand(loginCommand)
  .addCommand(refreshCommand)
  .addCommand(projectsCommand)
  .addCommand(activeCommand)
  .addCommand(startCommand)
  .addCommand(doneCommand);

export { workCommand };
