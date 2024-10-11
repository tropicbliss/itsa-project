export namespace Log {
  export function createClient(data: Common) {
    logRaw({
      ...data,
      crud: "create",
    });
  }

  export function readClient(data: Common) {
    logRaw({
      ...data,
      crud: "read",
    });
  }

  export function deleteClient(data: Common) {
    logRaw({
      ...data,
      crud: "delete",
    });
  }

  export function updateClient(
    data: Common & { attributes: Record<string, AttributeValue> }
  ) {
    logRaw({
      crud: "update",
      ...data,
    });
  }
}

type Common = {
  agentId: string;
  clientId: string;
};

type Create = "create";
type Read = "read";
type Delete = "delete";
type Update = "update";

type CRD = {
  crud: Create | Read | Delete;
} & Common;

type U = {
  crud: Update;
  attributes: Record<string, AttributeValue>;
} & Common;

type AttributeValue = {
  beforeValue: string;
  afterValue: string;
};

type Data = CRD | U;

type Output = {
  crud: Create | Read | Update | Delete;
  attributeName: string;
  beforeValue?: string;
  afterValue?: string;
} & Common;

function logRaw(data: Data) {
  let output: Output;
  switch (data.crud) {
    case "update":
      output = {
        crud: data.crud,
        agentId: data.agentId,
        attributeName: Object.keys(data.attributes).join("|"),
        clientId: data.clientId,
        afterValue: Object.values(data.attributes)
          .map((val) => val.afterValue)
          .join("|"),
        beforeValue: Object.values(data.attributes)
          .map((val) => val.beforeValue)
          .join("|"),
      };
      break;
    case "read":
    case "create":
    case "delete":
      output = {
        crud: data.crud,
        agentId: data.agentId,
        attributeName: data.clientId,
        clientId: data.clientId,
      };
  }
  console.log(JSON.stringify(output));
}
