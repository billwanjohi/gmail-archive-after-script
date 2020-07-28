import { getDirectives, calcSliceParams } from "./util";
import { MockLabel } from "./MockLabel";
/* eslint-disable functional/functional-parameters,functional/no-expression-statement */
jest.unmock("./util");

describe("util", () => {
  const moreRecentDirective = {
    cutoff: 1,
    measure: "more-recent",
    name: "hacker-news",
  };
  describe("calcSliceParams()", () => {
    it("is small", () => {
      const sliceable = [...Array(75).keys()];
      expect([...sliceable].pop()).toBe(74);
      expect(calcSliceParams(100, sliceable)).toStrictEqual([
        { end: 100, start: 0 },
      ]);
    });
    it("is big", () => {
      const sliceable = [...Array(301).keys()];
      expect(calcSliceParams(100, sliceable)).toStrictEqual([
        { end: 100, start: 0 },
        { end: 200, start: 100 },
        { end: 300, start: 200 },
        { end: 400, start: 300 },
      ]);
    });
  });
  describe("getDirectives()", () => {
    it("has some labels", () => {
      const labels = [
        "Inbox",
        "Sent",
        "archive-after/days-elapsed/121/slick-deals",
        "archive-after/foo/1/bar",
        "archive-after/more-recent/1/hacker-news",
      ].map((n) => new MockLabel(n));
      expect(getDirectives(labels)).toStrictEqual([
        { cutoff: 121, measure: "days-elapsed", name: "slick-deals" },
        { cutoff: 1, measure: "foo", name: "bar" },
        moreRecentDirective,
      ]);
    });
  });
});
