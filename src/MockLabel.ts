/* eslint-disable functional/functional-parameters,functional/no-class,functional/no-expression-statement,functional/no-this-expression */
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

export class MockDate {
  readonly value: number;
  constructor(value: number) {
    this.value = value;
  }
  getTime(): number {
    return this.value;
  }
}
