# Getting Penzu journal entries out

Paid $4.99 for Penzu Pro to export journal entries as PDF. Clicked the Export button and waited a day. Nothing happened. DIY instead.

Credits: [Anatoly Mironov](https://chuvash.eu/2024/penzu-export/)

## Steps

```bash
curl -O https://gist.githubusercontent.com/mirontoli/a3dd9d9618477f1ddc5311c509bb8bab/raw/penzu-export.js
npm install axios && npm install puppeteer-core
```

~~Start Firefox in WSL with a [Remote Agent](https://firefox-source-docs.mozilla.org/remote/cdp/Usage.html) to communicate with the web document. Firefox's remote protocol implements a subset of the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).~~

For this example, my pet browser Firefox didn't seem to work. It does not seem to support the ``/json/version`` endpoint.

```console
$ firefox --remote-debugging-port
WebDriver BiDi listening on ws://127.0.0.1:9222

...in another terminal
$ node penzu-export.js > out.txt 2>&1
node:internal/process/promises:394
    triggerUncaughtException(err, true /* fromPromise */);
    ^
AxiosError: Request failed with status code 404
```

So I use Chrome as suggested:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
rm google-chrome-stable_current_amd64.deb

google-chrome-stable --remote-debugging-port=9222
```

Log in to Penzu and get the `journalId` and `mostRecentPostId`.

Now run the script:

```console
node penzu-export.js
```

The script traverses journal posts from newest to oldest. During this time, Penzu will display the site's usual contents before it is redirected. Puppeteer intercepts the response before passing it through.

Once the oldest post is reached, the ``json`` file is closed and the script should return.

## Caveat

A randomized wait time is added before redirecting to the next newest post to avoid triggering [429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) errors. If these still arise, increase ``minimumDelayMs`` or add to its variance (see the line with ``Math.random``).

## Bonus

Run the attached Python script to convert the ``json`` file into a ``md`` file.
