import { Either } from "purify-ts/Either";

/* eslint-disable functional/functional-parameters,functional/no-class,functional/no-expression-statement,functional/no-method-signature,functional/no-this-expression */

export type BaseDate = { getTime(): number };
export type BaseLabel = { getName(): string };
export type BaseThread = { getLastMessageDate(): BaseDate };
export type Directive = {
  readonly measure: string;
  readonly cutoff: number;
  readonly name: string;
};
export type Label = GoogleAppsScript.Gmail.GmailLabel;
export type Thread = GoogleAppsScript.Gmail.GmailThread;
export type ThreadFilter = (
  d: Directive,
  ts: readonly BaseThread[]
) => Either<Error, readonly BaseThread[]>;

export class MockDate {
  readonly value: number;
  constructor(value: number) {
    this.value = value;
  }
  getTime(): number {
    return this.value;
  }
}

export class MockLabel {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  getName(): string {
    return this.name;
  }
}

export class MockThread {
  readonly date: MockDate;
  constructor(date: MockDate) {
    this.date = date;
  }
  getLastMessageDate(): MockDate {
    return this.date;
  }
}
