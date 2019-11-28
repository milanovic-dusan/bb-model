// tslint:disable-next-line:no-implicit-dependencies
import { expect, test } from "@oclif/test";

describe("sync", () => {
  test
    .stdout()
    .command(["sync"])
    .it("runs sync", ctx => {
      expect(ctx.stdout).to.contain("");
    });
});
