import { getArchivableThreadsFromLabels, sliceParams } from './util';
import { Thread } from './Thread';
import { Label } from './Label';

/* eslint-disable functional/functional-parameters,functional/immutable-data,functional/no-expression-statement,functional/no-return-void */

// eslint-disable-next-line @typescript-eslint/no-explicit-any,functional/no-let
declare let global: any;

// TODO: if archive fails, remove auto-archived label
export const labelAndArchiveThreads = (newLabel: Label, threads: readonly Thread[]): void => {
  threads.forEach((t) => t.addLabel(newLabel));
  const apiMaxThreads = 100;
  sliceParams(apiMaxThreads, threads).forEach(({ start, end }) =>
    GmailApp.moveThreadsToArchive(threads.slice(start, end))
  );
};

const getLabels = (debug = false): void => {
  const newLabel = GmailApp.getUserLabelByName('archived-via-script');
  const labelThreads = getArchivableThreadsFromLabels(GmailApp.getUserLabels());
  labelThreads.forEach(({ directive, threads }) => {
    Logger.log(`label ${directive.name} scheduled to delete ${threads.length} threads`);
  });
  const allThreads = labelThreads.flatMap((o) => o.threads);
  // eslint-disable-next-line functional/no-conditional-statement
  if (debug == false) {
    Logger.log(`beginning archival`);
    labelAndArchiveThreads(newLabel, allThreads);
    Logger.log(`archived ${allThreads.length} threads`);
  }
};

global.getLabels = (): void => {
  getLabels();
};

global.getLabelsDebug = (): void => {
  getLabels(true);
};

export {};
