// Credits: https://gist.github.com/mirontoli/a3dd9d9618477f1ddc5311c509bb8bab

const puppeteer = require("puppeteer");
const fs = require("node:fs");

const journalId = "24826007"; // update me
const mostRecentPostId = "78999287"; // update me
const fileName = "out.json";
const pageUrlMostRecentPost = `https://penzu.com/journals/${journalId}/${mostRecentPostId}`;

// Wait between requests so that the page can load completely
// We futher randomize this to avoid 429's
const minimumDelayMs = 2000;

// Get the WebSocket ("ws") from http://127.0.0.1:9222/json/version and connect puppeteer to it
//https://medium.com/@jaredpotter1/connecting-puppeteer-to-existing-chrome-window-8a10828149e0
// Note: localhost accepts http and not https
const axios = require("axios");
let wsChromeEndpointurl = "";
axios.get("http://127.0.0.1:9222/json/version").then(res => {
  console.log(res.data.webSocketDebuggerUrl);
  wsChromeEndpointurl = res.data.webSocketDebuggerUrl;
  console.log(`wsChromeEndpointurl ${wsChromeEndpointurl}`);
  downloadJournalPosts();
});

async function downloadJournalPosts() {
  const cache = {};
  const processed_ids = [];
  let counter = 0;
  let firstRow = true;

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsChromeEndpointurl,
  });

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  // https://docs.apify.com/academy/node-js/caching-responses-in-puppeteer
  page.on("request", async request => {
    const url = request.url();
    if (cache[url] && cache[url].expires > Date.now()) {
      await request.respond(cache[url]);
      return;
    }
    request.continue();
  });

  page.on("response", async response => {
    const url = response.url();
    const headers = response.headers();
    const cacheControl = headers["cache-control"] || "";
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAge =
      maxAgeMatch && maxAgeMatch.length > 1 ? parseInt(maxAgeMatch[1], 10) : 0;
    if (maxAge) {
      if (cache[url] && cache[url].expires > Date.now()) return;

      let buffer;
      try {
        buffer = await response.buffer();
      } catch (error) {
        // some responses do not contain buffer and do not need to be catched
        return;
      }

      cache[url] = {
        status: response.status(),
        headers: response.headers(),
        body: buffer,
        expires: Date.now() + maxAge * 1000,
      };
    }

    if (
      !url.startsWith(`https://penzu.com/api/journals/${journalId}/entries/`) ||
      url.endsWith("photos")
    ) {
      return;
    }

    counter++;
    let body;
    try {
      body = await response.json();
    } catch (err) {
      console.log(response.status(), response.statusText()); // likely to be 429
      console.assert(!err, err);
    }

    const entry = body?.entry;
    const history = body?.previous;
    console.assert(entry, "no entry!");
    console.log(`${counter} id: ${entry.id}`);
    const p = {
      id: entry.id,
      created_at: entry.created_at,
      title: entry.title,
      // plaintext: entry.plaintext_body,
      richtext_body: entry.richtext_body,
      tags: entry.tags.map(t => t.name),
    };
    const post = JSON.stringify(p);

    let row = `,\n${post}`;

    // treat the first row differently
    if (firstRow) {
      // Clear the file and write the opening bracket
      fs.writeFile(fileName, "", err => console.assert(!err, err));
      row = `[\n${post}`;
      firstRow = false;
    }

    fs.appendFile(fileName, row, err => console.assert(!err, err));
    processed_ids.push(p.id);

    if (history && history.length > 0) {
      let mostPreviousId = null;
      for (const h of history) {
        if (!processed_ids.includes(h.entry.id)) {
          mostPreviousId = h.entry.id;
          break;
        }
      }
      console.assert(mostPreviousId, "No unread post");

      // Wait here instead of adding a promise in the function body
      setTimeout(
        () =>
          page.goto(
            `https://penzu.com/journals/${journalId}/${mostPreviousId}`
          ),
        minimumDelayMs + Math.random() * 6000
      );
    } else {
      console.log("Reached last post");

      // Close the bracket
      fs.appendFile(fileName, "\n]\n", err => console.assert(!err, err));
      await page.close();
      console.log("Done");
      process.exit();
    }
  });

  // await page.setCacheEnabled(false); // do not use caching
  page.goto(pageUrlMostRecentPost);
}
