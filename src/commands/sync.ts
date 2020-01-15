import { Command, flags } from "@oclif/command";
import * as Listr from "listr";
import * as pump from "pump";

import writePrep from "../lib/tidy";

import fs = require("fs");

// tslint:disable-next-line:no-var-requires
let request = require("request");
import eos = require("end-of-stream");
import JSONStream = require("JSONStream");
import through = require("through2");

export default class Sync extends Command {
  // TODO: have better description
  public static description = `Syncronizes remote model with local.
...
Produces 'app-model.json'.
Supports .bbconfig file in the current working directory
  `;

  // TODO: update examples
  public static examples = [
    `$ bb-model sync --portal-name=<experience-name>
  ✔ Reading configuration
  ✔ Authenticating
  ✔ Processing model
`
  ];

  // flag names are matching @bb-cli tools
  public static flags = {
    "out-file": flags.string({
      default: "app-model"
    }),
    "portal-context": flags.string({ default: "gateway/api" }),
    "portal-host": flags.string({ default: "localhost" }),
    "portal-port": flags.integer({ default: 8080 }),
    "portal-protocol": flags.enum({
      default: "http",
      options: ["http", "https"]
    }),

    "portal-auth-path": flags.string({
      default: "gateway/api/auth/login"
    }),
    "portal-name": flags.string({
      default: "retail-banking-demo-wc3"
    }),
    "portal-page-name": flags.string({
      default: "index"
    }),
    "portal-password": flags.string({
      default: "admin"
    }),
    "portal-username": flags.string({
      default: "admin"
    })
  };

  // no support for positional args
  // static args = [{ name: "url" }];

  public getConfiguration() {
    // tslint:disable-next-line:no-shadowed-variable
    const { flags } = this.parse(Sync);
    // simplest way (sync)
    // file size is ~250B
    // an optimisation candidate
    const filename = ".bbconfig";
    let bbconfig = "";
    if (fs.existsSync(filename)) {
      bbconfig = fs.readFileSync(".bbconfig").toString();
    }

    const config = {
      ...JSON.parse(bbconfig).default,
      ...flags
    };

    return {
      authUrl: `${config["portal-protocol"]}://${config["portal-host"]}:${config["portal-port"]}/${config["portal-auth-path"]}`,
      modelUrl: `${config["portal-protocol"]}://${config["portal-host"]}:${config["portal-port"]}/${config["portal-context"]}/portals/${config["portal-name"]}.json`,
      outFile: config["out-file"],
      pageName: config["portal-page-name"],
      password: config["portal-password"],
      username: config["portal-username"]
    };
  }

  public async run() {
    // preserve cookies
    request = request.defaults({ jar: true });

    const tasks = new Listr([
      {
        task: ctx =>
          new Promise(reoslve => {
            ctx.config = this.getConfiguration();
            reoslve("OK");
          }),
        title: "Reading configuration"
      },
      {
        task: ctx =>
          new Promise((resolve, reject) => {
            const authGet = request.get(ctx.config.authUrl);
            authGet.on("response", _ => {
              request.post(
                ctx.config.authUrl,
                {
                  form: {
                    password: ctx.config.password,
                    username: ctx.config.username
                  },
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
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
          }),
        title: "Authenticating"
      },
      {
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
              if (err) {
                return reject(new Error("stream had an error or closed early"));
              }
              resolve("OK");
            });
          }),
        title: "Processing model"
      }
    ]);

    tasks.run().catch(error => {
      // tslint:disable-next-line:no-console
      console.error(`Error: ${error.message}`);
    });
  }
}
