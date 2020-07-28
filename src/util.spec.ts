import { MockDate, MockLabel, MockThread } from "./types";
import {
  getDirectives,
  getLessRecentThreads,
  getTooOldThreads,
  calcSliceParams,
  oneDayInMilliseconds,
  daysSinceLastMessage,
} from "./util";

/* eslint-disable functional/functional-parameters,functional/no-expression-statement */
jest.unmock("./util");

describe("util", () => {
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
  const moreRecentDirective = {
    cutoff: 1,
    measure: "more-recent",
    name: "hacker-news",
  };
  const daysElapsedDirective = {
    cutoff: 121,
    measure: "days-elapsed",
    name: "slick-deals",
  };
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
        daysElapsedDirective,
        { cutoff: 1, measure: "foo", name: "bar" },
        moreRecentDirective,
      ]);
    });
  });
  describe("getLessRecentThreads", () => {
    it("does the right thing", () => {
      const threads = [35, 444, 13, 512, 22].map(
        (t) => new MockThread(new MockDate(t))
      );
      const filteredThreads = getLessRecentThreads(
        moreRecentDirective,
        threads
      ).unsafeCoerce();
      expect(filteredThreads.length).toBe(4);
      expect(
        filteredThreads.map((t) => t.getLastMessageDate().getTime())
      ).toStrictEqual([13, 22, 35, 444]);
      expect(filteredThreads as readonly MockThread[]).toMatchObject(
        [13, 22, 35, 444].map((t) => ({ date: { value: t } }))
      );
    });
  });
  describe("daysSinceLastMessage", () => {
    const threadXDaysAgo = (daysAgo: number): MockThread =>
      new MockThread(
        new MockDate(new Date().getTime() - daysAgo * oneDayInMilliseconds)
      );
    const t = threadXDaysAgo(3);
    it("has good seed data", () => {
      expect(Math.floor(daysSinceLastMessage(t))).toBe(3);
    });
    it("filters the right message", () => {
      const threads = [35, 444, 13, 512, 22].map(threadXDaysAgo);
      expect(
        getTooOldThreads(daysElapsedDirective, threads).unsafeCoerce()
      ).toStrictEqual([threads[1], threads[3]]);
    });
  });
});
