import { Command, flags } from "@oclif/command";
import * as pump from "pump";
import * as Listr from "listr";

import writePrep from "../lib/tidy";
import { resolve } from "dns";
import reject from "ramda/es/reject";
import { cookieCompare } from "tough-cookie";
const fs = require("fs");

let request = require("request");
const JSONStream = require("JSONStream");
const through = require("through2");
const eos = require("end-of-stream");

export default class Sync extends Command {
  // TODO: have better description
  static description = `Syncronizes remote model with local`;

  // TODO: update examples
  static examples = [
    `$ bb-model sync --portal-name=<experience-name>
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
    }),
    "out-file": flags.string({
      default: "app-model"
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
      outFile: config["out-file"],
      authUrl: `${config["portal-protocol"]}://${config["portal-host"]}:${config["portal-port"]}/${config["portal-auth-path"]}`,
      modelUrl: `${config["portal-protocol"]}://${config["portal-host"]}:${config["portal-port"]}/${config["portal-context"]}/portals/${config["portal-name"]}.json`
    };
  }

  async run() {
    // preserve cookies
    request = request.defaults({ jar: true });

    const tasks = new Listr([
      {
        title: "Reading configuration",
        task: ctx =>
          new Promise(reoslve => {
            ctx.config = this.getConfiguration();
            reoslve("OK");
          })
      },
      {
        title: "Authenticating",
        task: ctx =>
          new Promise((resolve, reject) => {
            const authGet = request.get(ctx.config.authUrl);
            authGet.on("response", _ => {
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
                (err, res) => {
                  if (err) {
                    throw new Error(err.message);
                  }
                  if (res.statusCode === 200) {
                    resolve("OK");
                  } else {
                    reject(new Error("Authentication failed"));
                  }
                }
              );
            });
          })
      },
      {
        title: "Processing model",
        task: ctx =>
          new Promise((resolve, reject) => {
            const stream = pump(
              request(ctx.config.modelUrl),
              JSONStream.parse("pages.*", page =>
                page.name === ctx.config.pageName ? page : null
              ),
              through.obj(writePrep),
              fs.createWriteStream(`${ctx.config.outFile}.json`)
            );
            eos(stream, err => {
              if (err)
                return console.log("stream had an error or closed early");
              resolve("OK");
            });
          })
      }
    ]);

    tasks.run().catch(err => {
      console.error(`Error: ${err.message}`);
    });
  }
}
