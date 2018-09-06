const bnbAPI = require('node-binance-api');
var binance = new bnbAPI().options({
  
});

ExchangeInfo();
//const binance = require('node-binance-api')().options({
//	APIKEY: 'IKA0r7ZsSfmaI9DAIdRUTj6ngCX8BwKOBuf4dIaPyqmGnz2O8rzMktm4xMTrycwx',
//  APISECRET: 'M6VEwpa2oTkwbm9L2ugfIruRDXRYg2CDmls9n3UQtIO1KYibbwKs5zZXmEQ2qatD',
//  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
//  test: true, // If you want to use sandbox mode where orders are simulated
//});

//binance.openOrders(false, (error, openOrders) => {
//  console.log("openOrders", openOrders);
//});
function AfterUpdateAPI() {
  CloseAllWS();
  InitUserData();
  GetBalances();
  GetOpenOrderList();
}

function CloseAllWS() {
  let endpointss = binance.websockets.subscriptions();
  for (let endpoint in endpointss) {
    binance.websockets.terminate(endpoint);
  }
}

function UpdateApiKey(apiKey, secretKey) {
  if(CheckKey()==true){
    binance = new bnbAPI().options({
      useServerTime: true,
      APIKEY: apiKey,
      APISECRET: secretKey,
      test: false
    });
    AfterUpdateAPI();
  }
}

function GetBalances() {
  try {
    setTimeout(function () {
      try{
        binance.balance((error, balances) => {
          //  console.log("balances()", balances);
          //  console.log("ETH balance: ", balances.ETH.available);
          window['balances'] = balances;
          UpdateBalances();
        });
      }catch(e){}
    }, 1000);
  } catch (e) {}
}

function ConnectChart(Alt, Mast) {
  let symbol = Alt + Mast;
  if (window['CurentCoin'] === undefined) {
    window['CurentCoin'] = Alt.toLowerCase() + Mast.toLowerCase();
  } else {
    var wsstring = window['CurentCoin'] + '@kline_15m';
    binance.websockets.terminate(wsstring);
    window['CurentCoin'] = symbol.toLowerCase();
  }
  binance.websockets.chart(symbol, "15m", (symbol, interval, chart) => {
    try {
      let tick = binance.last(chart);
      let last = chart[tick].close;
      //console.log(chart);
      let ChartData = SplitChartData(chart);
      UpdateDataChart(ChartData.categoryData, ChartData.values);
      $('#symbol-name').text(symbol);
      $('#symbol-price').text(last);
    } catch (e) {}
  });
}

function ExchangeInfo() {
  try {
    binance.exchangeInfo(function (error, data) {
      let minimums = {};
      for (let obj of data.symbols) {
        let filters = {
          status: obj.status
        };
        for (let filter of obj.filters) {
          if (filter.filterType == "MIN_NOTIONAL") {
            filters.minNotional = filter.minNotional;
          } else if (filter.filterType == "PRICE_FILTER") {
            filters.minPrice = filter.minPrice;
            filters.maxPrice = filter.maxPrice;
            filters.tickSize = filter.tickSize;
          } else if (filter.filterType == "LOT_SIZE") {
            filters.stepSize = filter.stepSize;
            filters.minQty = filter.minQty;
            filters.maxQty = filter.maxQty;
          }
        }
        //filters.baseAssetPrecision = obj.baseAssetPrecision;
        //filters.quoteAssetPrecision = obj.quoteAssetPrecision;
        filters.orderTypes = obj.orderTypes;
        filters.icebergAllowed = obj.icebergAllowed;
        minimums[obj.symbol] = filters;
      }
      global.filters = minimums;
    });
  } catch (e) {
    ExchangeInfo();
  }
}

function CalcAmount(symb, amount, price) {
  try {
    let symbol = symb.replace('-', '').toUpperCase();
    let info = global.filters[symbol];
    let minQty = info.minQty;
    let minNotional = info.minNotional;
    let stepSize = info.stepSize;
    if (amount < minQty) {
      amount = minQty;
    }
    if (price * amount < minNotional) {
      amount = minNotional / price;
    }
    return amount = binance.roundStep(amount, stepSize);
  } catch (e) {
    return amount;
  }
}

function PlaceLimitOrder(Symb, Amount, Price, Side) {
  let Amo = CalcAmount(Symb,Amount,Price);
  if (Side == "buy") {
    console.log("Buy " + Symb + " A:" + Amo + "/ P:" + Price)
    binance.buy(Symb, Amo, Price);
  } else {
    console.log("Sell " + Symb + " A:" + Amo + "/ P:" + Price)
    binance.sell(Symb, Amo, Price);
  }
}

function PlaceMarketOrder(Symb, Amount, Side) {
  if (Side == "buy") {
    binance.marketBuy(Symb, Amount);
  } else {
    binance.marketSell(Symb, Amount);
  }
}

function GetOpenOrderList() {
  binance.openOrders(false, (error, openOrders) => {
    global.openOrders = openOrders;
    CheckOpenOrderTime(openOrders);
    LoadOprnOrderList(openOrders);
  });
}

function CancelOrder(Symb, OrderId) {
  binance.cancel(Symb, OrderId, (error, response, symbol) => {
    console.log(Symb + " cancel response:", response);
  });
}

function GetLastestPriceAll() {
  binance.prices((error, ticker) => {
    global.prices = ticker;
    GetTrade();
  });
}

function CheckOpenOrderTime(data){
  for(let i = 0 ; i < data.length; i ++){
    let orderTime = new Date(data[i].time);
    let nowTime = new Date();
    let diff = nowTime - orderTime;
    let minuteDiff = diff / ( 1000 * 60 );
    if(minuteDiff > 10){
      CancelOrder(data[i].symbol , data[i].orderId);
    }
  }
}

// ----------------------- USERDATA

function InitUserData() {
  binance.websockets.userData(balance_update, execution_update);
}

function balance_update(data) {
  console.log("Balance Update");
  $('#binance-balance').html("");
  for (let obj of data.B) {
    let {
      a: asset,
      f: available,
      l: onOrder
    } = obj;

    if (available == "0.00000000") continue;
    RealTimeBalances(asset, available, onOrder);
  }
}

function execution_update(data) {
  console.log(data);
  let {
    x: executionType,
    s: symbol,
    p: price,
    q: quantity,
    S: side,
    o: orderType,
    i: orderId,
    X: orderStatus,
    T: orderTime
  } = data;
  if (executionType == "NEW") {
    if (orderStatus == "REJECTED") {
      console.log("Order Failed! Reason: " + data.r);
    }
  }
  if (executionType == "TRADE") {
    if (side == "BUY") {
      SetTrade(orderId, symbol, side, price, quantity);
    } else {
      if (side == "SELL") {
        SetSellTrade(symbol, price);
      }
    }
  }
  //NEW, CANCELED, REPLACED, REJECTED, TRADE, EXPIRED
  console.log(symbol + "\t" + side + " " + executionType + " " + orderType + " ORDER #" + orderId);
  let hisData = [orderTime, symbol, side, executionType, orderStatus, price, quantity];
  SetHistory(orderId, hisData);
  GetHistory();
  GetOpenOrderList();
}

function RealTimeBalances(symb, avail, lock) {
  let row = "";
  row += "<li>";
  row += "  <a>";
  row += "    <h4 class='control-sidebar-subheading'>";
  row += `    	<span>${symb}</span>`
  row += "    	<span class='pull-right-container'>";
  row += `    		<span class='pull-right' id='Amount-${symb}'>${avail}</span><br>`;
  row += `    		<span class='pull-right text-yellow' id='Amount-Lock-${symb}'>${lock}</span>`;
  row += "    	</span>";
  row += "    </h4>";
  row += "  </a>";
  row += "</li>";
  $('#binance-balance').append(row);
}
