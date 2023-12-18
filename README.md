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