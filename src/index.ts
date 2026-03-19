import { Command } from 'commander';
import setupCommand from './commands/setup.js';

const program = new Command();

program
  .name('hz')
  .description('Heizen CLI tool')
  .version('1.0.0');

program.addCommand(setupCommand);

program.parse();