import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { createDashboardClient } from '../api/index.js';
import { requireDashboardAuth } from '../config/index.js';
import { getLinkedProject } from './common/index.js';
import type { DocumentNode, ProjectDocument } from '../schemas/dashboard/index.js';

function flattenWikiNodes(nodes: DocumentNode[]): DocumentNode[] {
  const result: DocumentNode[] = [];
  function visit(node: DocumentNode) {
    result.push(node);
    const children = node.children ?? [];
    for (const child of children) visit(child);
  }
  for (const node of nodes) visit(node);
  return result;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function creatorName(creator: { first_name: string; last_name: string }): string {
  return [creator.first_name, creator.last_name].filter(Boolean).join(' ') || '—';
}

function printDocumentDetailsOnly(doc: ProjectDocument) {
  console.log(chalk.dim(`Creator: ${creatorName(doc.creator)}`));
  console.log(chalk.dim(`Public: ${doc.is_public ? 'Yes' : 'No'}`));
  console.log(chalk.dim(`Created: ${formatDateTime(doc.created_at)}`));
  console.log(chalk.dim(`Updated: ${formatDateTime(doc.updated_at)}`));
}

export const wikiCommand = new Command('wiki')
  .description('List wiki documents or view document content')
  .option('-d, --details', 'Show document details only (no content)')
  .argument('[docIndex]', 'Document index (1-based)')
  .action(async function (docIndexStr) {
    const opts = this.opts();
    try {
      const project = await getLinkedProject();
      const token = requireDashboardAuth();
      const client = createDashboardClient(token);
      const tree = await client.getWikiTree(project.uniqueName);
      const flat = flattenWikiNodes(tree);

      if (flat.length === 0) {
        console.log(chalk.gray('No wiki documents in this project.'));
        return;
      }

      if (docIndexStr) {
        const idx = parseInt(docIndexStr, 10);
        if (isNaN(idx) || idx < 1) {
          console.error(chalk.red('Invalid document index.'));
          process.exit(1);
        }
        const node = flat[idx - 1];
        if (!node) {
          console.error(chalk.red('Document not found.'));
          process.exit(2);
        }

        const doc = await client.getWikiDocument(node.id);

        if (opts.details) {
          printDocumentDetailsOnly(doc);
          return;
        }

        console.log(doc.markdown || chalk.gray('(empty)'));
        return;
      }

      const table = new Table({
        head: ['#', 'Title', 'Creator', 'Created', 'Updated'],
        colWidths: [4, 35, 20, 18, 18],
      });

      flat.forEach((n, i) => {
        table.push([
          i + 1,
          n.title || '(untitled)',
          creatorName(n.creator),
          formatDateTime(n.created_at),
          formatDateTime(n.updated_at),
        ]);
      });

      console.log(table.toString());
      console.log(chalk.dim('Use hz wiki <index> to view document content.'));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
