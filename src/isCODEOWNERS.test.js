import { doesNotReject, rejects } from "node:assert";
import { test } from "node:test";
import isCODEOWNERS from "./isCODEOWNERS.js";

test("isCODEOWNERS", async (t) => {
  const github = {
    triggering_actor: "octocat",
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
    const modifiedGithub = { ...github, triggering_actor: "yamachu" };

    await doesNotReject(() =>
      isCODEOWNERS({ github }, { owner: "octocat", repo: "Hello-World" })
    );

    await doesNotReject(() =>
      isCODEOWNERS(
        { github: modifiedGithub },
        { owner: "octocat", repo: "Hello-World" }
      )
    );
  });

  await t.test("CODEOWNERに含まれないactorは失敗すること", async () => {
    const failGithub = { ...github, triggering_actor: "octodog" };

    await rejects(() =>
      isCODEOWNERS(
        { github: failGithub },
        { owner: "octocat", repo: "Hello-World" }
      )
    );
  });
});
