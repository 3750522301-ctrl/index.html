export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: '缺少 symbol 参数' });
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_market_cap=true`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    const data = await response.json();
    const symbolLower = symbol.toLowerCase();

    if (data[symbolLower] && data[symbolLower].usd_market_cap) {
      return res.status(200).json({ 
        symbol,
        marketCap: data[symbolLower].usd_market_cap,
        timestamp: Date.now()
      });
    }

    return res.status(200).json({ 
      symbol,
      marketCap: null,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error('获取市值失败:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
