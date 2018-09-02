var _token = false;
var bars = [];
var loaded = false;

setTimeout(function(){
  app.getToken();
},250);

//chrome.browserAction.setBadgeText({ text: "..." }); // We have 10+ unread items.
chrome.browserAction.setBadgeBackgroundColor({ color:"#2E7D32"}); // We have 10+ unread items.

var app = {
    getToken: function(){



      chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
        if(!token)
        {
          console.log("No hay token!");
          return false;
        }
        _token = token;
        localStorage.token = token;
        app.getAccountID(token);

      });

    },
    continue: function(){
      return true;
      var time = new Date();
      var lastCheck = time.getMinutes();
      if(localStorage.lastCheck)
      {
        if(parseFloat(lastCheck) - parseFloat(localStorage.lastCheck) < 15)
        {
            return false;
        }
        localStorage.lastCheck = lastCheck;
        return true;
      }
      localStorage.lastCheck = lastCheck;
      return true;
    },
    getAccountID : function(token)
    {
      $.getJSON('https://www.googleapis.com/adsense/v1.4/accounts', {access_token:token}, function(data, textStatus, xhr) {
        localStorage.accounts = JSON.stringify(data);
        localStorage.accountID = JSON.stringify(data.items[0]);
        app.report(token);
      });
    },
    report: function(token){
      if(!localStorage.token && !token)
      {
        console.log("No Hay token!");
        return false;
      }
      if(!token)
        token = localStorage.token;

      accountID = JSON.parse(localStorage.accountID);

      if(!app.continue())
      {
          app.render();
          return false;
      }

      var date = new Date();
      $(".account-name").text(accountID.name);
      $(".account-id").text(accountID.id);
      $(".account-timezone").text(accountID.timezone);
      if(!accountID.premium)
        $(".account-premium").text('Premium: No');
      else
        $(".account-premium").text('Premium: Yes');
      // Ultimo mes
      $.getJSON('https://www.googleapis.com/adsense/v1.4/accounts/' + accountID.id + '/reports', {useTimezoneReporting:true,access_token:token,startDate: lastMonth('start'),endDate:lastMonth(),metric:'EARNINGS',dimension:'DATE'}, function(data, textStatus, xhr) {
        localStorage.earnings_last = JSON.stringify(data);

          // Toda la vida
        $.getJSON('https://www.googleapis.com/adsense/v1.4/accounts/' + accountID.id + '/reports', {useTimezoneReporting:true,access_token:token,startDate: '2003-06-18',endDate:'today',metric:'EARNINGS',dimension:'TOTALS'}, function(data, textStatus, xhr) {
            localStorage.earnings_timelife = JSON.stringify(data);

              $.getJSON('https://www.googleapis.com/adsense/v1.4/accounts/'+accountID.id+'/payments', {access_token:token,startDate: date.firstDay(),endDate:'today',metric:'EARNINGS',dimension:'DATE'}, function(data, textStatus, xhr) {
                  localStorage.payments = JSON.stringify(data);
                $.getJSON('https://www.googleapis.com/adsense/v1.4/accounts/' + accountID.id + '/reports', {useTimezoneReporting:true,access_token:token,startDate: date.firstDay(),endDate:'today',metric:'EARNINGS',dimension:'DATE'}, function(data, textStatus, xhr) {
                    localStorage.earnings = JSON.stringify(data);
                    app.render(data);
                  });

                });

          });



      });

    },
    render: function(data){
      if(!data)
      {
        if(localStorage.earnings)
        {
          data = JSON.parse(localStorage.earnings);
        }
      }

      if(localStorage.earnings_timelife)
      {
        dataLast = JSON.parse(localStorage.earnings_timelife);

        $(".timelife strong").text(parseFloat(dataLast.totals[0]).toLocaleString(undefined,{ style: 'currency', currency: dataLast.headers[0].currency}));
      }



      if(localStorage.payments)
      {
        payments = JSON.parse(localStorage.payments);
        if(payments.items[0].id == 'unpaid')
        {
          $(".unpaid strong").text(parseFloat(payments.items[0].paymentAmount).toLocaleString(undefined,{ style: 'currency', currency: payments.items[0].paymentAmountCurrencyCode}));
        }

        if(payments.items[1].id != 'unpaid')
        {
          $(".lastPayment span").text(payments.items[1].paymentDate);
          $(".lastPayment strong").text(parseFloat(payments.items[1].paymentAmount).toLocaleString(undefined,{ style: 'currency', currency: payments.items[1].paymentAmountCurrencyCode}));
        }


      }





      $(".today strong div").text(parseFloat(data.rows[data.rows.length-1][1]).toLocaleString(undefined,{ style: 'currency', currency: data.headers[1].currency}));

      if(getHour()>6)
          $(".today strong div").attr("title","Forecast: "+(((parseFloat(data.rows[data.rows.length-1][1])/getHour())*24)*((24.1-getHour())/10)).toFixed(2).toLocaleString(undefined,{ style: 'currency', currency: data.headers[1].currency}));
      $(".today-month strong div").text(parseFloat(data.totals[1]).toLocaleString(undefined,{ style: 'currency', currency: data.headers[1].currency}));

      if(data.rows.length>5)
        $(".today-month strong div").attr("title","Forecast: "+(parseFloat(data.averages[1])*daysInThisMonth()).toLocaleString(undefined,{ style: 'currency', currency: data.headers[1].currency}));



      $(".table table tbody").empty();

      $.each(data.rows,function(index, el) {
        bars.push({y:el[0],a:el[1]});
        $(".table table tbody").append("<tr data-index='"+index+"' class='compare c-"+index+"'><td class='m'></td><td class='usd'></td></tr>");
        $(".table table tbody").append("<tr><td>"+moment(el[0]).format("LL") +" <span data-value='"+el[1]+"' class='compare icon icon-"+index+"'></span></td><td class='usd2'>$"+parseFloat(el[1]).toLocaleString()+"</td></tr>");

      });

      if(localStorage.earnings_last)
      {
        dataLast = JSON.parse(localStorage.earnings_last);

        $(".lastMonth strong").text(parseFloat(dataLast.totals[1]).toLocaleString(undefined,{ style: 'currency', currency: dataLast.headers[1].currency}));
        var totalNow = 0;
        var totalLast = 0;
        $.each(dataLast.rows,function(index, el) {
          $(".c-"+index+" .m").html(moment(el[0]).format("LL"));
          $(".c-"+index+" .usd").html(parseFloat(el[1]).toLocaleString(undefined,{ style: 'currency', currency: dataLast.headers[1].currency}));
          var valueNow = parseFloat($(".icon-"+index).attr("data-value"));
          if($(".icon-"+index).attr("data-value"))
          {
            totalNow = parseFloat(totalNow)+parseFloat(valueNow);

            totalLast = totalLast+parseFloat(el[1]);

          }


          $(".icon-"+index).removeClass('red');
          if(valueNow>parseFloat(el[1]))
          {
            $(".icon-"+index).text('↑');

          }
          else{
            $(".icon-"+index).text('↓');
            $(".icon-"+index).addClass('red');
          }
          var title = (valueNow-parseFloat(el[1])).toFixed(2);
          title = ""+title+" \n"+(((valueNow*100)/parseFloat(el[1]))-100).toFixed(2)+"%";
          $(".icon-"+index).attr("title",title);
        });

        $("i.compare.icon").removeClass('red');
        if(totalNow>totalLast)
        {
          $("i.compare.icon").text('↑');

        }
        else{
          $("i.compare.icon").text('↓');
          $("i.compare.icon").addClass('red');
        }

        title = (parseFloat(totalNow)-parseFloat(totalLast)).toFixed(2);
        title = ""+title+" \n"+(((totalNow*100)/totalLast)-100).toFixed(2)+"%";
        $("i.compare.icon").attr("title",title);



      }

      $(".table table tbody").each(function(elem,index){
      var arr = $.makeArray($("tr",this).detach());
      arr.reverse();
        $(this).append(arr);
      });

      loaded = true;

      var earnings = parseFloat(data.rows[data.rows.length-1][1]);
      var fix = 1;
      if(earnings<10)
        fix = 2
      if(earnings>=100)
          fix = 0
      earnings = earnings.toFixed(fix);
      chrome.browserAction.setBadgeText({text: earnings.toLocaleString()}); // We have 10+ unread items.
      


      chrome.browserAction.setTitle({
        title:'Simply Adsense \n\nToday so far: '+$(".today strong div").text()+"\n"+"This month so far: "+$(".today-month strong div").text()+"\n"+"Last month: "+$(".lastMonth strong").text()
      });





    }

}



if(localStorage.earnings)
  app.render();



jQuery(document).ready(function($) {
  $(document).on('click', '.setting', function(event) {
    event.preventDefault();
    $(".setting-div").toggleClass('show');
  });
});

function lastMonth(type) {
  var d = new Date();
  d.setMonth(d.getMonth() - 1);
  d.setDate(1);


  var lastOfMonth = new Date(d.getFullYear(), d.getMonth() +1, 0);

  var mm = d.getMonth() + 1; // getMonth() is zero-based

  var dd = lastOfMonth.getDate();


  if(type=='start')
    dd = 1;

  return [d.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
        ].join('-');
}



function daysInThisMonth() {
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
}

function getHour() {
    var d = new Date();
    var n = d.getHours();
    return n;
}

Date.prototype.firstDay = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = 1;

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
        ].join('-');
};
