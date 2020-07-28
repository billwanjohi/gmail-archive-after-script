import { Either } from "purify-ts/Either";
import { NonEmptyList } from "purify-ts/NonEmptyList";

import { getArchivableThreadsFromLabels, labelAndArchiveThreads } from "./util";

/* eslint-disable functional/functional-parameters,functional/immutable-data,functional/no-expression-statement,functional/no-return-void */

// eslint-disable-next-line @typescript-eslint/no-explicit-any,functional/no-let
declare let global: any;

const getLabels = (debug = false): void => {
  const foo = getArchivableThreadsFromLabels(GmailApp.getUserLabels());
  Either.lefts(foo.slice()).forEach((e) => Logger.log(e));
  const labelThreads = Either.rights(foo.slice());
  labelThreads.forEach(({ directive, threads }) => {
    Logger.log(
      `label ${directive.name} scheduled to delete ${threads.length} threads`
    );
  });
  const allThreads = labelThreads.flatMap((o) => o.threads);
  // eslint-disable-next-line functional/no-conditional-statement
  if (debug == false) {
    Logger.log("beginning archival");
    const results = labelAndArchiveThreads(allThreads);
    Logger.log(`successfully archived ${results.archived} threads`);
    results.labelingErrors.forEach((e) => {
      Logger.log(`archival aborted due to error: ${e.message}`);
    });
    results.archivalFailures.forEach((f) => {
      Logger.log(`bulk archive failed: ${f.error}`);
      Logger.log(`${f.delabeled} were delabeled properly, can try again`);
      NonEmptyList.fromArray(f.delabelingErrors.slice()).map((errors) => {
        Logger.log("unable to delabel all messages that failed to archive");
        errors.forEach(({ message }) => {
          Logger.log(message);
        });
      });
    });
  }
};

global.getLabels = (): void => {
  getLabels();
};

global.getLabelsDebug = (): void => {
  getLabels(true);
};

export {};
