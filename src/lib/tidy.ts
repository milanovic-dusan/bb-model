import {
  assoc,
  curry,
  has,
  head,
  keys,
  lensProp,
  map,
  omit,
  over,
  pick,
  pipe,
  reduce
} from "ramda";

// utility function to rename object properties
// taken from ramda cookbook
const renameKeys = curry((keysMap, obj) =>
  reduce((acc, key) => assoc(keysMap[key] || key, obj[key], acc), {}, keys(obj))
);

const hasChildren = has("children");

const propsBlackList = [
  "chromeSrc",
  "src",
  "favicon",
  "options",
  "compatibility",
  "collectors",
  "render.requires",
  "render.strategy",
  "area",
  "order"
];

const pickKeys = pick(["name", "preferences", "children"]);
const renameProps = renameKeys({ preferences: "properties" });

const omitProps = over(lensProp("properties"), omit(propsBlackList));

const tidy = pipe(pickKeys, renameProps, omitProps);

function walkAndTidy(obj) {
  if (hasChildren(obj)) {
    // nodes
    // tslint:disable-next-line:ban-comma-operator
    return (obj.children = map(walkAndTidy, obj.children)), tidy(obj);
  }
  // leaves
  return tidy(obj);
}

export default function writePrep(buf, enc, cb) {
  if (buf.children.length === 0) {
    throw new Error(
      `Could not find app container, ${buf.preferences.title} page has no children`
    );
  }
  return cb(
    null,
    JSON.stringify(walkAndTidy(head(buf.children)), null, 2) + "\n"
  );
}
