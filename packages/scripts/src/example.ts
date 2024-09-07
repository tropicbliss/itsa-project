import { Resource } from "sst";
import { Example } from "@itsa-project/core/example";

console.log(`${Example.hello()} Linked to ${Resource.MyBucket.name}.`);
