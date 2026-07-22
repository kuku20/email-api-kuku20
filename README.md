npm i --save class-validator class-transformer
npm install --save aws-sdk
npm install --save @nestjs/typeorm typeorm mysql

npm i @nestjs/typeorm typeorm sqlite3

npm i cookie-session @types/cookie-session
npm i cross-env

1type/brand to many product

1 product to 1type/brand

nest g mo stock
nest g co stock
nest g s stock

https://site.financialmodelingprep.com/developer/docs#daily-chart-charts

nest g resource stockUser

oneToOne:
one User have only One stockUser(user-list)

ManyToOne:
many watchList to one stockUser(user-list)

https://nestjs-doc.exceptionfound.com/classes/httpexception.html

need UseGuards @Post('/watchlist') and @Post('/user-list')


  "sentiment_score_definition": "x <= -0.35: Bearish; -0.35 < x <= -0.15: Somewhat-Bearish; -0.15 < x < 0.15: Neutral; 0.15 <= x < 0.35: Somewhat_Bullish; x >= 0.35: Bullish",
  "relevance_score_definition": "0 < x <= 1, with a higher score indicating higher relevance.",

  create a admin account as well


  nest g resource stockPortfolio
  
  



  data: {
    code: 429,
    message: 'You have run out of API credits for the day. 878 API credits were used, with the current limit being 800. Wait for the next day or consider switching to a paid plan that will remove daily limits at https://twelvedata.com/pricing',
    status: 'error'
  }'


   `**[4200-on1m](http://localhost:4200/price-log/${ticker})** | **[4200-5m](http://localhost:4200/price-log/${ticker}?daysRange=5)** | **[4200-15m](http://localhost:4200/price-log/${ticker}?daysRange=15)** \n **[3001-PO-day](http://localhost:3001/?stockTicker=${ticker}&endpoint=po&timefame=1day)** | **[3001-FM-day](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timefame=1day)** | **[3001-fm-1m](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timefame=1min)** | **[3001-fm-5m](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timefame=5min)** | **[3001-fm-15m](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timefame=15min)** \n **[TradingView](https://www.tradingview.com/chart/?symbol=${ticker})**`

