import { Directive } from './Directive';
import { notEmpty } from './notEmpty';
import { Thread } from './Thread';
import { Label } from './Label';

type Sliceable = {
  readonly length: number;
  // eslint-disable-next-line functional/no-method-signature,functional/no-mixed-type
  slice(start?: number, end?: number): Sliceable;
};

export const sliceParams = (
  batchSize: number,
  sequence: Sliceable
): readonly { readonly start: number; readonly end: number }[] => {
  const startingPositions = [...Array(Math.ceil(sequence.length / batchSize)).keys()];
  return startingPositions.map((offset) => {
    const start = offset * batchSize;
    const end = start + batchSize;
    return { start, end };
  });
};

const archivePattern = /archive-after\/(?<measure>[^/]+)\/(?<cutoff>\d+)\/(?<name>[^/]+)$/u;

// We need this for unit testing
// eslint-disable-next-line functional/no-method-signature
type BaseLabel = { getName(): string };

// TODO: implement getDirective with Maybe/Option to handle all the nulls
export const getDirectives = (labels: readonly BaseLabel[]): readonly Directive[] =>
  labels
    .map((label) => archivePattern.exec(label.getName()))
    .filter(notEmpty)
    .map((match) => match.groups)
    .filter(notEmpty)
    .map((groups) => ({
      measure: groups.measure,
      cutoff: Number(groups.cutoff),
      name: groups.name,
    }));

export const labelSearchTerm = (d: Directive): string =>
  `label:archive-after-${d.measure}-${d.cutoff}-${d.name}`;

const getInboxThreads = (labelSearchTerm: string): readonly Thread[] =>
  GmailApp.search(`label: inbox ${labelSearchTerm}`);

const lastActive = (t: Thread): number => t.getLastMessageDate().valueOf();

type ThreadFilter = (d: Directive, ts: readonly Thread[]) => readonly Thread[];

// TODO: fail if maximum is not a positive whole number
const getLessRecentThreads: ThreadFilter = (
  { cutoff }: Directive,
  threadsInInbox: readonly Thread[]
): readonly Thread[] =>
  threadsInInbox
    // TODO: replace with mySort
    // TODO: replace with fp-ts sort
    .slice()
    .sort((a, b) => lastActive(a) - lastActive(b))
    .slice(0, -cutoff);

const daysSinceLastMessage = (thread: Thread): number => {
  const oneDayInMilliseconds = 1000 * 60 * 60 * 24; // milli, sec, min, hour
  return (new Date().getTime() - thread.getLastMessageDate().getTime()) / oneDayInMilliseconds;
};

const getTooOldThreads: ThreadFilter = (
  { cutoff }: Directive,
  threadsInInbox: readonly Thread[]
): readonly Thread[] => threadsInInbox.filter((t) => daysSinceLastMessage(t) > cutoff);

const doNothing: ThreadFilter = (_d: Directive, _ts: readonly Thread[]): readonly Thread[] => [];

const getThreadFilter = ({ measure }: Directive): ThreadFilter => {
  return measure == 'days-elapsed'
    ? getTooOldThreads
    : measure == 'more-recent'
    ? getLessRecentThreads
    : doNothing;
};

export const getFilteredThreadsFromDirective = (d: Directive): readonly Thread[] =>
  getThreadFilter(d)(d, getInboxThreads(labelSearchTerm(d)));

export const getArchivableThreadsFromLabels = (
  labels: readonly Label[]
): readonly { readonly directive: Directive; readonly threads: readonly Thread[] }[] =>
  getDirectives(labels).map((d) => ({ directive: d, threads: getFilteredThreadsFromDirective(d) }));
