import fs = require("fs");
import path = require("path");
import { expect, test } from "../test";

const PROMISE_DELAY = 50;

const mockApi = api =>
  api
    .get(`/auth/login`)
    .reply(200)
    .get(`/portals/retail-banking-demo-wc3.json`)
    .reply(200, _ =>
      fs.createReadStream(path.join(__dirname, "..", "fixtures", "model.json"))
    )
    .post(`/auth/login`, { username: "admin", password: "admin" })
    .reply(200);

// TODO: mock fs

describe("sync", () => {
  test
    .nock(`http://localhost:8080/gateway/api`, mockApi)
    .command(["sync"])
    // FIXME: properly handle async command run
    .do(() => new Promise(resolve => setTimeout(resolve, PROMISE_DELAY)))
    .it("creates a non-empty `app-model` file", ({}) => {
      const appModel = fs.readFileSync("app-model.json", "utf8");
      expect(appModel.length).to.be.greaterThan(0);
    });

  test
    .nock(`http://localhost:8080/gateway/api`, mockApi)
    .command(["sync"])
    // FIXME: properly handle async command run
    .do(() => new Promise(resolve => setTimeout(resolve, PROMISE_DELAY)))
    .it("`app-model` does not contain preferences", ({}) => {
      const appModel = fs.readFileSync("app-model.json", "utf8");

      expect(appModel).not.to.contain("preferences");
    });
  test
    .nock(`http://localhost:8080/gateway/api`, mockApi)
    .command(["sync"])
    // FIXME: properly handle async command run
    .do(() => new Promise(resolve => setTimeout(resolve, PROMISE_DELAY)))
    .it("`app-model` containes properties", ({}) => {
      const appModel = fs.readFileSync("app-model.json", "utf8");

      expect(appModel).to.contain("properties");
    });
});
