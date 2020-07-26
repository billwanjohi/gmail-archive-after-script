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
