import { doesNotReject, rejects } from "node:assert";
import { test } from "node:test";
import isCODEOWNERS from "./isCODEOWNERS.js";

test("isCODEOWNERS", async (t) => {
  const github = {
    rest: {
      repos: {
        getContent: async ({}) => {
          return {
            data: {
              content: Buffer.from(
                `
* @octocat @yamachu
/ @octocat
`,
                "utf-8"
              ).toString("base64"),
            },
          };
        },
      },
    },
  };

  await t.test("CODEOWNERに含まれると成功すること", async () => {
    await doesNotReject(() =>
      isCODEOWNERS(
        { github },
        { owner: "octocat", repo: "Hello-World", actor: "octocat" }
      )
    );

    await doesNotReject(() =>
      isCODEOWNERS(
        { github },
        { owner: "octocat", repo: "Hello-World", actor: "yamachu" }
      )
    );
  });

  await t.test("CODEOWNERに含まれないactorは失敗すること", async () => {
    await rejects(() =>
      isCODEOWNERS(
        { github },
        { owner: "octocat", repo: "Hello-World", actor: "octodog" }
      )
    );
  });
});
