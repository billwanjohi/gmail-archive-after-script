import { Maybe, Just } from "purify-ts/Maybe";
import { Either, Left, Right } from "purify-ts/Either";
import { List } from "purify-ts/List";
import { compare } from "purify-ts/Function";

import { Directive } from "./Directive";

type Label = GoogleAppsScript.Gmail.GmailLabel;
type Thread = GoogleAppsScript.Gmail.GmailThread;

export const calcSliceParams = (
  batchSize: number,
  array: readonly unknown[]
): readonly { readonly start: number; readonly end: number }[] =>
  [...Array(Math.ceil(array.length / batchSize)).keys()].map((offset) => {
    const start = offset * batchSize;
    const end = start + batchSize;
    return { start, end };
  });

const paginateThreads = <T extends unknown>(
  batchSize: number,
  array: readonly T[]
): readonly (readonly T[])[] =>
  calcSliceParams(batchSize, array).map(({ start, end }) =>
    array.slice(start, end)
  );

const labelBeforeArchival = (
  threads: readonly Thread[],
  metaLabel: Label
): {
  readonly labelingErrors: readonly Error[];
  readonly labeledThreads: readonly Thread[];
} => {
  const labelResults = threads.map((t) =>
    // eslint-disable-next-line functional/functional-parameters
    Either.encase(() => {
      // eslint-disable-next-line functional/no-expression-statement
      t.addLabel(metaLabel);
      return t;
    })
  );
  return {
    labelingErrors: Either.lefts(labelResults),
    labeledThreads: Either.rights(labelResults),
  };
};

const archiveThreads = (
  threads: readonly Thread[]
): readonly {
  readonly batch: readonly Thread[];
  readonly eitherCount: Either<Error, number>;
}[] =>
  paginateThreads(100, threads).map((batch) => ({
    batch,
    // eslint-disable-next-line functional/functional-parameters
    eitherCount: Either.encase(() => {
      // eslint-disable-next-line functional/no-expression-statement
      GmailApp.moveThreadsToArchive(batch.slice());
      return batch.length;
    }),
  }));

const removeLabelWhenArchivalFails = (
  metaLabel: Label,
  threads: readonly Thread[]
): readonly Either<Error, Thread>[] =>
  threads.map((t) =>
    // eslint-disable-next-line functional/functional-parameters
    Either.encase(() => {
      // eslint-disable-next-line functional/no-expression-statement
      t.removeLabel(metaLabel);
      return t;
    })
  );

export const labelAndArchiveThreads = (
  threads: readonly Thread[]
): {
  readonly archived: number;
  readonly labelingErrors: readonly Error[];
  readonly archivalFailures: readonly {
    readonly error: Error;
    readonly delabeled: number;
    readonly delabelingErrors: readonly Error[];
  }[];
} => {
  const metaLabel = GmailApp.getUserLabelByName("archived-via-script");
  const { labelingErrors, labeledThreads } = labelBeforeArchival(
    threads,
    metaLabel
  );
  const archivalResults = archiveThreads(labeledThreads).map(
    ({ batch, eitherCount }) =>
      eitherCount.mapLeft((error) => ({
        error,
        either: removeLabelWhenArchivalFails(metaLabel, batch),
      }))
  );
  const archivalFailures = Either.lefts(archivalResults).map(
    ({ error, either }) => {
      return {
        error,
        delabeled: Either.rights(either.slice()).length,
        delabelingErrors: Either.lefts(either.slice()),
      };
    }
  );
  const archived = List.sum(Either.rights(archivalResults));
  return { archived, labelingErrors, archivalFailures };
};

const archivePattern = /archive-after\/(?<measure>[^/]+)\/(?<cutoff>\d+)\/(?<name>[^/]+)$/u;

// We need this for unit testing
// eslint-disable-next-line functional/no-method-signature
type BaseLabel = { getName(): string };

export const getDirective = (label: BaseLabel): Maybe<Directive> =>
  Maybe.fromNullable(archivePattern.exec(label.getName()))
    .chainNullable((m) => m.groups)
    .chain(({ measure, cutoff, name }) =>
      Just({ measure, cutoff: Number(cutoff), name })
    );

export const getDirectives = (
  labels: readonly BaseLabel[]
): readonly Directive[] => Maybe.catMaybes(labels.map(getDirective));

export const labelSearchTerm = (d: Directive): string =>
  `label:archive-after-${d.measure}-${d.cutoff}-${d.name}`;

const getInboxThreads = (labelSearchTerm: string): readonly Thread[] =>
  GmailApp.search(`label: inbox ${labelSearchTerm}`);

type ThreadFilter = (
  d: Directive,
  ts: readonly Thread[]
) => Either<Error, readonly Thread[]>;

const getLessRecentThreads: ThreadFilter = (
  { cutoff, measure, name }: Directive,
  threadsInInbox: readonly Thread[]
): Either<Error, readonly Thread[]> => {
  const foo =
    cutoff < 1
      ? Left(Error(`${measure} ${name} has invalid cutoff: ${cutoff}`))
      : Right(List.sort(compare, threadsInInbox.slice().slice(0, -cutoff)));
  return foo;
};

const daysSinceLastMessage = (thread: Thread): number => {
  const oneDayInMilliseconds = 1000 * 60 * 60 * 24; // milli, sec, min, hour
  return (
    (new Date().getTime() - thread.getLastMessageDate().getTime()) /
    oneDayInMilliseconds
  );
};

const getTooOldThreads: ThreadFilter = (
  { cutoff }: Directive,
  threadsInInbox: readonly Thread[]
): Either<Error, readonly Thread[]> =>
  Right(threadsInInbox.filter((t) => daysSinceLastMessage(t) > cutoff));

const doNothing: ThreadFilter = (
  _d: Directive,
  _ts: readonly Thread[]
): Either<Error, readonly Thread[]> => Right([]);

const getThreadFilter = ({ measure }: Directive): ThreadFilter => {
  return measure == "days-elapsed"
    ? getTooOldThreads
    : measure == "more-recent"
    ? getLessRecentThreads
    : doNothing;
};

export const getFilteredThreadsFromDirective = (
  d: Directive
): Either<Error, readonly Thread[]> =>
  getThreadFilter(d)(d, getInboxThreads(labelSearchTerm(d)));

export const getArchivableThreadsFromLabels = (
  labels: readonly Label[]
): readonly Either<
  Error,
  { readonly directive: Directive; readonly threads: readonly Thread[] }
>[] => {
  return getDirectives(labels).map((d) => {
    return getFilteredThreadsFromDirective(d).map((threads) => ({
      directive: d,
      threads,
    }));
  });
};
