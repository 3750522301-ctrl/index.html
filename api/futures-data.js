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

    const oiResp = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}USDT`);
    let oiRes = {};

    if (oiResp.ok) {
      oiRes = await oiResp.json();
    }

    const fundResp = await fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}USDT&limit=5`);
    let fundRes = [];

    if (fundResp.ok) {
      fundRes = await fundResp.json();
    }

    const currentOI = parseFloat(oiRes.openInterest || 0);
    const currentPrice = parseFloat(oiRes.sumOpenInterestValue || 0);

    let fundingRate = 0;
    if (Array.isArray(fundRes) && fundRes.length > 0) {
      fundingRate = fundRes.reduce((sum, f) => sum + parseFloat(f.fundingRate || 0), 0) / fundRes.length;
    }

    let globalLongShortRatio = 1;
    if (fundingRate > 0.0005) {
      globalLongShortRatio = 1.3;
    } else if (fundingRate < -0.0005) {
      globalLongShortRatio = 0.8;
    }

    return res.status(200).json({
      symbol,
      openInterest: currentOI,
      oiValue: currentPrice,
      fundingRate: fundingRate * 100,
      globalLongShortRatio,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error('获取合约数据失败:', e.message);
    return res.status(200).json({
      symbol: req.query.symbol || '',
      openInterest: 0,
      oiValue: 0,
      fundingRate: 0,
      globalLongShortRatio: 1,
      timestamp: Date.now()
    });
  }
}
