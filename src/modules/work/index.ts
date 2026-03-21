import { createListCommand } from './list.js';
import { loginCommand, refreshCommand } from './auth.js';
import { activeCommand } from './active.js';
import { projectsCommand } from './projects.js';
import { startCommand, doneCommand } from './timer.js';

const workCommand = createListCommand()
  .addCommand(loginCommand)
  .addCommand(refreshCommand)
  .addCommand(projectsCommand)
  .addCommand(activeCommand)
  .addCommand(startCommand)
  .addCommand(doneCommand);

export { workCommand };
