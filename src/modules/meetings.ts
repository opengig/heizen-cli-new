import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import { createDashboardClient } from '../api/index.js';
import { requireDashboardAuth } from '../config/index.js';
import {
  displayDateTimeEnGB,
  getLinkedProject,
  missing,
  parseOneBasedIndex,
  parseTimeMsOrZero,
  requireStringForAction,
} from './common/index.js';
import type { MeetingRecord } from '../schemas/dashboard/index.js';

function formatDuration(seconds: number): string {
  const totalSecs = Math.floor(seconds);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}m ${s}s`;
}

function printMeetingDetails(meeting: MeetingRecord) {
  const creator = meeting.creator;
  const creatorName = creator ? [creator.first_name, creator.last_name].filter(Boolean).join(' ') || '—' : '—';
  console.log(chalk.bold(missing(meeting.title)));
  console.log('');
  console.log(chalk.dim(`Date: ${displayDateTimeEnGB(meeting.metadata?.startDate)}`));
  console.log(chalk.dim(`Creator: ${creatorName}`));
  const durationSec = meeting.metadata?.durationInSeconds;
  console.log(
    chalk.dim(
      `Duration: ${durationSec != null && !Number.isNaN(Number(durationSec)) ? formatDuration(Number(durationSec)) : missing(durationSec)}`
    )
  );
  console.log(chalk.dim(`Stories created: ${meeting.isStoriesCreated ? 'Yes' : 'No'}`));
  console.log('');
}

export const meetingsCommand = new Command('meetings')
  .description('List meeting recordings, view details, transcript, or summary')
  .option('-s, --summary', 'Show summary of selected meeting')
  .option('-t, --transcript', 'Show transcript of selected meeting')
  .argument('[meetingIndex]', 'Meeting index (1-based)')
  .action(async (meetingIndexStr, opts) => {
    try {
      const project = await getLinkedProject();
      const projectId = requireStringForAction('Listing meetings', 'project id', project.id);
      const token = await requireDashboardAuth();
      const client = createDashboardClient(token);
      const meetings = await client.getMeetingRecords(projectId);

      if (meetings.length === 0) {
        console.log(chalk.gray('No meetings in this project.'));
        return;
      }

      const sorted = [...meetings].sort((a, b) => parseTimeMsOrZero(b.createdAt) - parseTimeMsOrZero(a.createdAt));

      if (opts.summary || opts.transcript) {
        const idx = parseOneBasedIndex(meetingIndexStr);
        if (idx === null) {
          console.error(chalk.red('Meeting index required for --summary or --transcript. Example: hz meetings 4 -s'));
          process.exit(1);
        }
        const meeting = sorted[idx - 1];
        if (!meeting) {
          console.error(chalk.red('Meeting not found.'));
          process.exit(2);
        }
        printMeetingDetails(meeting);
        if (opts.summary) {
          console.log(chalk.bold('Summary'));
          console.log('—'.repeat(40));
          console.log(meeting.summary || chalk.gray('(empty)'));
        }
        if (opts.transcript) {
          console.log(chalk.bold('Transcript'));
          console.log('—'.repeat(40));
          console.log(meeting.transcript || chalk.gray('(empty)'));
        }
        return;
      }

      if (meetingIndexStr) {
        const idx = parseOneBasedIndex(meetingIndexStr);
        if (idx === null) {
          console.error(chalk.red('Invalid meeting index.'));
          process.exit(1);
        }
        const meeting = sorted[idx - 1];
        if (!meeting) {
          console.error(chalk.red('Meeting not found.'));
          process.exit(2);
        }
        printMeetingDetails(meeting);
        console.log(chalk.dim('Use hz meetings <index> --summary or --transcript to view content.'));
        return;
      }

      sorted.forEach((m, i) => {
        console.log(chalk.cyan(`${i + 1}. ${missing(m.title)}`));
      });

      const { meetingNum } = await prompts({
        type: 'number',
        name: 'meetingNum',
        message: 'Enter meeting number:',
        min: 1,
        max: sorted.length,
        initial: 1,
      });

      if (meetingNum == null) process.exit(1);

      const meeting = sorted[meetingNum - 1];
      if (!meeting) {
        console.error(chalk.red('Meeting not found.'));
        process.exit(2);
      }

      console.log('');
      printMeetingDetails(meeting);

      const { action } = await prompts({
        type: 'select',
        name: 'action',
        message: 'Choose option:',
        choices: [
          { title: 'View transcript', value: 'transcript' },
          { title: 'View summary', value: 'summary' },
          { title: 'Back to list', value: 'back' },
        ],
      });

      if (action === 'transcript') {
        console.log(chalk.bold('Transcript'));
        console.log('—'.repeat(40));
        console.log(meeting.transcript || chalk.gray('(empty)'));
      } else if (action === 'summary') {
        console.log(chalk.bold('Summary'));
        console.log('—'.repeat(40));
        console.log(meeting.summary || chalk.gray('(empty)'));
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
