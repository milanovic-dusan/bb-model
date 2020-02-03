import { Command, flags } from "@oclif/command";
import * as Listr from "listr";
import * as pump from "pump";

import writePrep from "../lib/tidy";
import fs = require("fs");
import eos = require("end-of-stream");
import JSONStream = require("JSONStream");
import through = require("through2");

// tslint:disable-next-line:no-var-requires
let request = require("request");


export default class Map extends Command {
  // TODO: have better description
  public static description = `Transforms local model.
...
Produces 'app-model.json'.`;

  // flag names are matching @bb-cli tools
  public static flags = {
    "out-file": flags.string({
      default: "app-model"
    }),
    "portal-page-name": flags.string({
      default: "index"
    })
  };

  static args = [
    {
      name: 'model',               // name of arg to show in help and reference with args[name]
      required: true,            // make the arg required with `required: true`
      description: 'input file', // help description
      default: 'model.json'
    }
  ];

  public getConfiguration() {
    var { flags, args } = this.parse(Map);

    return {
      outFile: flags["out-file"],
      pageName: flags["portal-page-name"],
      model: args["model"]
    };
  }

  public async run() {
    // preserve cookies
    request = request.defaults({ jar: true });

    const tasks = new Listr([
      {
        task: ctx =>
          new Promise(resolve => {
            ctx.config = this.getConfiguration();
            resolve("OK");
          }),
        title: "Reading configuration"
      },
      {
        task: ctx =>
          new Promise((resolve, reject) => {
            const stream = pump(
              fs.createReadStream(ctx.config.model),
              JSONStream.parse("pages.*", page => {
                  console.log(JSON.stringify(ctx.config));
                  return page.name === ctx.config.pageName ? page : null;
                }
              ),
              through.obj(writePrep),
              fs.createWriteStream(`${ ctx.config.outFile }.json`)
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
      console.error(`Error: ${ error.message }`);
    });
  }
}
