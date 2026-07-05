import playwright from 'playwright';

const TPNB = '81910539';
const SEARCH_URL = `https://www.tesco.ie/groceries/en-IE/products/${TPNB}`;

const captured = [];

async function main() {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'en-IE',
  });

  const page = await context.newPage();

  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';
    const status = response.status();

    if (
      url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/i) ||
      url.includes('/assets/')
    ) {
      return;
    }

    const entry = {
      url: url.substring(0, 300),
      status,
      contentType: contentType.substring(0, 50),
      method: response.request().method(),
    };

    if (contentType.includes('json') || url.includes('api') || url.includes('bff') || url.includes('search') || url.includes('product')) {
      try {
        const body = await response.text();
        entry.body = body.substring(0, 2000);
        if (body.includes('price') || body.includes('Price') || body.includes('tpnb') || body.includes('monster') || body.includes('Monster')) {
          entry.hasProductData = true;
          console.log('\n========== PRODUCT DATA FOUND ==========');
          console.log('URL:', url);
          console.log('Status:', status);
          console.log('Content-Type:', contentType);
          console.log('Body length:', body.length);
          console.log('Body preview:', body.substring(0, 3000));
          console.log('========================================\n');
        }
      } catch (e) {
        entry.body = `[Error reading body: ${e.message}]`;
      }
    }

    captured.push(entry);
  });

  console.log(`Navigating to ${SEARCH_URL}...`);
  await page.goto(SEARCH_URL, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page loaded. Waiting for additional network activity...');
  await page.waitForTimeout(5000);

  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Body text preview:', bodyText);

  console.log('\n\n========== ALL CAPTURED REQUESTS ==========');
  for (const c of captured) {
    const marker = c.hasProductData ? ' <<<<<' : '';
    console.log(`[${c.status}] ${c.method} ${c.url}`);
    console.log(`  Type: ${c.contentType}${marker}`);
    if (c.body && c.body.length < 500) {
      console.log(`  Body: ${c.body}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
