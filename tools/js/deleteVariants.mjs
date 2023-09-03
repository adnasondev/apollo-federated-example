/* eslint no-use-before-define: 0 */

import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";

// Get all variant names of the ephemeral graph
fetch("https://api.apollographql.com/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": process.env.EPHEMERAL_API_KEY,
    "apollographql-client-name": "explorer",
    "apollographql-client-version": "1.0.0",
  },
  body: JSON.stringify({
    query: `
      query ListGraphVariants($graphId: ID!) {
        graph(id: $graphId) {
          variants {
            id
            url
            latestPublication {
              publishedAt
            }
          }
        }
      }
      `,
    variables: {
      graphId: "Ephemeral-Fidelity-Supergraph",
    },
  }),
  agent: new HttpsProxyAgent(`${process.env.http_proxy}`),
})
  .then((res) => res.json())
  .then((result) => {
    console.log("Found existing ephemeral variants:");
    console.log(JSON.stringify(result, null, 4));
    return deleter(result.data.graph.variants);
  })
  .then(() => {
    console.log("Script completed successfully");
  })
  .catch((err) => {
    console.log("Encountered error in variant deletion script");
    console.log(err);
  });

// Loop through the list and delete each variant
function deleter(variantsList) {
  const responseList = variantsList.map((variantObj) => {
    const variant = variantObj.id;
    let variantDate = variantObj.latestPublication.publishedAt;
    variantDate = new Date(variantDate).getTime();
    const variantName = variant.split("@")[1];

    if (dateHelper(variantDate)) {
      return fetch("https://api.apollographql.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.EPHEMERAL_API_KEY,
          "apollographql-client-name": "explorer",
          "apollographql-client-version": "1.0.0",
        },
        body: JSON.stringify({
          query: `
            mutation DeleteVariant($graphId: ID!, $variantName: String!) {
              graph(id: $graphId) {
                variant(name: $variantName) {
                  delete {
                    deleted
                  }
                }
              }
            }
            `,
          variables: {
            graphId: "Ephemeral-Fidelity-Supergraph",
            variantName: `${variantName}`,
          },
        }),
        agent: new HttpsProxyAgent(`${process.env.HTTP_PROXY}`),
      });
    }
  });

  return Promise.all(responseList)
    .then((res) => {
      if (res[0]) {
        return Promise.all(res.map((val) => val.json()));
      } else {
        console.log("No variants that are over 2 weeks old were found.");
        return;
      }
    })
    .then((defProm) => console.log(JSON.stringify(defProm, null, 4)));
}

function dateHelper(date) {
  const diffinMilli = Math.abs(date - new Date().getTime());
  const milliSecPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffInWeeks = Math.floor(diffinMilli / milliSecPerWeek);

  return diffInWeeks > 2;
}
