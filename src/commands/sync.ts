import { Command, flags } from "@oclif/command";
import * as pump from "pump";
import * as Listr from "listr";

import * as fs from "fs";
import writePrep from "../lib/tidy";
import { config } from "rxjs";

let request = require("request");
const JSONStream = require("JSONStream");
const through = require("through2");

export default class Sync extends Command {
  // TODO: have better description
  static description = `Syncronizes remote model with local`;

  // TODO: update examples
  static examples = [
    `$ bb-model sync
model sync complete.
`
  ];

  // flag names are matching @bb-cli tools
  static flags = {
    "portal-port": flags.integer({ default: 8080 }),
    "portal-host": flags.string({ default: "localhost" }),
    "portal-protocol": flags.enum({
      options: ["http", "https"],
      default: "http"
    }),
    "portal-context": flags.string({ default: "gateway/api" }),
    "portal-auth-path": flags.string({
      default: "gateway/api/auth/login"
    }),
    "portal-name": flags.string({
      default: "retail-banking-demo-wc3"
    }),
    "portal-username": flags.string({
      default: "admin"
    }),
    "portal-password": flags.string({
      default: "admin"
    }),
    "portal-page-name": flags.string({
      default: "index"
    })
  };

  // no support for positional args
  // static args = [{ name: "url" }];

  getConfiguration() {
    const { flags } = this.parse(Sync);
    // simplest way (sync)
    // file size is ~250B
    // an optimisation candidate
    const bbconfig = fs.readFileSync(".bbconfig").toString();

    const config = {
      ...JSON.parse(bbconfig).default,
      ...flags
    };

    return {
      username: config["portal-username"],
      password: config["portal-password"],
      pageName: config["portal-page-name"],
      authUrl: `${config["portal-protocol"]}://${config["portal-host"]}:${config["portal-port"]}/${config["portal-auth-path"]}`,
      modelUrl: `${config["portal-protocol"]}://${config["portal-host"]}:${config["portal-port"]}/${config["portal-context"]}/portals/${config["portal-name"]}.json`
    };
  }

  async run() {
    // const { flags } = this.parse(Sync);

    // const config = this.getConfiguration();
    // const authUrl = `${config["portal-protocol"]}://${config["portal-host"]}:${config["portal-port"]}/${config["portal-auth-path"]}`;
    // const modelUrl = `${config["portal-protocol"]}://${config["portal-host"]}:${config["portal-port"]}/${config["portal-context"]}/portals/${config["portal-name"]}.json`;
    // console.log(config);

    // console.log(`Auth_ ${authUrl}`);
    // console.log(`Model_ ${modelUrl}`);

    // preserve cookies
    request = request.defaults({ jar: true });

    const tasks = new Listr([
      {
        title: "Reading configuration",
        task: ctx => {
          ctx.config = this.getConfiguration();
        }
      },
      {
        title: "Auth",
        task: (ctx, task) => {
          task.title = `Authenticating ${ctx.config.authUrl}`;

          console.log("getting...");
          const authGet = request.get(ctx.config.authUrl);
          authGet.on("response", res => {
            console.log("posting...");
            request.post(
              ctx.config.authUrl,
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded"
                },
                form: {
                  username: ctx.config.username,
                  password: ctx.config.password
                }
              },
              function(err, res) {
                console.log("processing model");
                if (err) {
                  console.error(err);
                } else {
                  console.log(res.statusCode);
                  pump(
                    request(ctx.config.modelUrl),
                    JSONStream.parse("pages.*", page =>
                      page.name === ctx.config.pageName ? page : null
                    ),
                    through.obj(writePrep),
                    fs.createWriteStream("app-model.json")
                    // console.error
                  );
                }
              }
            );
          });

          console.log(ctx.config.authUrl);
        }
      }
    ]);

    tasks.run().catch(err => {
      console.error(err);
    });
  }
}
