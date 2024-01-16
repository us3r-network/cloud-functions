const functions = require("@google-cloud/functions-framework");
const puppeteer = require("puppeteer");

const PUPPETEER_OPTIONS = {
  headless: true,
};

// default values for optional parameters
const PAGE_WAIT_UNTIL = "networkidle2";
const PAGE_LOAD_TIMEOUT = 3 * 60 * 1000;
const ELEMENT_RENDER_TIMEOUT = 10 * 1000;
const POSTER_LAYOUT_ID = "posterLayout";
const POSTER_IMG_FILE_TYPE = "webp";

/**
 * @param page_url {string} - The url of the page to get poster info.
 * @param page_wait_until {string} - The waitUntil option for page.goto().
 * @param page_load_timeout {number} - The timeout for page.goto().
 * @param poster_open_btn_id {string} - The id of the poster open button.
 * @param poster_layout_id {string} - The id of the poster layout.
 * @param element_render_timeout {number} - The timeout for waiting for element to render.
 * @param img_type {string} - The file type of the poster image.
 * @returns
 *  - imgBase64 {string} - The base64 string of the poster image.
 *  - posterDataJson {string} - The json string of the poster data.
 */
functions.http("getPosterInfo", async (req, res) => {
  const pageUrl = req.query.page_url;
  const pageWaitUntil = req.query.page_wait_until || PAGE_WAIT_UNTIL;
  const pageLoadTimeout = req.query.page_load_timeout || PAGE_LOAD_TIMEOUT;
  const posterOpenBtnId = req.query.poster_open_btn_id;
  const posterLayoutId = req.query.poster_layout_id || POSTER_LAYOUT_ID;
  const elementRenderTimeout =
    req.query.element_render_timeout || ELEMENT_RENDER_TIMEOUT;
  const imgType = req.query.img_type || POSTER_IMG_FILE_TYPE;

  if (!pageUrl) {
    throw new Error("page_url not exist");
  }

  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  try {
    const page = await browser.newPage();

    await page.goto(pageUrl, {
      waitUntil: pageWaitUntil,
      timeout: pageLoadTimeout,
    });
    console.log("poster page loaded");

    await new Promise((resolve) => setTimeout(resolve, elementRenderTimeout));

    if (posterOpenBtnId) {
      console.log("posterOpenBtnId: ", posterOpenBtnId);
      const posterOpenBtn = await page.$(`#${posterOpenBtnId}`);
      if (!posterOpenBtn) {
        throw new Error("posterOpenBtn not exist");
      }
      await posterOpenBtn.click();
      console.log("posterOpenBtn clicked");
    }

    await new Promise((resolve) => setTimeout(resolve, elementRenderTimeout));

    console.log("posterLayoutId: ", posterLayoutId);
    const posterLayoutElement = await page.$(`#${posterLayoutId}`);
    if (!posterLayoutElement) {
      throw new Error("posterLayoutElement not exist");
    }
    await page.evaluate((el) => {
      el.style.position = "relative";
      el.style.right = "auto";
    }, posterLayoutElement);

    const imgBuffer = await posterLayoutElement.screenshot({
      type: imgType,
    });
    const imgBase64 = imgBuffer.toString("base64");
    console.log("imgBase64: ", imgBase64);
    const posterDataJson = await page.evaluate(() => window.posterDataJson);
    console.log("posterDataJson: ", posterDataJson);

    res.send({
      imgBase64,
      posterDataJson,
    });
  } catch (error) {
    throw error;
  } finally {
    await browser.close();
  }
});
