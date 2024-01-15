const functions = require("@google-cloud/functions-framework");
const puppeteer = require("puppeteer");

const PUPPETEER_WAIT_UNTIL = "networkidle2";
const LOAD_TIMEOUT = 3 * 60 * 1000;
const ELEMENT_RENDER_TIMEOUT = 10 * 1000;

export const POSTER_IMG_FILE_TYPE = "webp";

const PUPPETEER_OPTIONS = {
  headless: true,
};

functions.http("getPosterInfo", async (req, res) => {
  const pageUrl = req.query.page_url;

  if (!pageUrl) {
    throw new Error("page_url not exist");
  }

  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  const page = await browser.newPage();

  await page.goto(pageUrl, {
    waitUntil: PUPPETEER_WAIT_UNTIL,
    timeout: LOAD_TIMEOUT,
  });
  console.log("poster page loaded");

  await new Promise((resolve) => setTimeout(resolve, ELEMENT_RENDER_TIMEOUT));

  const createPosterBtn = await page.$("#createPosterBtn");
  if (!createPosterBtn) {
    throw new Error("createPosterBtn not exist");
  }
  await createPosterBtn.click();
  console.log("createPosterBtn clicked");

  await new Promise((resolve) => setTimeout(resolve, ELEMENT_RENDER_TIMEOUT));

  const posterLayoutElement = await page.$("#posterLayout");
  if (!posterLayoutElement) {
    throw new Error("posterLayout not exist");
  }
  await page.evaluate((el: HTMLElement) => {
    el.style.position = "relative";
    el.style.right = "auto";
  }, posterLayoutElement);

  const imgBuffer = await posterLayoutElement.screenshot({
    type: POSTER_IMG_FILE_TYPE,
  });

  const posterDataJson = await page.evaluate(
    () => (window as any).posterDataJson
  );

  res.send({
    imgBuffer,
    posterDataJson,
  });
});
