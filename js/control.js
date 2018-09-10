var request = require('request');
const {
  dialog
} = require('electron').remote;
// ----------------------- INIT CONST VARIABLE
const CoinList = [
  "EOS", "TRX", "WTC", "ADA", "BNB", "XRP", "VEN", "BCD", "XLM", "ICX", "GTO", "NEO", "BCC", "XVG", "LTC", "VIBE", "RLC", "IOTA", "HSR", "QTUM", "ELF", "ENJ", "APPC", "BTG", "NEBL", "ETC", "ZRX", "TNB", "LRC", "SNT", "BRD", "SUB", "DNT", "OMG", "POE", "ARN", "LEND", "FUEL", "LSK", "POWR", "GVT", "NAV", "BTS", "STRAT", "XMR", "OST", "GXS", "ZEC", "EDO", "LINK", "CTR", "FUN", "WABI", "CDT", "YOYO", "QSP", "MDA", "ENG", "AION", "CND", "BCPT", "TRIG", "AST", "REQ", "KNC", "CMT", "DASH", "MANA", "EVX", "DLT", "MTL", "TNT", "BAT", "LUN", "NULS", "DGD", "BQX", "MOD", "ARK", "SALT", "GAS", "AMB", "RCN", "MCO", "ICN", "KMD", "SNGLS", "MTH", "WAVES", "STORJ", "RDN", "VIB", "ADX", "XZC", "SNM", "OAX", "PPT", "WINGS", "BNT"
];
const CountPrice = 3;
var downColor = '#ec0000';
var downBorderColor = '#8A0000';
var upColor = '#00da3c';
var upBorderColor = '#008F28';
var dom = document.getElementById('CoinChart');
window["CoinChart"] = echarts.init(dom);
var datapoint = [];
const dialogSell = {
  buttons: ['OK', 'Cancel'],
  message: 'Do you want to sell it all?'
}
const dialogDelete = {
  buttons: ['OK', 'Cancel'],
  message: 'Do you want to delete this trade?'
}
const dialogCancelOrder = {
  buttons: ['OK', 'Cancel'],
  message: 'Do you want to cancel this order?'
}
// ----------------------- INTERVAL

setInterval(function () {
  if (CheckKey() == true) {
    GetSignalData();
    GetBuySellAll();
    GetBalances();
    CheckSignal();
    GetOpenOrderList();
  }
}, 20000);

setInterval(function () {
  CheckAutoCoinError();
}, 120000);

setInterval(function () {
  GetLastestPriceAll();
}, 10000);

// ----------------------- ON READY

$(document).ready(function () {

  // ----------------------- CRETE UI ELEMENT 
  CreateMenu();
  InitChart();
  GetAuto();
  UpdateBalances();
  GetApiKey();
  GetFav();
  GetBuySellAll();
  GetHistory();
  GetLastestPriceAll();
  // ----------------------- ELEMENT EVENT 
  $('.sidebar').on('click', '.menu-symbol', function () {
    $('#chart-loading').removeClass('hidden');
    $('.menu-symbol').removeClass('active');
    $(this).addClass('active');
    $('#order-amount').val('');
    $('#order-price').val('');
    $('#total-price').val('');
    let alt = $(this).attr('alt');
    let avail = $('#Amount-' + alt).text();
    if (avail == "")
      avail = 0;
    $('#symbol-avail').text(avail);

    ConnectChart($(this).attr('alt'), $(this).attr('mast'));
    GetSignalData();
    GetBuySellAll();
  });

  $('#btn-auto-save').on('click', function () {
    let AutoSymbol = $('#auto-symbol').val();
    let AutoAmount = $('#auto-amount').val();
    AddAutoRow(AutoSymbol, AutoAmount);
    SetAuto(GetAutoList());
  });

  $('#btn-api-save').on('click', function () {
    let apiKey = $('#apiKey').val();
    let secretKey = $('#secretKey').val();
    SetApiKey(apiKey, secretKey);
  });

  $('#binance-auto').on('click', '.auto-sticker', function () {
    $(this).parents('li').remove();
    SetAuto(GetAutoList());
  });

  $('#btn-fav').on('click', function () {
    let mast = $('.menu-symbol.active').attr('mast');
    let alt = $('.menu-symbol.active').attr('alt');
    UpdateFav(mast, alt);
  });

  $('#btn-refesh-balance').on('click', function () {
    GetBalances();
  });

  $('.btn-percent').on('click', function () {
    let symb = $('#symbol-name').text();
    let percent = $(this).attr('val');
    let side = "";
    if ($('#order-sell').prop('checked') == false)
      side = "buy";
    else
      side = "sell";
    if (symb != "") {
      let amount = CalcPercentAmount(symb, percent, side);
      let price = $('#symbol-price').text();
      $('#order-amount').val(amount);
      $('#order-price').val(price);
      $('#total-price').val(amount * price);
    }
  });

  $('#order-amount').on('change', function () {
    let symb = $('#symbol-name').text();
    if (symb != "") {
      let price = $('#symbol-price').text();
      let amount = $(this).val();
      let stepAmount = CalcAmount(symb, amount, price);
      $(this).val(stepAmount);
      $('#order-price').val(price);
      $('#total-price').val(stepAmount * price);
    }
  });

  $('#order-price').on('change', function () {
    let amount = $('#order-amount').val();
    let price = $(this).val();
    $('#total-price').val(amount * price);
  });

  $('#btn-place-order').on('click', function () {
    let amount = $('#order-amount').val();
    let price = $('#order-price').val();
    let symb = $('#symbol-name').text();
    let side = "buy";
    let mast = symb.substring(symb.length - 3, symb.length);
    let maxTT = $('#Amount-' + mast).text();
    if ($('#order-sell').prop('checked') == true) {
      side = "sell";
    }
    amount = CalcAmount(symb, amount, price);
    if ((price * amount) > maxTT && side !="sell") {
      return;
    } else {
      PlaceLimitOrder(symb, amount, price, side);
    }
  });

  $('#btn-refresh-open-order').on('click', function () {
    GetOpenOrderList();
  });

  $('#open-order-list').on('click', '.open-order-item', function () {
    let orderid = $(this).attr('orderid');
    let symb = $(this).attr('symb');
    dialog.showMessageBox(dialogCancelOrder, i => CancelOpenOrder(i, symb, orderid));
  });

  $('#tbl-trade').on('click', '.trade-item', function () {
    let info = $(this).parent();
    let sell = info.attr('spri');
    let pri = info.attr('cpri');
    let tId = info.attr('tid');
    let symb = info.attr('symb');
    if (sell == 0) {
      dialog.showMessageBox(dialogSell, i => SellTrade(i, symb, pri));
    } else {
      dialog.showMessageBox(dialogDelete, i => DeleteTradeRow(i, tId));
    }
  });

  $('#tbl-trade').on('click', '.trade-delete', function () {
    let tId = $(this).parents('tr').attr('tid');
    dialog.showMessageBox(dialogDelete, i => DeleteTradeRow(i, tId));

  });

  $('#txt_search').on('keyup', function () {
    SearchCoin($(this).val().toUpperCase());
  });
  
  $('#auto-prof').on('change', function () {
    let stoplost = $('#auto-stop').val();
    let profit = $(this).val();
    SetProfit(profit,stoplost);
  });
  $('#auto-stop').on('change', function () {
    let stoplost = $(this).val();
    let profit = $('#auto-prof').val();
    SetProfit(profit,stoplost);
  });
});

// ----------------------- MAIN FUNCTION 

function UpdateBalances() {
  if (window['balances'] === undefined) {
    //		console.log("Blances undefined");
  } else {
    $('#binance-balance').html("");
    let Balance = window['balances'];
    var Keys = Object.keys(Balance);

    for (var i = 0; i < Keys.length; i++) {
      if (parseFloat(Balance[Keys[i]].available) != 0 || parseFloat(Balance[Keys[i]].onOrder) != 0) {
        let row = "";
        row += "<li>";
        row += "  <a>";
        row += "    <h4 class='control-sidebar-subheading'>";
        row += `    	<span>${Keys[i]}</span>`
        row += "    	<span class='pull-right-container'>";
        row += `    		<span class='pull-right' id='Amount-${Keys[i]}'>${Balance[Keys[i]].available}</span><br>`;
        row += `    		<span class='pull-right text-yellow' id='Amount-Lock-${Keys[i]}'>${Balance[Keys[i]].onOrder}</span>`;
        row += "    	</span>";
        row += "    </h4>";
        row += "  </a>";
        row += "</li>";
        $('#binance-balance').append(row);
      }
    }
  }
}

function CreateMenu() {
  for (var i = 0; i < CoinList.length; i++) {
    let btcrow = `<li class='menu-symbol ${CoinList[i]}BTC' mast='BTC' alt='${CoinList[i]}'><a href="#" class="item-symbol"><i class="fa fa-circle-o"></i>${CoinList[i]}-BTC<span class="pull-right label"></span></a></li>`;
    let ethrow = `<li class='menu-symbol ${CoinList[i]}ETH' mast='ETH' alt='${CoinList[i]}'><a href="#" class="item-symbol"><i class="fa fa-circle-o"></i>${CoinList[i]}-ETH<span class="pull-right label"></span></a></li>`;
    $('#menu-btc').append(btcrow);
    $('#menu-eth').append(ethrow);

    $('#auto-symbol').append('<option value="' + CoinList[i] + '-BTC">' + CoinList[i] + '-BTC</option><option value="' + CoinList[i] + '-ETH">' + CoinList[i] + '-ETH</option>');
  }
}

function GetBuySellAll() {
  try {
    request({
      uri: `https://signal3.exacoin.co/ai_all_signal?time=5m`,
      method: 'GET'
    }, function (err, res, body) {
      if (err) {
        console.log(err);
      } else {
        try {
          let data = JSON.parse(body);
          $('.item-symbol span').removeClass('bg-red');
          $('.item-symbol span').removeClass('bg-gray');
          $('.item-symbol span').text("");
          for (let i = 0; i < data.buy.length; i++) {
            let coin = data.buy[i].currency.toUpperCase();
            $('.' + coin + ' a span').text(data.buy[i].signal);
            $('.' + coin + ' a span').addClass('bg-gray');
          }
          for (let i = 0; i < data.sell.length; i++) {
            let coin = data.sell[i].currency.toUpperCase();
            $('.' + coin + ' a span').text(data.sell[i].signal);
            $('.' + coin + ' a span').addClass('bg-red');
          }
        } catch (e) { console.log(e) }
      }
    });
  } catch (e) { console.log(e) }
}

function GetSignalData() {
  if (window['CurentCoin'] !== undefined) {
    try {
      var currentsymbol = window['CurentCoin'];
      mast = currentsymbol.substr(currentsymbol.length - 3, currentsymbol.length);
      alt = currentsymbol.substr(0, currentsymbol.length - 3);
      request({
        headers: {
          "path": `get_signal?currency=${alt}-${mast}&market=binance`,
          "origin": "https://exacoin.co",
          "accept-language": "en-US,en;q=0.9,vi;q=0.8",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
          "accept": "*/*",
          "referer": "https://exacoin.co/dashboard/ai-signal",
          "authority": "signal3.exacoin.co",
          "scheme": "https"
        },
        uri: `https://signal3.exacoin.co/get_signal?currency=${alt}-${mast}&market=binance`,
        method: 'GET'
      }, function (err, res, body) {
        if (err) {
          console.log(err);
        } else {
          UpdateSignalPoint(JSON.parse(body));
        }
      });
    } catch (e) {console.log(e)}
  }
}

function UpdateSignalPoint(signalData) {
  try {
    var dataPoint = [];
    var jsonData = jQuery.parseJSON(signalData.result);
    var CoinBuy = jsonData.mark_buy;
    var CoinSell = jsonData.mark_sell;
    var Year = (new Date()).getFullYear();
    for (var i = 0; i < CoinSell.length; i++) {
      let sigTime = moment(Year + "/" + CoinSell[i].date, ['YYYY/MM/DD HH:mm:ss']).add(7, 'hours').format('MM/DD HH:mm:ss');
      dataPoint.push({
        name: 'S',
        coord: [
	        sigTime,
	        CoinSell[i].value
	      ],
        value: CoinSell[i].value,
        symbol: 'pin',
        symbolSize: 20,
        label: {
          fontSize: 0,
          show: false,
        },
        itemStyle: {
          color: 'rgb(194, 53, 49)',
        }
      });
    }
    for (var i = 0; i < CoinBuy.length; i++) {
      let sigTime = moment(Year + "/" + CoinBuy[i].date, ["YYYY/MM/DD HH:mm:ss"]).add(7, 'hours').format('MM/DD HH:mm:ss');
      dataPoint.push({
        name: 'B',
        coord: [
	        sigTime,
	        CoinBuy[i].value
	      ],
        value: CoinBuy[i].value,
        symbol: 'pin',
        symbolSize: 20,
        label: {
          fontSize: 0,
          show: false,
        },
        itemStyle: {
          color: 'rgb(47, 69, 84)',
        }
      });
    }
    let option = window["CoinChart"].getOption();
    option.series[0].markPoint.data = dataPoint;
    //datapoint = dataPoint;
    window["CoinChart"].setOption(option);
  } catch (e) {}
}

function AddAutoRow(coin, amount) {
  if ($('.auto-' + coin.replace('-', '')).length < 1) {
    let row = "";
    row += '<li>';
    row += '	<a>';
    row += `		<h4 class="control-sidebar-subheading auto-coin auto-${coin.replace('-','')}" symbol="${coin}" amount="${amount}">`;
    row += `			<span>${coin}</span> : <span>${amount}</span>`;
    row += '			<span class="pull-right label bg-red auto-sticker">Del</span>';
    row += '		</h4>';
    row += '	</a>';
    row += '</li>';
    $('#binance-auto').append(row);
    $('#auto-symbol').val(-1);
    $('#auto-amount').val("");
  } else {
    $('#auto-symbol').val(-1);
    $('#auto-amount').val("");
  }
}

function GetAutoList() {
  let listAut = [];
  $('.auto-coin').each(function () {
    listAut.push([$(this).attr('symbol'), $(this).attr('amount')]);
  });
  return listAut;
}

function CreateAutoList(data) {
  for (var i = 0; i < data.length; i++) {
    AddAutoRow(data[i][0], data[i][1])
  }
}

function UpdateFav(mast, alt) {
  let mastsym = mast.toUpperCase();
  let altsym = alt.toUpperCase();

  let symb = altsym + mastsym;
  if ($('#menu-fav .' + symb).length >= 1) {
    $('#menu-fav .' + symb).remove();
  } else {
    let favRow = `<li class="menu-symbol ${altsym}${mastsym}" mast="${mastsym}" alt="${altsym}">`;
    favRow += '<a href="#" class="item-symbol">';
    favRow += `<i class="fa fa-circle-o"></i>${altsym}-${mastsym}<span class="pull-right label"></span></a>`;
    favRow += '</li>';
    $('#menu-fav').append(favRow);
  }
  let fav = [];
  $('#menu-fav .menu-symbol').each(function () {
    fav.push($(this).attr('alt') + "-" + $(this).attr('mast'));
  });
  SetFav(fav.toString());
}

function AddFavRow(data) {
  let favRow = data.split(',');
  for (var i = 0; i < favRow.length; i++) {
    let symb = favRow[i].split('-');
    let frow = `<li class="menu-symbol ${symb[0]}${symb[1]}" mast="${symb[1]}" alt="${symb[0]}">`;
    frow += '<a href="#" class="item-symbol">';
    frow += `<i class="fa fa-circle-o"></i>${symb[0]}-${symb[1]}<span class="pull-right label"></span></a>`;
    frow += '</li>';
    $('#menu-fav').append(frow);
  }
}

function LoadHis(data) {
  $('#tbl-history tbody').html("");
  for (let i = 0; i < data.length; i++) {
    let row = "";
    row += `<tr>`;
    row += `<td>`;
    row += `<p class="his-info text-red text-bold">${data[i].his[1]}</p>`;
    row += `<p class="his-info text-muted">${FormatTime(data[i].his[0])}</p>`;
    row += `</td>`;
    row += `<td><p class="his-info">${data[i].his[2].toLowerCase()}</p>`;
    row += `<p class="his-info">${data[i].his[3].toLowerCase()} </p>`;
    row += `</td>`;
    row += `<td><p class="his-info">${data[i].his[5]}</p>`;
    row += `<p class="his-info">${data[i].his[6]}</p>`;
    row += `</td>`;
    row += `</tr>`;
    $('#tbl-history tbody').append(row);
  }
}

function CheckSignal() {
  if ($('#auto-enabled').prop('checked') == true) {
    $('.auto-coin').each(function () {
      CalcAutoSignal($(this).attr('symbol').replace('-', ""));
    });
  }
}

function CalcAutoSignal(symb) {
  try {
    var currentsymbol = symb;
    mast = currentsymbol.substr(currentsymbol.length - 3, currentsymbol.length);
    alt = currentsymbol.substr(0, currentsymbol.length - 3);
    request({
      headers: {
        "path": `get_signal?currency=${alt}-${mast}&market=binance`,
        "origin": "https://exacoin.co",
        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
        "accept": "*/*",
        "referer": "https://exacoin.co/dashboard/ai-signal",
        "authority": "signal3.exacoin.co",
        "scheme": "https"
      },
      uri: `https://signal3.exacoin.co/get_signal?currency=${alt}-${mast}&market=binance`,
      method: 'GET'
    }, function (err, res, body) {
      if (err) {
        console.log(err);
      } else {
        try {
          let data = JSON.parse(JSON.parse(body).result);
          let symb = JSON.parse(body).currency.replace('-', "").toUpperCase();
          CalcNotifySignal(symb, data);
        } catch (e) { console.log(e) }
      }
    });
  } catch (e) { console.log(e) }
}

function LoadTradeList(data) {
  try {
    if (data.length != 0) {
      $('#tbl-trade tbody').html("");
      for (let i = 0; i < data.length; i++) {
        let s_price = global.prices[data[i].symbol];
        let percent = 0,
          coin = 0;
        if (data[i].price_s != 0)
          s_price = data[i].price_s;
        percent = (s_price - data[i].price_b) / data[i].price_b * 100;
        percent = Math.round(percent * 10) / 10;
        coin = (s_price - data[i].price_b) * data[i].amount;
        coin = Math.round(coin * 100000) / 100000;
        let row = "";
        row += `<tr class="trade-${data[i].symbol} trade-list-item" orderId="${data[i].orderId}" symb="${data[i].symbol}" prib="${data[i].price_b}" spri="${data[i].price_s}" cpri="${global.prices[data[i].symbol]}" amou="${data[i].amount}" tid="${data[i]._id}">`;
        row += `  <td class="trade-item">`;
        row += `    <p class="his-info">`;
        row += `      <span class="text-small">${data[i].symbol}</span> `;
        row += `      <span class="text-navy curent-price">${global.prices[data[i].symbol]}</span> `;
        row += `    </p>`;
        row += `    <p class="his-info text-muted">`;
        row += `      <span class="text-navy">`;
        row += `        <span>${parseFloat(data[i].amount)}</span> \\ `;
        row += `        <span class="per-profit">${percent}%</span>`;
        row += `        <span class="mas-profit">${coin}</span>`;
        row += `      </span>`;
        row += `    </p>`;
        row += `  </td>`;
        row += `  <td class="text-right text-bold trade-item">`;
        row += `    <p class="his-info text-light-blue">${data[i].price_b}</p>`;
        row += `    <p class="his-info text-red sell-price">${data[i].price_s}</p>`;
        row += `  </td>`;
        row += `  <td class="text-right">`;
        row += `    <a><i class="fa fa-trash-o trade-delete"></i></a>`;
        row += `  </td>`;
        row += `</tr>`;
        $('#tbl-trade tbody ').append(row);
      }
    }
  } catch (e) { console.log(e) }
}

function DeleteTradeRow(result, id) {
  if (result == 0) {
    DeleteTrade(id);
  }
}

function SellTrade(answer, symb, price) {
  if (answer == 0) {
    let sellamount = GetSellAmountAvail(symb);
    PlaceLimitOrder(symb, sellamount, price, "sell");
  }
}

function RemoveTrade(id) {
  $('.trade-list-item').each(function () {
    if ($(this).attr('tid') == id)
      $(this).remove();
  });
}

function LoadOpenOrderList(data) {
  let count = data.length;
  $('.open-order-count').text(count);
  $('#open-order-list').html("");
  for (let i = 0; i < count; i++) {
    let time = FormatTime(data[i].time);
    let row = "";
    row += `<li class="open-order-item" orderId="${data[i].orderId}" symb="${data[i].symbol}" >`;
    row += `<a href="#" class="text-bold">`;
    if(data[i].side=="BUY"){
      row += `<div class="pull-left"><p class="bg-navy open-order-icon">B</p></div>`;  
    }else{
      row += `<div class="pull-left"><p class="bg-red open-order-icon">S</p></div>`;  
    }
    row += `<h4>${data[i].symbol}<small><i class="fa fa-clock-o"></i> ${time}</small></h4>`;
    row += `<p><span>${parseFloat(data[i].origQty)}</span>`;
    row += `<span class="pull-right">${parseFloat(data[i].price)}</span></p>`;
    row += `</a>`;
    row += `</li>`;
    $('#open-order-list').append(row);
  }
}

function CancelOpenOrder(answer, symb, orderId) {
  if (answer == 0) {
    CancelOrder(symb, orderId);
  }
}

// ----------------------- SMALL FUNCTION

function CheckKey() {
  if ($('#apiKey').val() != "" && $('#secretKey').val() != "") {
    return true;
  } else {
    return false;
  }
}

function FormatTime(time) {
  var myDate = new Date(parseInt(time, 10));
  return moment(myDate).format('MM/DD HH:mm:ss');
}

function SplitChartData(data) {
  try {
    var Keys = Object.keys(data);
    var AData = [];
    for (var i = 0; i < Keys.length; i++) {
      var key = Keys[i];
      var temp = [FormatTime(key), data[key].open, data[key].close, data[key].low, data[key].high];
      AData.push(temp);
    }

    var categoryData = [];
    var values = []
    var datalength = parseInt(AData.length / 1.235);
    for (var i = 0; i < AData.length; i++) {
      categoryData.push(AData[i].splice(0, 1)[0]);
      values.push(AData[i])
    }
    return {
      categoryData: categoryData,
      values: values
    };
  } catch (e) { console.log(e) }
}

function InitChart() {
  //var markpointdata = CreateMarkPoint();
  option = {

    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function (params, ticket, callback) {
        //console.log(params);
        return params[0].axisValue + "<br> L/H: " + params[0].value[3] + " / " + params[0].value[4] + '<br>O/C: ' + params[0].value[1] + " / " + params[0].value[2];
      }
    },
    grid: {
      top: 10,
      left: 0,
      right: 15,
      bottom: 0,
      backgroundColor: 'transparent'
    },
    xAxis: {
      show: false,
      type: 'category',
      data: [],
      // data: data.categoryData,
      scale: true,
      boundaryGap: false,
      axisLine: {
        onZero: false
      },
    },
    yAxis: {
      show: false,
      scale: true,
      splitLine: {
        show: false
      }
    },
    dataZoom: [{
      type: 'inside',
      start: 80,
      end: 100
    }],
    series: [{
      name: 'a',
      type: 'candlestick',
      // data: data.values,
      data: [],
      itemStyle: {
        normal: {
          color: upColor,
          color0: downColor,
          borderColor: upBorderColor,
          borderColor0: downBorderColor
        }
      },
      markPoint: {
        label: {
          normal: {
            formatter: function (param) {
              return param != null ? Math.round(param.value) : '';
            }
          }
        },
        // data: markpointdata
        data: []
      }
    }]
  };
  if (option && typeof option === "object") {
    window["CoinChart"].setOption(option, true);
  }
  $(window).on('resize', function () {
    try {
      window["CoinChart"].resize();
    } catch (e) { console.log(e) }
  });
}

function UpdateDataChart(xData, sData) {
  window["CoinChart"].setOption({
    xAxis: {
      data: xData
    },
    series: [{
      data: sData
    }]
  });
  $('#chart-loading').addClass('hidden');
}

function CalcPercentAmount(symb, percent, side) {
  let mast = symb.substring(symb.length - 3, symb.length);
  let alt = symb.substring(0, symb.length - 3);
  let price = $('#symbol-price').text();
  let amountper = 0;
  if (side == "buy") {
    let avail = parseFloat($('#Amount-' + mast).text()) - parseFloat($('#Amount-Lock-' + mast).text());
    amountper = (avail * percent / 100) / price;
  } else {
    let avail = parseFloat($('#Amount-' + alt).text()) - parseFloat($('#Amount-Lock-' + alt).text());
    amountper = avail * percent / 100;
  }
  return CalcAmount(symb, amountper, price);
}

function CalcNotifySignal(symb, data) {
  if (data.notify.length != 0) {
    let ntf = data.notify[0];
    let jump = data.mark_jump;
    if (ntf.signal == "sell") {
      let amount = GetSellAmountAvail(symb);
      if (amount != 0) {
        let current = global.prices[symb];
        console.log("Calc point sell " + symb);
        if (CalcSellPrice(symb, current) == true) {
          PlaceLimitOrder(symb, amount, ntf.value, "sell");
        }
      }
    } else {
      let amount = GetBuyAmountAvail(symb, ntf.value);
      if (amount != 0) {
        let current = global.prices[symb];
        AddLog("Check point buy " + symb + " " + current);
        console.log("Calc point buy " + symb);
        if (CalcBuyPrice(symb, current) == true) {
          PlaceLimitOrder(symb, amount, current, "buy");
        }
      }
      //      Log
      //      console.log(symb + ' ' + amount + ' ' + ntf.signal + " " + FormatTime(ntf.system_date) + " - " + ntf.value);
    }
  } else {
    window[symb] = undefined;
  }
}

function GetSellAmountAvail(symb) {
  let alt = symb.substring(0, symb.length - 3);
  let AutoAmount = $('.auto-' + symb).attr('amount');
  let AvailAmount = $('#Amount-' + alt).text();
  if (AvailAmount == "") {
    AutoAmount = 0;
  } else {
    if (AvailAmount <= AutoAmount * 10 / 100) {
      AutoAmount = 0;
    } else {
      if (AutoAmount > AvailAmount) {
        AutoAmount = AvailAmount;
      }
    }
  }
  return AutoAmount;
}

function GetBuyAmountAvail(symb, price) {
  let alt = symb.substring(0, symb.length - 3);
  let mast = symb.substring(symb.length - 3, symb.length);
  let AutoAmount = $('.auto-' + symb).attr('amount');
  let AvailAmount = $('#Amount-' + alt).text();
  let MastAmount = $('#Amount-' + mast).text();
  if (AvailAmount != "") {
    if (AvailAmount >= AutoAmount) {
      return 0;
    } else {
      if (AvailAmount >= (AutoAmount * 70) / 100) {
        AutoAmount = 0;
      } else {
        if (AutoAmount * price > MastAmount) {
          AutoAmount = MastAmount / price;
        } else {
          AutoAmount = AutoAmount - AvailAmount;
        }
      }
    }
  }
  return AutoAmount;
}

function CalcSellPrice(symb, price) {
  let result = false;
  if (CheckSellPercent(symb, price) == 1) {
    if (window[symb] === undefined) {
      window[symb] = {
        first: price,
        current: price,
        step: 0,
        order: false
      };
      AddLog("Sell " + symb + " init check " + price);
      result = false;
    } else {
      if (window[symb].current <= price) {
        window[symb].current = price;
        if (window[symb].step > 0 && window[symb].current < price){
          window[symb].step = window[symb].step - 1;
        }
        AddLog("Sell " + symb + "\t" + " price up " + price);
        result = false;
      } else {
        window[symb].current = price;
        window[symb].step = window[symb].step + 1;
        AddLog("Sell " + symb + "\t" + " price down " + price);
        if (window[symb].step >= CountPrice) {
          if (window[symb].order == false) {
            window[symb].order = true;
            AddLog("Sell " + symb + "\t" + " OK " + price);
            result = true;
          } else {
            AddLog("Sell " + symb + "\t" + " ordered ");
            result = false;
          }
        } else {
          AddLog("Sell " + symb + "\t" + " count " + window[symb].step);
          result = false;
        }
      }
    }
  } else {
    AddLog("Sell " + symb + "\t" + " percent check fail ");
    result = false;
  }
  
  return result;
}

function CalcBuyPrice(symb, price) {
  if (CheckBuyOrdered(symb) == true) {
    if (window[symb] === undefined) {
      window[symb] = {
        first: price,
        current: price,
        step: 0,
        order: false
      };
      AddLog("Buy " + symb + "\t" + " init check " + price);
      return false;
    } else {
      if (window[symb].current >= price) {
        window[symb].current = price;
        if (window[symb].step > 0 && window[symb].current > price)
          window[symb].step = window[symb].step - 1;
        AddLog("Buy " + symb + "\t" + " price down " + price);
        return false;
      } else {
        window[symb].current = price;
        window[symb].step = window[symb].step + 1;
        AddLog("Buy " + symb + "\t" + " price up " + price);
        if (window[symb].step >= CountPrice && window[symb].first > window[symb].current) {
          if (window[symb].order == false) {
            window[symb].order = true;
            AddLog("Buy " + symb + "\t" + " OK " + price);
            return true;
          } else {
            AddLog("Buy " + symb + "\t" + " ordered " + price);
            return false;
          }
        } else {
          AddLog("Buy " + symb + "\t" + window[symb].step + "/" + CountPrice + " \t" + price);
          return false;
        }
      }
    }
  } else {
    return false;
  }
}

function CheckBuyOrdered(symb) {
  let OpenOrder = global.openOrders;
  for (let i = 0; i < OpenOrder.length; i++) {
    if (OpenOrder[i].symbol == symb) {
      return false;
    }
  }
  return true;
}

function CheckSellPercent(symb, price) {
  let result = 0;
  let percent = 0;
  let profit = $('#auto-prof').val();
  if(profit == "")
    profit = 0.4;
  let stoplost = $('#auto-stop').val();
  if ($('.trade-' + symb).length != 0) {
    $('.trade-' + symb).each(function () {
      if ($(this).attr('spri') == 0) {
        let price_buy = $('.trade-' + symb).attr('prib');
        let amo = $('.trade-' + symb).attr('amou');
        let mas = $('.trade-' + symb).attr('symb');
        mas = mas.substring(mas.length - 3, mas);
        percent = (price - price_buy) / price_buy * 100;
        if (percent > profit){
          result = 1
        }
        else{
          if(percent <= stoplost && stoplost != ""){
            result = 1
          }
          else{
            result = 0
          }
        }
      }
    });
  } else {
    AddLog(symb + " not in trade list");
    console.log("Not in trade list");
    result = 1;
  }
  return result;
}

function SearchCoin(Key) {
  if(Key != ""){
    $('.menu-symbol').addClass('hidden');
    $('.menu-symbol').each(function () {
//      let mast = $(this).attr('mast');
//      let alt = $(this).attr('alt');
//      let symb = alt + mast;
      if($(this).attr('class').indexOf(Key) != -1)
        $(this).removeClass('hidden');
    });
  }else{
    $('.menu-symbol').removeClass('hidden');
  }
}

function AddLog(logstring){
  let count = $('#tab-log p').length;
  if( $('#tab-log p').length >= 150){
    $('#tab-log p')[count-1].remove();
  }
  $('#tab-log').prepend('<p>'+ moment().format("MM/DD HH:mm:ss") +' : '+logstring.toUpperCase()+'</p>')
}

function CheckAutoCoinError(){
  if($('.auto-coin').length == 0){
    location.reload();
  }
}